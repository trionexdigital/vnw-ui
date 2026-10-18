import { expect, test, type Page } from '@playwright/test';

const avatar = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="purple"/></svg>').toString('base64');
const item = { number_id: 7, number_value: '9876543210', display_number: '98765 43210', mrp: 1999, offer_price: 999.99, stock: 1, status: 'AVAILABLE', rtp_status: 'RTP', title_label: 'VIP Number', badge: 'NONE' };
const billing = (coupon = false) => ({ mrp_total: 1999, offer_savings: 999.01, subtotal: 999.99, discount: coupon ? 100 : 0, taxable_amount: coupon ? 899.99 : 999.99, gst_percent: 18, gst_amount: coupon ? 162 : 180, total: coupon ? 1061.99 : 1179.99, coupon_code: coupon ? 'SAVE10' : null, items: [item] });
async function mocks(page: Page, role = 'USER') {
  await page.addInitScript(({ avatar, role }) => {
    localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ user_id: 1, full_name: 'VNW Administrator', email: 'admin@example.test', role, logo: avatar }));
    localStorage.setItem('vnw_compare', '[7,8]');
  }, { avatar, role });
  await page.route('http://localhost:3002/vipnumberworld/**', async route => {
    const url = route.request().url(); const body = route.request().postDataJSON() || {};
    if (url.endsWith('/orders/quote') && body.coupon_code === 'INVALID') return route.fulfill({ json: { status: -33, info: 'Coupon code was not found or is inactive.' } });
    const data = url.endsWith('/orders/quote') ? billing(body.coupon_code === 'SAVE10')
      : url.endsWith('/numbers/detail') ? { ...item, number_id: body.number_id }
      : url.endsWith('/cart/list') ? { items: [item], subtotal: 999.99, count: 1 }
      : url.endsWith('/wishlist/list') ? { items: [item], count: 1 }
      : url.endsWith('/numbers/list') ? { items: [item], total: 1 }
      : url.endsWith('/numbers/similar') ? { items: [] }
      : url.endsWith('/auth/me') ? { user_id: 1, full_name: 'VNW Administrator', email: 'admin@example.test', role, logo: avatar }
      : url.endsWith('/admin/settings/get') ? { GST_PERCENT: '18', GLOBAL_NUMBER_DISCOUNT_PERCENT: '0' }
      : [];
    await route.fulfill({ json: { status: 1, data } });
  });
}

test('checkout shows the server quote, applies coupons and keeps valid billing after rejection', async ({ page }, info) => {
  await mocks(page); await page.setViewportSize({ width: 1280, height: 800 }); await page.goto('/checkout');
  await expect(page.getByText('GST (18%)')).toBeVisible(); await expect(page.getByRole('button', { name: 'Pay ₹1,179.99' })).toBeVisible();
  await page.getByLabel('Coupon code', { exact: true }).fill('SAVE10'); await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pay ₹1,061.99' })).toBeVisible();
  await page.getByLabel('Coupon code', { exact: true }).fill('INVALID'); await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('not found'); await expect(page.getByRole('button', { name: 'Pay ₹1,061.99' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('checkout-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 }); await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pay ₹1,179.99' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.screenshot({ path: info.outputPath('checkout-mobile.png'), fullPage: true });
});
test('desktop and mobile purchase and information pages have compact headers without overflow', async ({ page }, info) => {
  await mocks(page);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const url of ['/cart', '/wishlist', '/compare', '/number/7', '/how-it-works', '/family-pack', '/numerology', '/contact']) {
      await page.goto(url); const header = page.locator('.compact-page-header'); await expect(header).toBeVisible();
      expect((await header.boundingBox())!.height).toBeLessThan(150);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      await page.screenshot({ path: info.outputPath(`${url.replaceAll('/', '-')}-${width}.png`), fullPage: true });
    }
  }
});
test('comparison card action pops the header cue and profile photos are consistent', async ({ page }) => {
  await mocks(page); await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/wishlist');
  await page.getByRole('button', { name: 'Remove from compare', exact: true }).click();
  await page.getByRole('button', { name: 'Add to compare', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Added to comparison' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Compare numbers', exact: true })).toHaveClass(/comparison-cue/);
  await expect(page.getByRole('link', { name: 'My Pre-books', exact: true })).not.toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Color theme' })).toHaveCount(0);
  await expect(page.locator('header').getByRole('button', { name: 'Account', exact:true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 }); await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.locator('.public-header__drawer').getByAltText('VNW Administrator profile')).toHaveAttribute('src', avatar);
});
test('carousel crops both frames before upload and admin sidebar uses the saved photo and name', async ({ page }, info) => {
  await mocks(page, 'ADMIN'); await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/admin/carousel/new');
  const editor = page.getByRole('region', { name: 'Carousel image editor' });
  await expect(editor.getByText('Create carousel', { exact: true })).toHaveCount(0); await expect(editor.getByRole('button', { name: 'Back', exact: true })).toHaveCount(0);
  await expect(page.locator('aside').getByAltText('VNW Administrator profile')).toHaveAttribute('src', avatar); await expect(page.locator('aside')).toContainText('VNW Administrator');
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 800; c.height = 600; const x = c.getContext('2d')!; x.fillStyle = '#4b1677'; x.fillRect(0, 0, 400, 600); x.fillStyle = '#c68f13'; x.fillRect(400, 0, 400, 600); return c.toDataURL('image/png').split(',')[1]; });
  for (const device of ['desktop', 'mobile']) {
    await page.getByLabel(`${device} image`).setInputFiles({ name: 'crop.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await expect(page.getByRole('dialog')).toBeVisible(); await page.getByLabel('Crop zoom').fill('1.5');
    await page.getByRole('button', { name: 'Use this crop' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
    const image = page.getByAltText(`${device} carousel preview`); await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => [el.naturalWidth, el.naturalHeight])).toEqual(device === 'desktop' ? [1200, 420] : [640, 800]);
  }
  await page.screenshot({ path: info.outputPath('carousel-cropped-frames.png') });
});
