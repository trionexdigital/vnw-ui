import { test, expect, type Page } from '@playwright/test';
const number = { number_id: 7, number_value: '9876543210', display_number: '98765 43210', mrp: 1999, offer_price: 999.99, stock: 1, status: 'AVAILABLE', rtp_status: 'RTP', title_label: 'VIP Number', badge: 'NONE' };
const bill = { mrp_total: 1999, offer_savings: 999.01, subtotal: 999.99, discount: 0, taxable_amount: 999.99, gst_percent: 18, gst_amount: 180, total: 1179.99, items: [number] };
async function setup(page: Page, status = 'PAID') {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ user_id: 1, full_name: 'Test Buyer', email: 'buyer@example.test', phone: '9999999999', role: 'USER' }));
    (window as any).Cashfree = (options: any) => ({ checkout: async (params: any) => { (window as any).cashfreeCall = { options, params }; } });
  });
  await page.route('http://localhost:3002/vipnumberworld/**', async route => {
    const url = route.request().url();
    const data = url.endsWith('/orders/quote') ? bill
      : url.endsWith('/orders/create') ? { ...bill, order_id: 7, order_no: 'VNW-7' }
      : url.endsWith('/numbers/detail') ? number
      : url.endsWith('/payments/cashfree/create-order') ? { order_id: 7, order_no: 'VNW-7', payment_status: 'PENDING', payment_session_id: 'session-fixture', environment: 'sandbox' }
      : url.endsWith('/payments/cashfree/verify') ? { order_id: 7, order_no: 'VNW-7', order_type: 'PURCHASE', payment_status: status }
      : url.endsWith('/auth/me') ? { user_id: 1, full_name: 'Test Buyer', email: 'buyer@example.test', role: 'USER' }
      : [];
    await route.fulfill({ json: { status: 1, data } });
  });
}
test('regular checkout sends only a Cashfree session to the sandbox SDK', async ({ page }) => {
  await setup(page); await page.goto('/checkout?number_id=7');
  await page.getByRole('button', { name: 'Pay ₹1,179.99' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).cashfreeCall)).toEqual({ options: { mode: 'sandbox' }, params: { paymentSessionId: 'session-fixture', redirectTarget: '_self' } });
  await expect(page.getByText('Secure payment with Cashfree')).toBeVisible();
});

test('pre-book checkout uses Cashfree with the same server billing and reservation', async ({ page }) => {
  await setup(page);
  await page.route('**/numbers/detail', route => route.fulfill({ json: { status: 1, data: { ...number, rtp_status: 'NON_RTP', rtp_available_at: '2026-12-01 00:00:00' } } }));
  await page.route('**/prebooks/quote', route => route.fulfill({ json: { status: 1, data: bill } }));
  await page.route('**/prebooks/create', route => route.fulfill({ json: { status: 1, data: { ...bill, order_id: 7, order_no: 'VNW-7', prebook_id: 9 } } }));
  await page.goto('/pre-book/7/checkout');
  await page.getByRole('button', { name: 'Pay & reserve exclusively' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).cashfreeCall?.options.mode)).toBe('sandbox');
  await expect(page.getByText('Payment hold created for 20 minutes')).toBeVisible();
});
test('mobile and desktop return screens confirm through the API without overflow', async ({ page }, info) => {
  await setup(page);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/payments/return?order_id=7');
    await expect(page.getByRole('heading', { name: 'Payment confirmed' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View order' })).toHaveAttribute('href', '/orders/7');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    await page.screenshot({ path: info.outputPath(`cashfree-return-${width}.png`), fullPage: true });
  }
});
test('an unpaid return can resume the same reservation without creating another app order', async ({ page }) => {
  await setup(page, 'PENDING'); await page.goto('/payments/return?order_id=7&success=1');
  await expect(page.getByRole('button', { name: 'Continue payment' })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('heading', { name: 'Payment confirmed' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue payment' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).cashfreeCall?.params.paymentSessionId)).toBe('session-fixture');
});

test('an expired login returns to the same payment after signing in again', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('cashfree-login-test')) {
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('user', JSON.stringify({ user_id: 1, role: 'USER', email: 'buyer@example.test' }));
      sessionStorage.setItem('cashfree-login-test', '1');
    }
  });
  let checks = 0;
  await page.route('http://localhost:3002/vipnumberworld/**', async route => {
    const url = route.request().url();
    if (url.endsWith('/payments/cashfree/verify') && checks++ === 0) return route.fulfill({ status: 401, json: { info: 'Session expired' } });
    const buyer = { user_id: 1, role: 'USER', full_name: 'Test Buyer', email: 'buyer@example.test', phone: '9999999999' };
    const data = url.endsWith('/auth/login') || url.endsWith('/auth/me') ? buyer
      : url.endsWith('/payments/cashfree/verify') ? { order_id: 7, order_no: 'VNW-7', order_type: 'PURCHASE', payment_status: 'PAID' } : [];
    await route.fulfill({ headers: url.endsWith('/auth/login') ? { token: 'new-test-token', 'access-control-expose-headers': 'token' } : {}, json: { status: 1, data } });
  });
  await page.goto('/payments/return?order_id=7');
  await expect(page).toHaveURL(/\/login\?return_to=/);
  await page.getByPlaceholder('Email address').fill('buyer@example.test');
  await page.getByPlaceholder('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(/\/payments\/return\?order_id=7/);
  await expect(page.getByRole('heading', { name: 'Payment confirmed' })).toBeVisible();
});
