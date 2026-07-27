import { expect, test } from '@playwright/test';

const deals = [
  {
    deal_id: 1,
    number_id: 1,
    number_value: '9695951155',
    display_number: '969595 1155',
    title_label: 'Numerology Special',
    hero_label: 'Numerology Special',
    hero_description: 'Highly desirable • Easy to remember',
    badge: 'PREMIUM',
    mrp: 349999,
    offer_price: 259999,
    stock: 1,
    status: 'AVAILABLE',
    sort_order: 0,
    is_active: true,
    source: 'CURATED',
    primary_category: { slug: 'numerology-numbers', name: 'Numerology Numbers' },
    categories: [{ slug: 'numerology-numbers', name: 'Numerology Numbers' }],
  },
  {
    deal_id: 2,
    number_id: 2,
    number_value: '9999971155',
    display_number: '999997 1155',
    title_label: 'Premium Pick',
    hero_label: 'Premium Pick',
    hero_description: 'Highly desirable',
    badge: 'HOT_PICK',
    mrp: 449999,
    offer_price: 349999,
    stock: 1,
    status: 'AVAILABLE',
    sort_order: 1,
    is_active: true,
    source: 'CURATED',
    primary_category: { slug: 'unique-numbers', name: 'Unique Numbers' },
    categories: [{ slug: 'unique-numbers', name: 'Unique Numbers' }],
  },
  {
    deal_id: 3,
    number_id: 3,
    number_value: '9363131155',
    display_number: '936313 1155',
    title_label: 'Golden Choice',
    hero_label: 'Golden Choice',
    hero_description: 'Easy to remember',
    badge: 'BEST_SELLER',
    mrp: 249999,
    offer_price: 189999,
    stock: 1,
    status: 'AVAILABLE',
    sort_order: 2,
    is_active: true,
    source: 'CURATED',
    primary_category: { slug: 'golden-numbers', name: 'Golden Numbers' },
    categories: [{ slug: 'golden-numbers', name: 'Golden Numbers' }],
  },
];

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1900, height: 840 },
  { width: 1920, height: 1080 },
];

async function mockStorefront(page: import('@playwright/test').Page) {
  await page.route('**/vipnumberworld/**', async (route) => {
    const url = route.request().url();
    let data: any = [];
    if (url.endsWith('/site/deals-of-day')) data = { items: deals, source: 'CURATED' };
    else if (url.endsWith('/site/settings')) data = {};
    else if (url.endsWith('/site/hero-stats')) data = { delivered_numbers: 0, available_numbers: 3, customers_served: 0 };
    else if (url.endsWith('/numbers/list') || url.endsWith('/numbers/featured')) data = { items: [], total: 0 };
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 1, info: 'OK', data }),
    });
  });
}

for (const viewport of viewports) {
  test(`Deal of the Day hero is contained and usable at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await mockStorefront(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('.home-hero');
    const dealStage = page.locator('.deal-showcase');
    const activeCard = page.locator('.deal-card-motion[data-position="active"]');
    const rightArtwork = page.locator('.home-hero__art.brand-stage');

    await expect(hero).toBeVisible();
    await expect(dealStage).toBeVisible();
    await expect(activeCard.getByText('969595 1155')).toBeVisible();
    await expect(activeCard.getByText('Numerology Numbers')).toBeVisible();
    await expect(rightArtwork).toBeVisible();
    await expect(rightArtwork.locator('.brand-stage__number-plaque')).toHaveCount(8);
    await expect(rightArtwork.locator('.brand-stage__slogan')).toBeVisible();

    const activeCardBox = await activeCard.locator('.deal-hero-card').boundingBox();
    const categoryBox = await activeCard.locator('.deal-hero-card__category').boundingBox();
    const numberBox = await activeCard.locator('.deal-hero-card__number').boundingBox();
    const purchaseBox = await activeCard.locator('.deal-hero-card__purchase').boundingBox();
    const trustBox = await activeCard.locator('.deal-hero-card__trust').boundingBox();
    expect(activeCardBox).not.toBeNull();
    expect(categoryBox).not.toBeNull();
    expect(numberBox).not.toBeNull();
    expect(purchaseBox).not.toBeNull();
    expect(trustBox).not.toBeNull();
    for (const contentBox of [categoryBox!, numberBox!, purchaseBox!, trustBox!]) {
      expect(contentBox.x).toBeGreaterThanOrEqual(activeCardBox!.x - 1);
      expect(contentBox.x + contentBox.width).toBeLessThanOrEqual(activeCardBox!.x + activeCardBox!.width + 1);
      expect(contentBox.y).toBeGreaterThanOrEqual(activeCardBox!.y - 1);
      expect(contentBox.y + contentBox.height).toBeLessThanOrEqual(activeCardBox!.y + activeCardBox!.height + 1);
    }
    expect(purchaseBox!.y + purchaseBox!.height).toBeLessThanOrEqual(trustBox!.y + 1);

    const hasHorizontalOverflow = await page.evaluate(() => (
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    ));
    expect(hasHorizontalOverflow).toBe(false);

    if (viewport.width >= 1024) {
      const leftBox = await dealStage.boundingBox();
      const rightBox = await rightArtwork.boundingBox();
      const headingBox = await page.locator('#home-hero-title').boundingBox();
      expect(leftBox).not.toBeNull();
      expect(rightBox).not.toBeNull();
      expect(headingBox).not.toBeNull();
      expect(leftBox!.x + leftBox!.width).toBeLessThanOrEqual(rightBox!.x + 3);
      expect(headingBox!.height).toBeLessThan(50);
    }

    const ring = page.locator('.deal-showcase__base-ring--inner');
    await expect(ring).toHaveAttribute('data-rotation', '0');
    await page.getByRole('button', { name: 'Next deal' }).click();
    await expect(page.locator('.deal-card-motion[data-position="active"]').getByText('999997 1155')).toBeVisible();
    await expect(ring).toHaveAttribute('data-rotation', '60');
    await expect.poll(async () => (
      page.locator('.deal-card-motion[data-position="active"]').evaluate((card) => (card as HTMLElement).style.transform)
    )).toContain('translateZ(64px)');
    const previousTransform = await page.locator('.deal-card-motion[data-position="previous"]')
      .evaluate((card) => (card as HTMLElement).style.transform);
    const nextTransform = await page.locator('.deal-card-motion[data-position="next"]')
      .evaluate((card) => (card as HTMLElement).style.transform);
    expect(previousTransform).toContain('translateZ(-168px)');
    expect(previousTransform).toContain('rotateY(29deg)');
    expect(nextTransform).toContain('translateZ(-168px)');
    expect(nextTransform).toContain('rotateY(-29deg)');

    const intrinsicCardSizes = await page.locator('.deal-hero-card').evaluateAll((cards) => (
      cards.map((card) => {
        const style = window.getComputedStyle(card);
        return `${style.width}x${style.height}`;
      })
    ));
    expect(new Set(intrinsicCardSizes).size).toBe(1);

    if (viewport.width === 375 || viewport.width === 1366 || viewport.width >= 1900) {
      await page.screenshot({ path: testInfo.outputPath(`deal-hero-${viewport.width}x${viewport.height}.png`), fullPage: false });
    }
  });
}

test('automatically advances the visible deal while the hero remains on screen', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await mockStorefront(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.deal-card-motion[data-position="active"]').getByText('969595 1155')).toBeVisible();
  await expect(page.locator('.deal-card-motion[data-position="active"]').getByText('999997 1155'))
    .toBeVisible({ timeout: 8_000 });
  await expect(page.locator('.deal-showcase__base-ring--inner')).toHaveAttribute('data-rotation', '60');
});

test('reduced motion keeps manual navigation flat and disables autoplay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1366, height: 768 });
  await mockStorefront(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('button', { name: 'Pause automatic deal rotation' })).toHaveCount(0);
  await page.waitForTimeout(6_500);
  await expect(page.locator('.deal-card-motion[data-position="active"]').getByText('969595 1155')).toBeVisible();

  await page.getByRole('button', { name: 'Next deal' }).click();
  await expect(page.locator('.deal-card-motion[data-position="active"]').getByText('999997 1155')).toBeVisible();
  await expect(page.locator('.deal-showcase__base-ring--inner')).toHaveAttribute('data-rotation', '0');
  const previousCard = page.locator('.deal-card-motion[data-position="previous"]');
  await expect.poll(async () => (
    previousCard.evaluate((card) => (card as HTMLElement).style.transform)
  )).toBe('translateX(-34%)');
  const sideTransform = await previousCard.evaluate((card) => (card as HTMLElement).style.transform);
  expect(sideTransform).not.toContain('translateZ');
  expect(sideTransform).not.toContain('rotateY');
});
