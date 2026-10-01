import { test, expect, type Page } from '@playwright/test';
const customer = { user_id: 5, full_name: 'Payment Admin', role: 'ADMIN', email: 'admin@example.test' };
const order = { order_id: 7, order_no: 'VNW-PAYMENT-7', order_type: 'PURCHASE', customer_name: 'Test Customer', customer_email: 'buyer@example.test', customer_phone: '9999999999',
  total: 20059.41, mrp_total: 33999, offer_savings: 16999.5, subtotal: 16999.5, discount: 0, taxable_amount: 16999.5, gst_percent: 18, gst_amount: 3059.91,
  payment_status: 'PAID', status: 'PAID', payment_provider: 'CASHFREE', gateway_environment: 'sandbox', gateway_order_id: 'vnw_sb_7', gateway_payment_id: '5007', created_at: '2026-10-01 05:00:00', attempts: 2 };
const overview = { environment: 'sandbox', stats: { total: 1, paid_orders: 1, captured: 20059.41, refunded: 0, net_captured: 20059.41, pending_orders: 0, failed_attempts: 1, review_orders: 0 },
  items: [order], total: 1, daily: [{ day: '2026-10-01', captured: 20059.41 }], methods: [{ method: 'upi', attempts: 2, successful: 1, captured: 20059.41 }] };
const detail = { order, items: [{ display_number: '9161 551 551', price: 16999.5 }],
  attempts: [{ payment_id: 1, gateway_payment_id: '5007', amount: 20059.41, method: 'upi', status: 'SUCCESS', payment_time: '2026-10-01 05:01:00', bank_reference: 'BANK-7', raw_payload: { payment_status: 'SUCCESS', payment_method: { upi_id: '***bank' } } }],
  refunds: [], events: [{ event_id: 2, event_type: 'ORDER_PAID', status: 'PAID', source: 'SERVER', created_at: '2026-10-01 05:01:00', correlation_id: 'trace-7', details: { total: 20059.41 } }], next_event_id: 2 };

async function setup(page: Page, role = 'ADMIN') {
  await page.addInitScript((user) => { localStorage.setItem('token','test-token'); localStorage.setItem('user',JSON.stringify(user)); }, { ...customer, role });
  const calls: string[] = [];
  await page.route('http://localhost:3002/vipnumberworld/**', async (route) => {
    const path = new URL(route.request().url()).pathname; calls.push(path);
    const body = route.request().postDataJSON() || {};
    const data = path.endsWith('/auth/me') ? { ...customer, role }
      : path.endsWith('/admin/payments/overview') ? { ...overview, environment: body.environment }
      : path.endsWith('/admin/payments/detail') ? body.before_event_id ? { ...detail, events: [{ ...detail.events[0], event_id: 1, event_type: 'CHECKOUT_CREATED' }], next_event_id: null } : detail
      : path.endsWith('/admin/payments/reconcile') ? { order_id: 7, payment_status: 'PAID' } : [];
    await route.fulfill({ json: { status: 1, data } });
  });
  return calls;
}

test('payment dashboard and full billing history fit desktop and mobile', async ({ page }, info) => {
  await setup(page);
  for (const width of [1440,375]) {
    await page.setViewportSize({ width, height: 950 }); await page.goto('/admin/payments');
    await expect(page.getByText('Captured · INR', { exact: true })).toBeVisible();
    await expect(page.getByText('1 / 1', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View history' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    await page.screenshot({ path: info.outputPath(`payment-dashboard-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'View history' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Billing snapshot')).toBeVisible(); await expect(dialog.getByText('GST (18%)')).toBeVisible();
    await expect(dialog.getByText('₹3,059.91', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Payment attempts', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Processing timeline')).toBeVisible();
    await dialog.getByRole('button', { name: 'Load earlier history' }).click();
    await expect(dialog.getByText('checkout created', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Check Cashfree' }).click();
    await expect(dialog.getByRole('button', { name: 'Check Cashfree' })).toBeEnabled();
    await page.screenshot({ path: info.outputPath(`payment-history-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  }
});

test('environment selection separates sandbox from live payment analysis', async ({ page }) => {
  await setup(page); await page.goto('/admin/payments');
  await page.getByRole('combobox', { name: 'Payment environment' }).click();
  await page.getByRole('option', { name: 'Production · live payments' }).click();
  const request = page.waitForRequest((req) => req.url().endsWith('/admin/payments/overview') && req.postDataJSON().environment === 'production');
  await page.getByRole('button', { name: 'Apply', exact: true }).click(); await request;
  await expect(page.getByText('production', { exact: true })).toBeVisible();
});

test('a non-admin cannot open the payments dashboard or request its data', async ({ page }) => {
  const calls = await setup(page, 'EMPLOYEE'); await page.goto('/admin/payments');
  await expect(page).toHaveURL(/\/employee$/);
  expect(calls.filter((path) => path.includes('/admin/payments/'))).toHaveLength(0);
  await expect(page.getByRole('button', { name: 'View history' })).toHaveCount(0);
});

test('missing checkout migration produces an actionable message and no gateway session', async ({ page }) => {
  const calls = await setup(page, 'USER');
  await page.addInitScript(() => { (window as any).Cashfree = () => ({ checkout: async () => { throw new Error('Must not open gateway'); } }); });
  const number = { number_id: 7, number_value: '9161551551', display_number: '9161 551 551', mrp: 33999, offer_price: 16999.5, rtp_status: 'RTP', status: 'AVAILABLE', stock: 1 };
  await page.route('**/numbers/detail', (route) => route.fulfill({ json: { status: 1, data: number } }));
  await page.route('**/orders/quote', (route) => route.fulfill({ json: { status: 1, data: { ...order, items: [number] } } }));
  await page.route('**/orders/create', (route) => route.fulfill({ json: { status: -33, info: 'Checkout database update required. Please run 20261001_payment_history_checkout_sqlyog.sql in SQLyog, then restart the API.' } }));
  await page.goto('/checkout?number_id=7'); await page.getByRole('button', { name: 'Pay ₹20,059.41' }).click();
  await expect(page.getByText(/Checkout database update required/).first()).toBeVisible();
  expect(calls.filter((path) => path.endsWith('/payments/cashfree/create-order'))).toHaveLength(0);
});
