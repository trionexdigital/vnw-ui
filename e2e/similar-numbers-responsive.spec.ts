import { expect, test, type Page } from '@playwright/test';

const source = {
  number_id: 1,
  number_value: '9193999999',
  display_number: '9193 999 999',
  title_label: 'Signature VIP Number',
  badge: 'BEST_SELLER',
  mrp: 499999,
  offer_price: 349999,
  discount_pct: 30,
  numerology_sum: 3,
  stock: 1,
  status: 'AVAILABLE',
  primary_category: { slug: 'hexa-numbers', name: 'Hexa Pattern', match_spans: [{ start: 4, end: 10 }] },
};

const candidates = Array.from({ length: 12 }, (_, index) => ({
  ...source,
  number_id: index + 2,
  number_value: `91939${String(99998 - index).padStart(5, '0')}`,
  display_number: `9193 9${String(99998 - index).padStart(5, '0')}`,
}));

async function mockSimilarNumbers(page: Page) {
  await page.route('**/vipnumberworld/**', async (route) => {
    const url = route.request().url();
    const payload = route.request().postDataJSON?.() || {};
    const sourceNumber = payload.number_id === 1
      ? source
      : candidates.find((item) => item.number_id === payload.number_id) || source;
    const data = url.endsWith('/numbers/similar')
      ? { source: sourceNumber, items: candidates.filter((item) => item.number_id !== sourceNumber.number_id), total: 11, page: 1, limit: 12, pages: 1 }
      : url.endsWith('/site/settings')
        ? {}
        : [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 1, info: 'OK', data }),
    });
  });
}

for (const viewport of [
  { width: 360, height: 800, columns: 1, name: 'mobile' },
  { width: 768, height: 1024, columns: 2, name: 'tablet' },
  { width: 1280, height: 900, columns: 4, name: 'desktop' },
  { width: 1600, height: 1000, columns: 4, name: 'wide desktop' },
]) {
  test(`${viewport.name} renders readable reference cards at the intended density`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockSimilarNumbers(page);
    await page.goto('/number/1/similar', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /numbers similar to/i })).toBeVisible();
    const firstCard = page.locator('[data-testid="number-card"]').first();
    await expect(firstCard).toBeVisible();

    const columnCount = await page.locator('.number-card-grid').evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    expect(columnCount).toBe(viewport.columns);
    const cardBounds = await firstCard.boundingBox();
    const gridMetrics = await page.locator('.number-card-grid').evaluate((grid) => {
      const bounds = grid.getBoundingClientRect();
      const styles = getComputedStyle(grid);
      return { width: bounds.width, gap: Number.parseFloat(styles.columnGap) };
    });
    const expectedCardWidth = (gridMetrics.width - gridMetrics.gap * (viewport.columns - 1)) / viewport.columns;
    expect(Math.abs((cardBounds?.width || 0) - expectedCardWidth)).toBeLessThanOrEqual(2);
    expect(cardBounds?.height).toBeLessThanOrEqual(viewport.width >= 1280 ? 230 : 285);
    if (viewport.width >= 1280) {
      const primaryActionBounds = await firstCard.getByRole('button', { name: /buy now|pre-book/i }).boundingBox();
      expect(primaryActionBounds?.height).toBeLessThanOrEqual(34);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
    const similarButton = firstCard.getByRole('button', { name: /find numbers similar to/i });
    await expect(similarButton).toBeVisible();
    const similarBounds = await similarButton.boundingBox();
    const vipTagBounds = await firstCard.getByText('Signature VIP Number').boundingBox();
    expect((similarBounds?.y || 0) + (similarBounds?.height || 0)).toBeLessThanOrEqual(vipTagBounds?.y || 0);
    await expect(firstCard.getByText('Total')).toBeVisible();
    await expect(firstCard.getByText('Sum')).toBeVisible();
    await expect(firstCard.getByText('MRP Price')).toBeVisible();
    await expect(firstCard.getByText('Offer Price')).toBeVisible();
    await expect(firstCard.getByText('Verified')).toBeVisible();
    await expect(page.getByRole('button', { name: 'add to cart' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'compare' }).first()).toBeVisible();
  });
}

test('similar navigation, keyboard focus, hover reset, dark mode and reduced motion remain functional', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mockSimilarNumbers(page);
  await page.goto('/number/1/similar', { waitUntil: 'domcontentloaded' });
  const card = page.locator('[data-testid="number-card"]').first();
  const similar = page.getByRole('button', { name: /find numbers similar to/i }).first();

  await similar.focus();
  await expect(similar).toBeFocused();
  await similar.press('Enter');
  await expect(page).toHaveURL(/\/number\/2\/similar$/);

  const resetTransform = await card.evaluate((element) => getComputedStyle(element).transform);
  await card.hover({ position: { x: 20, y: 20 } });
  await page.waitForTimeout(180);
  const hoverTransform = await card.evaluate((element) => getComputedStyle(element).transform);
  expect(hoverTransform).not.toBe(resetTransform);
  await page.mouse.move(1, 1);
  await expect.poll(() => card.evaluate((element) => getComputedStyle(element).transform)).not.toBe(hoverTransform);

  await page.evaluate(() => document.documentElement.classList.add('dark'));
  expect(await card.evaluate((element) => getComputedStyle(element).backgroundImage)).toContain('linear-gradient');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await card.hover();
  const reducedDuration = await card.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration));
  expect(reducedDuration).toBeLessThanOrEqual(0.001);
});
