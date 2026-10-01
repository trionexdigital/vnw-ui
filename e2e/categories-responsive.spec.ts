import { expect, test } from '@playwright/test';

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
];

const entries = [
  ['numerology-numbers', 'Numerology Numbers'], ['penta-vip-mobile-no', 'Penta Numbers'],
  ['doublling-aabbcc', 'Doublling (AABBCC)'], ['vip-mobile-number', 'XYXYXY'],
  ['00xy00-fancy-number', '00xy00'], ['customer-care-numbers', 'Mirror'],
  ['semi-mirror-vip-mobile-number', 'Semi Mirror'], ['choice-mobile-number', 'Tetra Numbers - XXXX'],
  ['unforgettable-vip-number', 'xxxyyy'], ['xyzxyz-fancy-number', 'xyzxyz'],
  ['buy-vip-mobile-number-online', 'Hexa'], ['vip-number-india', 'ABAB-XYXY'],
  ['abcd-abcd-fancy-number', 'abcd-abcd'], ['ascending-descending-fancy-number', 'Asending Desending'],
  ['2-digit-mobile-numbers', 'Minimum Digit Numbers'], ['septa-octa-vip-number-for-sale', 'Septa/Octa'],
  ['best-mobile-number', '10 Digits symmetry'], ['8-9-digits-symmetry', '8 9 Digits symmetry'],
  ['repeating-fancy-mobile-numbers', 'Single digit repeating'], ['vip-number-000', '000'],
  ['Hexa-vip-mobile-number', 'Hexa Zero'], ['786-vip-mobile-numbers', '786'],
  ['fancy-mobile-number-00786', '00786'], ['online-VIP-mobile-number', 'xxyyy xxxyy'],
  ['prepaid-fancy-numbers', '13 with Zeros'], ['vip-number-1313', '13 Repeating'],
  ['vip-mobile-number-india', 'xyxy (2 times)'], ['xy-xy-fancy-mobile-number', 'xy*xy'],
  ['vip-number-sim-card', 'Special Charactors/Digits'], ['golden-mobile-number', 'Normal Fancy Numbers'],
  ['00x00-fancy-number', '00x00'],
] as const;

const catalog = entries.map(([slug, name], index) => ({
  slug,
  name,
  description: `Automatically detected ${slug.replace(/-/g, ' ')} pattern.`,
  icon: 'sparkles',
  examples: ['9876543210'],
  aliases: [],
  sort_order: index + 1,
  priority: index + 1,
  number_count: 31 - index,
  subcategories: slug === 'customer-care-numbers' ? [{ id: 104, name: 'Ulta-Pulta', number_count: 2 }] : [],
}));

const doublingCategory = {
  ...catalog.find((category) => category.slug === 'doublling-aabbcc')!,
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
  const requests: any[] = [];
  await page.route('http://localhost:3002/vipnumberworld/**', async (route) => {
    const url = route.request().url();
    if (url.endsWith('/numbers/list') || url.endsWith('/prebooks/catalog')) requests.push(route.request().postDataJSON());
    const data = url.endsWith('/categories/list') ? catalog
      : url.endsWith('/site/hero-stats') ? { delivered_numbers: 7, available_numbers: 3, customers_served: 5 }
        : url.endsWith('/numbers/list') ? { items: numbers, total: numbers.length, pages: numbers.length ? 1 : 0 }
          : url.endsWith('/prebooks/catalog') ? { items: [], total: 0, page: 1, limit: 12 }
          : [];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 1, info: 'OK', data }),
    });
  });
  return requests;
}

for (const viewport of viewports) {
  test(`highlighted number fits the ${viewport.width}x${viewport.height} viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockCategoryApi(page, [doublingNumber]);
    await page.goto('/shop?category=doublling-aabbcc', { waitUntil: 'domcontentloaded' });

    const numberRail = page.getByRole('img', {
      name: /VIP number, digits 9 0 0 6 6 2 2 1 2 1\. Category: Doublling \(AABBCC\)\./i,
    });
    await expect(numberRail).toBeVisible({ timeout: 15000 });

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
    await expect(cards).toHaveCount(31);
    await expect(page.locator('[data-categories-page]')).toBeVisible();
    await expect(cards.first().getByRole('link', { name: 'Numerology Numbers' })).toHaveAttribute('href', '/shop?category=numerology-numbers');

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

test('homepage discovery opens the live pattern collection', async ({ page }) => {
  await mockCategoryApi(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('navigation', { name: 'Popular number patterns' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Every pattern has a personality.' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Mirror & symmetry Reflections/ })).toHaveAttribute('href', '/shop?category=customer-care-numbers');
  await expect(page.getByRole('heading', { name: 'The repeat collection' })).toBeVisible();
});

test('a subcategory link carries both taxonomy filters into the shop request', async ({ page }) => {
  const requests = await mockCategoryApi(page);
  await page.goto('/categories', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: /Ulta-Pulta/ }).click();
  await expect(page).toHaveURL(/\/shop\?category=customer-care-numbers&subcategory_id=104/);
  await expect.poll(() => requests.some((payload) => payload.category === 'customer-care-numbers' && payload.subcategory_id === 104)).toBe(true);
});

test('pre-book search submits the selected parent and child together', async ({ page }) => {
  const requests = await mockCategoryApi(page);
  await page.goto('/pre-book', { waitUntil: 'domcontentloaded' });
  await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption('customer-care-numbers');
  await page.getByRole('combobox', { name: 'Subcategory', exact: true }).selectOption('104');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect.poll(() => requests.some((payload) => payload.category === 'customer-care-numbers' && payload.subcategory_id === 104)).toBe(true);
});
