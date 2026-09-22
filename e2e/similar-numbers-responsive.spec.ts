import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const artifactDir = path.resolve('../output/number-card-implementation-2026-09-22/final');
// Keep fixed page chrome from covering the isolated component captures.
const captureStyle = '.fixed:has([aria-label="WhatsApp"]), nav.fixed { visibility: hidden !important; }';
const source = {
  number_id: 1, number_value: '9988998877', display_number: '9988 998 877',
  title_label: 'VIP Number', badge: 'PREMIUM', mrp: 50000, offer_price: 45000,
  discount_pct: 10, stock: 1, status: 'AVAILABLE', rtp_status: 'RTA',
  primary_category: { slug: 'doubling-numbers', name: 'Doubling Numbers' },
};
const candidates = [
  { ...source, number_id: 2 },
  { ...source, number_id: 3, badge: 'BEST_SELLER', rtp_status: 'RTP', mrp: 999999, offer_price: 899999 },
  { ...source, number_id: 4, badge: 'NEW_ARRIVAL', rtp_status: 'NON_RTP', rtp_available_at: '2027-01-01 12:00:00', primary_category: { slug: 'without-248', name: 'Without 248 Numbers (Numerology)' } },
  { ...source, number_id: 5, status: 'SOLD', badge: 'NONE', mrp: 99999999, offer_price: 89999999 },
];
async function mockNumbers(page: Page) {
  await page.route('**/vipnumberworld/**', async (route) => {
    const url = route.request().url();
    const payload = route.request().postDataJSON?.() || {};
    const data = url.endsWith('/numbers/similar')
      ? { source: candidates.find((item) => item.number_id === payload.number_id) || source, items: candidates, total: 4, page: 1, limit: 12, pages: 1 }
      : url.endsWith('/site/settings') ? {} : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, info: 'OK', data }) });
  });
}

for (const viewport of [
  { width: 320, height: 800, columns: 1 }, { width: 360, height: 800, columns: 1 },
  { width: 390, height: 844, columns: 1 }, { width: 430, height: 932, columns: 1 },
  { width: 768, height: 1024, columns: 2 }, { width: 1280, height: 900, columns: 4 },
  { width: 1600, height: 1000, columns: 4 },
]) {
  test(`reference cards fit at ${viewport.width}px with live content and readiness states`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockNumbers(page);
    await page.goto('/number/1/similar', { waitUntil: 'domcontentloaded' });
    const cards = page.getByTestId('number-card');
    await expect(cards).toHaveCount(4);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('900 32px "VNW Card Inter"'))).toBe(true);
    expect(await page.evaluate(() => [...document.fonts].some((font) => font.family.includes('VNW Card Inter') && font.status === 'loaded'))).toBe(true);
    const columns = await page.locator('.number-card-grid').evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(viewport.columns);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
    for (const card of await cards.all()) {
      await expect(card.getByText('Root sum')).toBeVisible();
      await expect(card.getByText('MRP', { exact: true })).toBeVisible();
      await expect(card.getByText('Offer price')).toBeVisible();
      const overflow = await card.evaluate((element) => [...element.querySelectorAll<HTMLElement>('div, span, button, dt, dd, s')]
        .filter((node) => node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 2)
        .map((node) => ({ class: node.className, width: node.clientWidth, content: node.scrollWidth })));
      expect(overflow).toEqual([]);
    }
    await expect(cards.first().locator('dd').nth(0)).toHaveText('82');
    await expect(cards.first().locator('dd').nth(1)).toHaveText('1');
    await expect(cards.nth(1).getByText('RTP · Ready to port')).toBeVisible();
    await expect(cards.nth(2).getByRole('button', { name: 'Pre-book' })).toBeVisible();
    await expect(cards.nth(2).getByRole('button', { name: 'add to cart' })).toHaveCount(0);
    await expect(cards.nth(3).getByRole('button', { name: 'Unavailable' })).toBeDisabled();
    mkdirSync(artifactDir, { recursive: true });
    await cards.first().screenshot({ path: path.join(artifactDir, `card-${viewport.width}.png`), style: captureStyle });
    await page.locator('.number-card-grid').screenshot({ path: path.join(artifactDir, `grid-${viewport.width}.png`), style: captureStyle });
  });
}

test('keyboard actions, stable hover, fixed reference palette and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockNumbers(page);
  await page.goto('/number/1/similar');
  const card = page.getByTestId('number-card').first();
  const similar = card.getByRole('button', { name: /find numbers similar to/i });
  await similar.focus();
  await expect(similar).toBeFocused();
  await similar.press('Enter');
  await expect(page).toHaveURL(/\/number\/2\/similar$/);
  await card.getByRole('button', { name: 'Add to compare' }).click();
  await expect(card.getByRole('button', { name: 'Remove from compare' })).toHaveAttribute('aria-pressed', 'true');
  const style = await card.evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, transform: getComputedStyle(el).transform }));
  await card.hover();
  expect(await card.evaluate((el) => getComputedStyle(el).transform)).toBe(style.transform);
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  expect(await card.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(style.background);
  await expect(card.locator('.reference-card__hero')).toHaveCSS('background-color', 'rgb(33, 31, 27)');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await card.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  mkdirSync(artifactDir, { recursive: true });
  await card.screenshot({ path: path.join(artifactDir, 'card-dark-theme.png') });
  await card.getByRole('button', { name: 'add to cart' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('captures the reference specimen at its intended 446px card width', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 }, deviceScaleFactor: 3 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockNumbers(page);
  await page.goto('/number/1/similar');
  const card = page.getByTestId('number-card').first();
  await expect(card).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  // Resize only the test grid for a reproducible single-card comparison.
  await page.locator('.number-card-grid').evaluate((grid: HTMLElement) => {
    grid.style.gridTemplateColumns = '446px';
    grid.style.width = '446px';
  });
  mkdirSync(artifactDir, { recursive: true });
  await card.screenshot({ path: path.join(artifactDir, 'reference-card-446.png') });
  await page.close();
});
