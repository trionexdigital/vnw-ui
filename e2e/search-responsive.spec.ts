import { expect, test, type Page } from '@playwright/test';

const categories = Array.from({ length: 18 }, (_, index) => ({
  slug: `category-${index + 1}`,
  name: `Category ${index + 1}`,
  number_count: 20 - index,
}));

const numbers = Array.from({ length: 18 }, (_, index) => ({
  number_id: index + 1,
  number_value: `987650${String(index).padStart(4, '0')}`,
  display_number: `98765 0${String(index).padStart(4, '0')}`,
  title_label: 'Signature VIP Number',
  badge: 'NONE',
  mrp: 5000 + index * 100,
  offer_price: 4000 + index * 100,
  discount_pct: 20,
  status: 'AVAILABLE',
  categories: [],
}));

async function mockMarketplace(page: Page) {
  const payloads: any[] = [];
  await page.route('**/vipnumberworld/**', async (route) => {
    const url = route.request().url();
    if (url.endsWith('/numbers/list') || url.endsWith('/numbers/ai-search')) {
      payloads.push(route.request().postDataJSON());
    }
    const data = url.endsWith('/categories/list')
      ? categories
      : url.endsWith('/numbers/list') || url.endsWith('/numbers/ai-search')
        ? { items: numbers, total: numbers.length, page: 1, limit: 12, pages: 2 }
        : url.endsWith('/site/hero-stats')
          ? { delivered_numbers: 100, available_numbers: 200, customers_served: 80 }
          : [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 1, info: 'OK', data }),
    });
  });
  return payloads;
}

for (const viewport of [
  { width: 375, height: 812, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1366, height: 768, name: 'desktop' },
]) {
  test(`${viewport.name} exposes the shared search without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockMarketplace(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Find your signature VIP number' })).toBeVisible();
    expect(await page.locator('.home-hero').evaluate((hero) => hero.nextElementSibling?.id)).toBe('vip-search-workbench');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim())).toBe('38 90% 33%');

    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'VIP number results' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
  });
}

test('desktop filter shell stays pinned while only its option panel scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 720 });
  await mockMarketplace(page);
  await page.goto('/shop', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sticky.top-24')).toBeVisible();

  const shell = page.locator('.sticky.top-24');
  const shellTop = await shell.evaluate((element) => element.offsetTop);
  await page.evaluate((top) => window.scrollTo(0, top + 120), shellTop);
  const before = await shell.evaluate((element) => element.getBoundingClientRect().top);
  await page.evaluate((top) => window.scrollTo(0, top + 520), shellTop);
  const after = await shell.evaluate((element) => element.getBoundingClientRect().top);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(2);

  const optionPanel = shell.getByRole('tabpanel');
  expect(await optionPanel.evaluate((element) => getComputedStyle(element).overflowY)).toBe('auto');
});

test('mobile sheet locks background scrolling and sends the selected global predicate', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const payloads = await mockMarketplace(page);
  await page.goto('/shop', { waitUntil: 'domcontentloaded' });

  await page.getByRole('tab', { name: 'Global Search' }).click();
  await page.getByLabel('Match position').selectOption('ends_with');
  await page.getByRole('textbox', { name: 'Digits' }).fill('786');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/global_scope=ends_with.*q=786/);
  await expect.poll(() => payloads.at(-1)?.search?.ends_with).toBe('786');

  await page.getByRole('button', { name: /^Filters/ }).click();
  await expect(page.getByRole('dialog', { name: 'Filter VIP number results' })).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.getByRole('button', { name: 'Close filters' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('Advanced Search is a right drawer on desktop and keeps the neutral page mounted', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await mockMarketplace(page);
  await page.goto('/shop', { waitUntil: 'domcontentloaded' });

  await page.getByRole('tab', { name: 'Advanced Search' }).click();
  const drawer = page.getByRole('dialog', { name: 'Advanced VIP Number Search' });
  await expect(drawer).toBeVisible();
  const bounds = await drawer.boundingBox();
  expect(bounds?.x).toBeGreaterThan(750);
  expect(bounds?.width).toBeLessThanOrEqual(576);
  expect(bounds?.height).toBe(768);
  await expect(page.locator('h1', { hasText: 'VIP number' })).toBeAttached();
});

test('Advanced Search is a viewport-bounded bottom sheet on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockMarketplace(page);
  await page.goto('/shop', { waitUntil: 'domcontentloaded' });

  await page.getByRole('tab', { name: 'Advanced Search' }).click();
  const sheet = page.getByRole('dialog', { name: 'Advanced VIP Number Search' });
  await expect(sheet).toBeVisible();
  await page.waitForTimeout(250);
  const bounds = await sheet.boundingBox();
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(bounds?.x).toBe(0);
  expect(bounds?.width).toBe(375);
  expect(Math.abs(Math.round((bounds?.y || 0) + (bounds?.height || 0)) - viewportHeight)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.body.hasAttribute('data-scroll-locked'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
});
