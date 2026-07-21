import { expect, test } from '@playwright/test';

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
];

const slugs = [
  'without-248-numbers', 'mirror-numbers', 'semi-mirror-numbers', 'two-digit-numbers',
  'three-digit-numbers', 'counting-numbers', '786-numbers', '108-numbers', 'doubling-numbers',
  'ab-ab-xy-xy-numbers', 'ab-ab-ab-numbers', 'start-ab-ab-numbers', 'middle-ab-ab-numbers',
  'ending-ab-ab-numbers', 'abc-abc-abc-numbers', 'abc-abc-numbers', 'aaa-bbb-numbers',
  'triple-numbers', 'tetra-numbers', 'penta-numbers', 'hexa-numbers', 'septa-numbers',
  'octa-numbers', 'unique-numbers',
];

const catalog = slugs.map((slug, index) => ({
  slug,
  name: slug.split('-').filter((part) => part !== 'numbers').map((part) => part.toUpperCase()).join(' ') + ' Numbers',
  description: `Automatically detected ${slug.replace(/-/g, ' ')} pattern.`,
  icon: 'sparkles',
  examples: ['9876543210'],
  aliases: [],
  sort_order: index + 1,
  priority: index + 1,
  number_count: index % 3,
}));

const doublingCategory = {
  ...catalog.find((category) => category.slug === 'doubling-numbers')!,
  match_spans: [
    { start: 1, end: 3 },
    { start: 3, end: 5 },
    { start: 5, end: 7 },
  ],
};

const doublingNumber = {
  number_id: 101,
  number_value: '9006622121',
  display_number: '9006622121',
  title_label: 'VIP Number',
  badge: 'NONE',
  mrp: 5000,
  offer_price: 4000,
  discount_pct: 20,
  numerology_sum: 2,
  operator: 'Any',
  stock: 1,
  status: 'AVAILABLE',
  categories: [doublingCategory],
  primary_category: doublingCategory,
  category_name: doublingCategory.name,
  category_slug: doublingCategory.slug,
};

async function mockCategoryApi(page: import('@playwright/test').Page, numbers: unknown[] = []) {
  await page.route('http://localhost:3002/vipnumberworld/**', async (route) => {
    const url = route.request().url();
    const data = url.endsWith('/categories/list') ? catalog
      : url.endsWith('/site/hero-stats') ? { delivered_numbers: 7, available_numbers: 3, customers_served: 5 }
        : url.endsWith('/numbers/list') ? { items: numbers, total: numbers.length, pages: numbers.length ? 1 : 0 }
          : [];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 1, info: 'OK', data }),
    });
  });
}

for (const viewport of viewports) {
  test(`highlighted number fits the ${viewport.width}x${viewport.height} viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockCategoryApi(page, [doublingNumber]);
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });

    const numberRail = page.getByRole('img', {
      name: /VIP number, digits 9 0 0 6 6 2 2 1 2 1\. Category: Doubling Numbers\./i,
    });
    await expect(numberRail).toBeVisible();

    const matchedGroups = numberRail.locator('[data-match="true"]');
    await expect(matchedGroups).toHaveCount(3);
    await expect(matchedGroups.nth(0)).toHaveText('00');
    await expect(matchedGroups.nth(1)).toHaveText('66');
    await expect(matchedGroups.nth(2)).toHaveText('22');

    const containment = await numberRail.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        fitsContent: element.scrollWidth <= element.clientWidth + 1,
        left: rect.left,
        right: rect.right,
      };
    });
    expect(containment.fitsContent).toBe(true);
    expect(containment.left).toBeGreaterThanOrEqual(-1);
    expect(containment.right).toBeLessThanOrEqual(viewport.width + 1);
  });
}

for (const viewport of viewports) {
  test(`category discovery fits the ${viewport.width}x${viewport.height} viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockCategoryApi(page);
    await page.goto('/categories', { waitUntil: 'domcontentloaded' });

    const cards = page.locator('[data-category-card]');
    await expect(cards).toHaveCount(24);
    await expect(page.locator('[data-categories-page]')).toBeVisible();
    await expect(cards.first()).toHaveAttribute('href', '/shop?category=without-248-numbers');

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);

    for (const card of await cards.all()) {
      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  });
}

test('homepage category discovery follows the carousel slot', async ({ page }) => {
  await mockCategoryApi(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const section = page.locator('[data-home-category-section]');
  await expect(section).toBeVisible();
  await expect(section.locator('[data-category-card]')).toHaveCount(8);
});
