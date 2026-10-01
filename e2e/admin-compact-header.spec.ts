import { expect, test } from '@playwright/test';

const number = {
  number_id: 1, display_number: '9988 998 877', number_value: '9988998877',
  title_label: 'VIP Number', badge: 'PREMIUM', mrp: 50000, offer_price: 45000,
  status: 'AVAILABLE', visibility_type: 'ONLINE', rtp_status: 'RTP', stock: 1,
};

test('logged-in shortcuts, admin notifications, themed filters and server paging', async ({ page }, testInfo) => {
  const listRequests: any[] = [];
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-admin-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'VNW Administrator', role: 'ADMIN', email: 'admin@example.test' }));
  });
  await page.route('http://localhost:3002/vipnumberworld/**', async (route) => {
    const url = route.request().url();
    const payload = route.request().postDataJSON?.() || {};
    let data: any = [];
    if (url.endsWith('/admin/numbers/list')) {
      listRequests.push(payload);
      data = { items: [number], total: 45, page: Number(payload.page || 1), limit: Number(payload.limit || 20), pages: Math.ceil(45 / Number(payload.limit || 20)) };
    } else if (url.endsWith('/notifications/get')) {
      data = [{ notification_id: 3, title: 'Order ready', message: 'A new order needs review.', type: 'order', is_read: 'false', created_at: '2026-09-30T10:00:00Z' }];
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, info: 'OK', data }) });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (const label of ['My Pre-books', 'My Orders', 'Cart', 'Wishlist']) {
    await expect(page.locator('.public-header__shortcuts').getByRole('link', { name: label })).toBeVisible();
  }
  const headerOverflow = await page.locator('.public-header__panel').evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(headerOverflow).toBeLessThanOrEqual(1);

  await page.goto('/admin/numbers', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('navigation', { name: 'Table pagination' })).toContainText('of 45');
  await expect(page.locator('.admin-shell h1')).toHaveCount(0);
  await expect(page.getByText('Welcome back')).toHaveCount(0);
  await expect(page.getByText('Quick Find')).toHaveCount(0);
  await page.getByRole('button', { name: 'Notifications', exact: true }).click();
  await expect(page.getByText('Order ready')).toBeVisible();
  await page.getByRole('button', { name: 'Notifications', exact: true }).click();
  await page.getByRole('combobox', { name: 'Filter number status' }).click();
  await expect(page.getByRole('option', { name: 'AVAILABLE' })).toBeVisible();
  await page.getByRole('option', { name: 'AVAILABLE' }).click();
  await expect.poll(() => listRequests.at(-1)?.status).toBe('AVAILABLE');
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect.poll(() => listRequests.at(-1)?.page).toBe(2);
  await page.screenshot({ path: testInfo.outputPath('admin-numbers.png') });
});
