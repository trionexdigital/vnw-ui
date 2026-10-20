import { expect, test, type Page } from '@playwright/test';

const category = { id: 1, slug: 'doublling-aabbcc', name: 'Doublling (AABBCC)', match_spans: [{ start: 0, end: 3 }, { start: 3, end: 6 }], subcategories: [{ id: 1, name: '2 Couples' }] };
const item = { number_id: 7, number_value: '8008005413', display_number: '8008005413', mrp: 5500, offer_price: 2750, status: 'AVAILABLE', rtp_status: 'RTP', title_label: 'VIP Number', primary_category: category, categories: [category] };
const pack = { pack_id: 'pack-1', title: 'Matching numbers', pack_type: 'MIXED', size: 2, total_price: 5500, is_available: true, is_active: true, numbers: [item, { ...item, number_id: 8 }] };
async function mock(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route('**/vipnumberworld/**', async route => {
    const url = route.request().url();
    const data = url.endsWith('/site/settings') ? { WHATSAPP: '918400084002' }
      : url.endsWith('/numbers/detail') ? item
      : /\/numbers\/(list|featured|similar)$/.test(url) ? { items: Array.from({ length: 7 }, (_, i) => ({ ...item, number_id: i + 7 })), total: 7, pages: 1 }
      : url.endsWith('/categories/list') ? [{ ...category, number_count: 7 }]
      : /\/site\/(family|corporate)-packs$/.test(url) ? [pack]
      : url.endsWith('/site/languages/catalog') ? { translations: {} }
      : url.endsWith('/site/hero-stats') ? { delivered_numbers: 100, available_numbers: 100, customers_served: 50 }
      : [];
    await route.fulfill({ json: { status: 1, info: 'OK', data } });
  });
}
const fits = async (page: Page, width: number) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);

test('search rows, full-width shelves and compact details work in all storefront languages', async ({ page }, info) => {
  test.setTimeout(300_000);
  await mock(page);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const lang of ['en', 'hi', 'mr', 'hg', 'gu', 'bn', 'pa', 'ta', 'te', 'kn', 'ml', 'or']) {
    await page.goto(`/shop?category=doublling-aabbcc&subcategory_id=1&lang=${lang}`);
    await expect(page.locator('.reference-card__digits').first()).toBeVisible();
    for (const width of [320, 375, 768, 1366, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await fits(page, width);
      const chips = await page.locator('.shop-results-chips > button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().y));
      expect(chips[0]).toBe(chips[1]);
      const summary = page.locator('.shop-results-summary');
      expect(await summary.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      if (width >= 768) {
        const heading = (await page.locator('.shop-results-heading').boundingBox())!;
        const controls = (await page.locator('.shop-results-heading [role="group"]').boundingBox())!;
        expect(controls.y).toBeGreaterThanOrEqual(heading.y);
        expect(controls.y + controls.height).toBeLessThanOrEqual(heading.y + heading.height + 1);
      }
    }
    // Exercise SPA navigation from a search result and back to the store.
    await page.locator('.reference-card__number-link').first().click();
    await expect(page.locator('.number-detail-digits')).toHaveText('800 800 5413');
    await expect(page.locator('.number-detail-whatsapp')).toHaveAttribute('href', /wa\.me\/918400084002/);
    await expect(page.locator('textarea')).toHaveCount(0);
    for (const width of [320, 375, 768, 1366, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await fits(page, width);
      expect(await page.locator('.number-detail-digits').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      if (lang === 'en' && [375, 1366].includes(width)) await page.screenshot({ path: info.outputPath(`number-details-${width}.png`), fullPage: true });
    }
    await page.locator('.compact-page-header a[href="/shop"]').click();
    await expect(page.locator('.shop-results-heading')).toBeVisible();
    await page.goto(`/?lang=${lang}`);
    await expect(page.locator('#home-premium .reference-card').first()).toBeVisible();
    for (const width of [320, 375, 768, 1366, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await fits(page, width);
      const bounds = await page.locator('#home-premium, #home-premium .home-rail__track').evaluateAll(nodes => nodes.map(el => { const b = el.getBoundingClientRect(); return { x: b.x, width: b.width }; }));
      for (const b of bounds) { expect(Math.abs(b.x)).toBeLessThanOrEqual(1); expect(Math.abs(b.width - width)).toBeLessThanOrEqual(1); }
    }
    await expect(page.locator('.reference-family__number').first()).toHaveText('800 800 5413');
  }
  expect(errors).toEqual([]);
});

test('callback submits the selected number and unavailable numbers cannot be bought', async ({ page }) => {
  await mock(page);
  let submitted: any;
  await page.route('**/site/enquiry', async route => { submitted = route.request().postDataJSON(); await route.fulfill({ json: { status: 1, info: 'Request sent' } }); });
  await page.goto('/number/7');
  await page.getByLabel('Your name', { exact: true }).fill('Test Customer');
  await page.getByLabel('Phone', { exact: true }).fill('9876543210');
  await page.getByRole('button', { name: 'Call Me', exact: true }).click();
  await expect.poll(() => submitted?.number_id).toBe(7);
  await expect(page.getByLabel('Your name', { exact: true })).toHaveValue('');
  await page.route('**/numbers/detail', route => route.fulfill({ json: { status: 1, data: { ...item, status: 'SOLD' } } }));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Unavailable', exact: true })).toBeDisabled();
});

test('empty results align the heading, readiness controls, filters, count and reset', async ({ page }, info) => {
  await mock(page);
  const numerology = { id: 71, slug: 'numerology-numbers', name: 'Numerology Numbers', number_count: 0, subcategories: [{ id: 183, name: 'Numerology Numbers' }] };
  await page.route('**/categories/list', route => route.fulfill({ json: { status: 1, data: [numerology] } }));
  await page.route('**/numbers/list', route => route.fulfill({ json: { status: 1, data: { items: [], total: 0, pages: 1 } } }));
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/shop?category=numerology-numbers&subcategory_id=183');
  await expect(page.locator('.shop-results-count')).toHaveText('0 exact matches');
  const count = (await page.locator('.shop-results-count').boundingBox())!;
  const reset = (await page.locator('.shop-results-summary button').boundingBox())!;
  expect(count.x + count.width).toBeLessThan(reset.x);
  expect(Math.abs(count.y + count.height / 2 - reset.y - reset.height / 2)).toBeLessThan(1);
  const filters = await page.locator('.shop-results-chips > button').evaluateAll(nodes => nodes.map(el => el.getBoundingClientRect().y));
  expect(filters[0]).toBe(filters[1]);
  await page.screenshot({ path: info.outputPath('search-results-desktop.png') });
  await page.setViewportSize({ width: 375, height: 900 });
  await fits(page, 375);
  await page.screenshot({ path: info.outputPath('search-results-mobile.png') });
  await page.locator('.shop-results-summary button').click();
  await expect(page.locator('.shop-results-chips > button')).toHaveCount(0);
});
