import { expect, test } from '@playwright/test';

const numbers = Array.from({ length: 25 }, (_, index) => ({
  number_id: index + 1,
  number_value: `998800${String(index).padStart(4, '0')}`,
  display_number: `9988 00${String(index).padStart(4, '0')}`,
  badge: 'NONE', mrp: 50000, offer_price: 45000, stock: 1, status: 'AVAILABLE', rtp_status: 'RTP',
  primary_category: { id: 16, slug: 'customer-care-numbers', name: 'Mirror' },
}));

async function mockCatalog(page: import('@playwright/test').Page) {
  await page.route('http://localhost:3002/vipnumberworld/**', async (route) => {
    const url = route.request().url();
    const body = route.request().postDataJSON?.() || {};
    const data = url.endsWith('/numbers/list')
      ? { items: numbers.slice((Number(body.page || 1) - 1) * Number(body.limit || 10), Number(body.page || 1) * Number(body.limit || 10)), total: numbers.length, pages: 3 }
      : url.endsWith('/categories/list')
        ? [{ id: 16, name: 'Mirror', slug: 'customer-care-numbers', subcategories: [] }]
        : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, info: 'OK', data }) });
  });
}

test('header search shows ten live matches, more results, and a full-search link', async ({ page }, testInfo) => {
  await mockCatalog(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const input = page.getByRole('textbox', { name: 'Search all VIP numbers' });
  await input.click();
  const panel = page.getByRole('region', { name: 'Instant VIP number results' });
  await expect(panel.locator('.header-number-search__result')).toHaveCount(10);
  await expect(input).toHaveAttribute('placeholder', 'Search any number');
  await expect(panel.locator('.header-number-search__heading')).toHaveText('Recently added25');
  await expect(panel.getByRole('button', { name: 'View more', exact: true })).toBeVisible();
  const footerRows = await panel.locator('.header-number-search__footer').evaluate(e => Array.from(e.children).map(child => child.getBoundingClientRect().top));
  expect(Math.abs(footerRows[0] - footerRows[1])).toBeLessThan(1);
  const widths = await page.locator('.header-number-search').first().evaluate((search) => ({ field: search.querySelector('form')!.getBoundingClientRect().width, panel: search.querySelector('.header-number-search__panel')!.getBoundingClientRect().width }));
  expect(Math.abs(widths.field - widths.panel)).toBeLessThanOrEqual(1);
  await input.fill('9988');
  await expect(panel.locator('.header-number-search__result')).toHaveCount(10);
  await expect(panel.getByRole('link', { name: 'View all', exact: true })).toHaveAttribute('href', '/shop?mode=global&global_scope=anywhere&q=9988');
  await panel.getByRole('button', { name: 'View more', exact: true }).click();
  await expect(panel.locator('.header-number-search__result')).toHaveCount(20);
  await panel.screenshot({ path: testInfo.outputPath('header-search-desktop.png') });
  await input.press('Escape');
  await expect(panel).toHaveCount(0);
  await input.fill('Mirror');
  await expect(panel.locator('.header-number-search__result')).toHaveCount(10);
  await expect(panel.getByRole('link', { name: 'View all', exact: true })).toHaveAttribute('href', '/shop?category=customer-care-numbers');
});

test('mobile homepage places live search above the hero, outside the menu', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockCatalog(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.public-header__panel').getByRole('img', { name: 'VIP Number World', exact: true })).toBeVisible();
  await expect(page.locator('.public-header__panel').getByRole('link', { name: 'Sign In' })).toBeHidden();
  await expect(page.locator('.public-header__panel').getByRole('link', { name: 'Register' })).toBeHidden();
  await expect(page.locator('.public-header__panel').getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
  await expect(page.locator('.public-header__panel').getByRole('textbox', { name: 'Search all VIP numbers' })).toBeHidden();
  const input = page.locator('.public-home-mobile-search').getByRole('textbox', { name: 'Search all VIP numbers' });
  await expect(input).toBeVisible();
  await expect(page.locator('.public-home-mobile-search')).toBeInViewport();
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  const drawer = page.locator('.public-header__drawer');
  await expect(drawer.getByRole('link', { name: 'Sign In' })).toBeVisible();
  await expect(drawer.getByRole('link', { name: 'Register' })).toBeVisible();
  await expect(drawer.getByText('Menu', { exact: true })).toHaveCount(0);
  await expect(drawer.getByRole('link', { name: 'Compare Numbers' })).toBeVisible();
  const signup = await drawer.getByRole('link', { name: 'Register' }).boundingBox();
  await expect(drawer.getByRole('radiogroup', { name: 'Color theme' })).toHaveCount(0);
  await expect(page.locator('.public-header__panel').getByRole('radiogroup', { name: 'Color theme' })).toHaveCount(0);
  expect(signup!.width).toBeGreaterThanOrEqual(96);
  const signin = await drawer.getByRole('link', { name: 'Sign In' }).boundingBox();
  expect(signin!.width).toBeGreaterThanOrEqual(96);
  expect(Math.abs(signin!.y - signup!.y)).toBeLessThan(1);
  await expect(page.locator('.public-header__drawer').getByRole('textbox', { name: 'Search all VIP numbers' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close navigation menu' }).click();
  await input.fill('9988');
  await expect(page.getByRole('region', { name: 'Instant VIP number results' }).locator('.header-number-search__result')).toHaveCount(10);
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport + 1);
  await page.screenshot({ path: testInfo.outputPath('header-search-mobile.png') });
});

test('navigation and search fit mobile through wide desktop headers', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await mockCatalog(page);
  for (const width of [320, 375, 640, 768, 1024, 1199, 1200, 1280, 1440, 1536, 1700]) {
    await page.setViewportSize({ width, height: 850 });
    if (!page.url().endsWith('/')) await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.public-header__panel').getByRole('img', { name: 'VIP Number World', exact: true })).toBeVisible();
    if (width < 1200) {
      await expect(page.locator('.public-header__panel').getByRole('link', { name: 'Sign In' })).toBeHidden();
      await expect(page.locator('.public-header__panel').getByRole('link', { name: 'Register' })).toBeHidden();
      await expect(page.locator('.public-header__panel').getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
      await expect(page.locator('.public-header__panel').getByRole('textbox', { name: 'Search all VIP numbers' })).toBeHidden();
      await page.getByRole('button', { name: 'Open navigation menu' }).click();
      await expect(page.locator('.public-header__drawer').getByRole('link', { name: 'Sign In' })).toBeVisible();
      await expect(page.locator('.public-header__drawer').getByRole('link', { name: 'Register' })).toBeVisible();
      await expect(page.locator('.public-header__drawer').getByRole('link', { name: 'Compare Numbers' })).toBeVisible();
      const drawer = page.locator('.public-header__drawer');
      const authActions = await drawer.getByRole('link', { name: 'Register' }).boundingBox();
      await expect(drawer.getByRole('radiogroup', { name: 'Color theme' })).toHaveCount(0);
      await expect(page.locator('.public-header__panel').getByRole('radiogroup', { name: 'Color theme' })).toHaveCount(0);
      expect(authActions!.width).toBeGreaterThanOrEqual(96);
      const drawerWidth = await drawer.evaluate((element) => element.scrollWidth - element.clientWidth);
      expect(drawerWidth).toBeLessThanOrEqual(1);
      if (width === 320 || width === 375) await drawer.screenshot({ path: testInfo.outputPath(`mobile-menu-${width}.png`) });
      await expect(page.locator('.public-header__drawer').getByRole('textbox', { name: 'Search all VIP numbers' })).toHaveCount(0);
      await expect(drawer.getByRole('link', { name: 'Pre-book VIP Numbers' })).toBeVisible();
      await page.getByRole('button', { name: 'Close navigation menu' }).click();
      await expect(page.locator('.public-home-mobile-search').getByRole('textbox', { name: 'Search all VIP numbers' })).toBeVisible();
    } else {
      await expect(page.locator('.public-header__panel').getByRole('link', { name: 'Sign In' })).toBeVisible();
      await expect(page.locator('.public-header__panel').getByRole('link', { name: 'Register' })).toBeVisible();
      const input = page.getByRole('textbox', { name: 'Search all VIP numbers' });
      await expect(input).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Family Pack' })).toBeVisible();
      const bounds = await input.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.width).toBeLessThanOrEqual(320);
      const navigation = page.locator('[data-primary-navigation]');
      await expect(navigation.locator('a')).toHaveCount(4);
      await expect(navigation.locator('a[href="/about"]')).toHaveCount(0);
      const lastPrimaryLink = await navigation.getByRole('link', { name: 'Numerology' }).boundingBox();
      const search = await page.locator('.public-header__panel .header-number-search').boundingBox();
      expect(lastPrimaryLink!.x + lastPrimaryLink!.width).toBeLessThanOrEqual(search!.x);
    }
    const headerWidth = await page.locator('.public-header__panel').evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(headerWidth).toBeLessThanOrEqual(1);
    if (width === 375 || width === 1024 || width === 1200 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`header-restored-${width}.png`), clip: { x: 0, y: 0, width, height: 74 } });
  }
});
