import { expect, test } from '@playwright/test';
import pricing from '../../vnw-server/dist/server/pixels/api/numbers/numberPricing.js';
import billing from '../../vnw-server/dist/server/pixels/api/orders/billing.js';
const { calculateNumberPricing } = pricing;
const { calculateBilling } = billing;

test('uploads and repeated edits retain the base, Settings has no discount, and storefront/checkout use saved prices', async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-admin');
    localStorage.setItem('vnw_language', 'en');
    localStorage.setItem('vnw_location_prompt_seen', '1');
    localStorage.setItem('user', JSON.stringify({ user_id: 1, full_name: 'Administrator', role: 'ADMIN', permissions: ['*'] }));
  });
  const original: any = { number_id: 7, number_value: '8008005413', display_number: '8008005413', base_price: null, mrp: '2500.00', offer_price: '1250.00', discount_pct: 50, badge: 'NONE', title_label: 'VIP Number', status: 'AVAILABLE', stock: 1, rtp_status: 'RTP', visibility_type: 'ONLINE', categories: [] };
  const items: any[] = [original]; const writes: any[] = []; let draft: any;
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route('**/vipnumberworld/**', async route => {
    const url = route.request().url(), body = route.request().postDataJSON() || {};
    let data: any = [];
    if (url.endsWith('/auth/me')) data = { user_id: 1, full_name: 'Administrator', role: 'ADMIN' };
    else if (url.endsWith('/admin/numbers/list')) data = { items, total: items.length, page: 1 };
    else if (url.endsWith('/admin/numbers/analyze')) {
      draft = body;
      data = { total: 1, ready: 1, rejected: 0, analysis_token: 'pricing-v2', rows: [{ row: 1, input: body.numbers, values: { number: body.numbers }, reasons: [] }] };
    } else if (url.endsWith('/admin/numbers/save')) {
      writes.push(body); Object.assign(original, body, calculateNumberPricing(body.base_price, body.additional_discount_pct)); data = { number_id: 7 };
    } else if (url.endsWith('/admin/numbers/import/commit')) {
      items.push({ ...original, number_id: 8, number_value: draft.numbers, display_number: draft.numbers, ...calculateNumberPricing(draft.base_price, draft.additional_discount_pct) });
      data = { imported: 1, rejected: 0, rows: [] };
    } else if (url.endsWith('/admin/settings/get')) data = { GST_PERCENT: '0', CONTACT_PHONE: '123' };
    else if (url.endsWith('/admin/settings/save')) { writes.push(body); data = {}; }
    else if (url.endsWith('/numbers/list')) data = { items, total: items.length, pages: 1 };
    else if (url.endsWith('/cart/list')) data = { items: [original], count: 1, subtotal: Number(original.offer_price) };
    else if (url.endsWith('/orders/quote')) data = { ...calculateBilling([original], 0), items: [original] };
    await route.fulfill({ json: { status: 1, info: 'OK', data } });
  });
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/admin/numbers');
  const edit = async () => {
    await page.locator('tbody tr').filter({ hasText: '8008005413' }).locator('td').last().locator('button').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
  };
  const save = async () => {
    await page.getByRole('dialog').getByRole('button', { name: 'Validate', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Save number', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  };
  await edit();
  await expect(page.getByLabel('Base price (₹)')).toHaveValue('2500.00');
  await page.getByLabel('Additional discount (%)').fill('10');
  await expect(page.getByText('₹2,671.88', { exact: true })).toBeVisible();
  for (const width of [320, 375, 768, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const dialog = page.getByRole('dialog');
    expect(await dialog.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    if ([375, 1366].includes(width)) await page.screenshot({ path: info.outputPath(`pricing-form-${width}.png`) });
  }
  await save();
  expect(original.offer_price).toBe('2671.88');
  await edit();
  await expect(page.getByLabel('Base price (₹)')).toHaveValue('2500.00');
  await page.getByLabel('Display title').fill('Updated label');
  await save();
  expect(original.offer_price).toBe('2671.88');
  await edit();
  await page.getByLabel('Additional discount (%)').fill('');
  await save();
  expect(original.offer_price).toBe('2968.75');
  expect(writes.slice(0, 3).every(body => body.base_price === '2500.00' && body.mrp === undefined)).toBe(true);

  await page.getByRole('button', { name: 'Add Number', exact: true }).click();
  await page.getByLabel('Mobile numbers').fill('8008009999');
  await page.getByLabel('Base price (₹)').fill('2500');
  await page.getByRole('dialog').getByRole('combobox', { name: 'Visibility', exact: true }).click();
  await page.getByRole('option', { name: 'Online · public catalog', exact: true }).click();
  await page.getByRole('dialog').getByRole('combobox', { name: 'Porting / activation readiness', exact: true }).click();
  await page.getByRole('option', { name: 'RTA · ready to activate', exact: true }).click();
  await page.getByLabel('Serviceable PIN codes').fill('400001');
  await page.getByRole('button', { name: 'Validate', exact: true }).click();
  await page.getByRole('button', { name: 'Add 1 accepted', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(items[1].offer_price).toBe('2968.75');
  await page.goto('/admin/settings');
  await expect(page.getByText('Store-wide number discount', { exact: true })).toHaveCount(0);
  await expect(page.locator('#global-discount')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  expect(original.offer_price).toBe('2968.75');
  expect(writes.at(-1).GLOBAL_NUMBER_DISCOUNT_PERCENT).toBeUndefined();

  await page.goto('/shop');
  const card = page.getByTestId('number-card').first();
  await expect(card.locator('.reference-card__offer')).toHaveText('₹2,968.75');
  await expect(card.locator('.reference-card__mrp')).toHaveText('₹3,125');
  await expect(card.locator('.reference-card__discount')).toContainText('5% OFF');
  await page.goto('/cart');
  await expect(page.locator('main').getByText('₹2,968.75', { exact: true }).first()).toBeVisible();
  await page.goto('/checkout');
  await expect(page.getByRole('button', { name: 'Pay ₹2,968.75', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
