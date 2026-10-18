import { expect, test } from '@playwright/test';

async function adminSession(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-admin-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, user_id: 1, name: 'VNW Administrator', role: 'ADMIN', email: 'admin@example.test' }));
  });
}

test('bulk numbers are analyzed by the API before accepted rows can be saved', async ({ page }, info) => {
  await adminSession(page);
  const requests: Array<{ url: string; body: any }> = [];
  await page.route('http://localhost:3002/vipnumberworld/**', async (route) => {
    const url = route.request().url();
    const body = route.request().postDataJSON?.() || {};
    requests.push({ url, body });
    const data = url.endsWith('/admin/numbers/list') ? { items: [], total: 0 }
      : url.endsWith('/admin/numbers/analyze') ? { total: 3, ready: 1, rejected: 2, analysis_token: 'server-signed-ticket', rows: [
        { row: 1, input: '9876543210', values: { number: '9876543210' }, reasons: [] },
        { row: 2, input: '8123456789', reasons: ['Number already exists in the catalog.'] },
        { row: 3, input: '123', reasons: ['Enter a valid 10-digit Indian mobile number.'] },
      ] } : url.endsWith('/admin/numbers/import/commit') ? { imported: 1, rejected: 0, rows: [] } : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, data }) });
  });
  await page.goto('/admin/numbers');
  await expect(page.getByRole('button', { name: 'Import', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add Number', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add 0 accepted' })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Mobile numbers' }).fill('9876543210,8123456789\n123');
  await page.getByRole('textbox', { name: 'MRP (₹)' }).fill('4999');
  await page.getByRole('textbox', { name: 'Serviceable PIN codes' }).fill('400001,400002');
  await page.getByRole('button', { name: 'Validate', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Number validation results' })).toContainText('1 ready');
  await expect(page.getByText('Number already exists in the catalog.', { exact: true })).toBeVisible();
  expect(requests.find((request) => request.url.endsWith('/analyze'))?.body.numbers).toBe('9876543210,8123456789\n123');
  expect(requests.find((request) => request.url.endsWith('/analyze'))?.body.serviceable_pin_codes).toEqual(['400001', '400002']);
  await page.screenshot({ path: info.outputPath('bulk-number-analysis.png') });
  await page.getByRole('button', { name: 'Add 1 accepted' }).click();
  await expect(page.getByRole('textbox', { name: 'Mobile numbers' })).toHaveCount(0);
  expect(requests.find((request) => request.url.endsWith('/import/commit'))?.body).toEqual({ analysis_token: 'server-signed-ticket' });
});

test('file import sends the original file, displays server rejections, and imports its analysis ticket', async ({ page }, info) => {
  await adminSession(page);
  let uploaded = ''; let committed: any;
  await page.route('http://localhost:3002/vipnumberworld/**', async (route) => {
    const url = route.request().url(); let data: any = [];
    if (url.endsWith('/admin/numbers/list')) data = { items: [], total: 0 };
    if (url.endsWith('/admin/numbers/analyze')) {
      uploaded = route.request().postData() || '';
      data = { total: 2, ready: 1, rejected: 1, analysis_token: 'file-ticket', rows: [{ row: 2, input: '9876543210', values: { number: '9876543210' }, reasons: [] }, { row: 3, input: '123', reasons: ['Invalid mobile number.'] }] };
    }
    if (url.endsWith('/import/commit')) { committed = route.request().postDataJSON(); data = { imported: 1, rejected: 0, rows: [{ row: 2, input: '9876543210', values: { number: '9876543210' }, number_id: 3, reasons: [] }] }; }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, data }) });
  });
  await page.goto('/admin/numbers');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.getByLabel('Numbers file').setInputFiles({ name: 'numbers.csv', mimeType: 'text/csv', buffer: Buffer.from('number,mrp,serviceable_pin_codes\n9876543210,4999,400001\n123,1000,400001') });
  await page.getByRole('button', { name: 'Analyze file' }).click();
  await expect(page.getByText('Invalid mobile number.', { exact: true })).toBeVisible();
  expect(uploaded).toContain('numbers.csv'); expect(uploaded).toContain('123,1000');
  await page.screenshot({ path: info.outputPath('file-import-analysis.png') });
  await page.getByRole('button', { name: 'Import 1 accepted' }).click();
  await expect(page.getByText('1 numbers imported. 0 entries rejected during the final server check.')).toBeVisible();
  expect(committed).toEqual({ analysis_token: 'file-ticket' });
});

test('carousel editor stays within the admin shell and fits desktop and mobile viewports', async ({ page }, info) => {
  await adminSession(page);
  await page.route('http://localhost:3002/vipnumberworld/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, data: [] }) }));
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto('/admin/carousel/new');
    const editor = page.getByRole('region', { name: 'Carousel image editor' });
    await expect(editor).toBeVisible();
    await expect(page.locator('.admin-shell')).toBeVisible();
    await expect(editor.getByText('Desktop · landscape')).toBeVisible();
    await expect(editor.getByText('Mobile · portrait')).toBeVisible();
    await expect(editor.getByRole('button', { name: 'Save and publish' })).toBeInViewport();
    const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, viewportHeight: innerHeight }));
    expect(size.width).toBeLessThanOrEqual(width + 1);
    expect(size.height).toBeLessThanOrEqual(size.viewportHeight + 1);
    await page.screenshot({ path: info.outputPath(`carousel-editor-${width}.png`) });
  }
});

test('admin profile shortcut opens the profile page without a heading card', async ({ page }) => {
  await adminSession(page);
  await page.route('http://localhost:3002/vipnumberworld/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, data: route.request().url().endsWith('/auth/me') ? { user_id: 1, full_name: 'VNW Administrator', role: 'ADMIN', email: 'admin@example.test' } : [] }) }));
  await page.goto('/admin/numbers');
  await page.getByRole('button', { name: 'Open profile' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText('Manage account details, logo and settings')).toHaveCount(0);
  await expect(page.locator('aside').getByRole('link', { name: 'Profile', exact: true })).toBeVisible();
});
