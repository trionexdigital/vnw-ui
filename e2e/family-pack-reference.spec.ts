import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const output = path.resolve('../output/family-pack-refinement-2026-09-29');
const captureStyle = '.fixed:has([aria-label="WhatsApp"]), nav.fixed { visibility: hidden !important; }';
async function mockPacks(page: Page) {
  await page.route('**/vipnumberworld/**', async (route) => {
    const payload = route.request().postDataJSON?.() || {};
    const size = payload.size || 3;
    const numbers = Array.from({ length: size }, (_, index) => ({
      number_id: index + 1,
      display_number: ['9353 115 511', '7777 915 915', '8888 115 511'][index % 3],
      offer_price: [19999, 22999, 20999][index % 3], status: 'AVAILABLE', stock: 1,
    }));
    const packs = Array.from({ length: 4 }, (_, index) => ({
      pack_id: `sample-${index}-${size}`, title: index === 1 ? 'Similar numbers for the whole family' : `All Mixed ${index + 2}`,
      pack_type: payload.pack_type || 'MIXED', description: 'A varied selection of currently available VIP numbers.',
      size, numbers, is_available: index !== 3, is_active: true, sort_order: index,
      total_price: numbers.reduce((total, number) => total + number.offer_price, 0),
    }));
    const data = route.request().url().endsWith('/site/family-packs') ? packs : {};
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, info: 'OK', data }) });
  });
}

for (const width of [320, 390, 430, 768, 1280, 1600]) {
  test(`family cards fit at ${width}px and selection updates the price`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockPacks(page);
    await page.goto('/family-pack');
    const cards = page.getByTestId('family-pack-card');
    await expect(cards).toHaveCount(4);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => [...document.fonts].some((font) => font.family.includes('VNW Card Inter') && font.status === 'loaded'))).toBe(true);
    for (const card of await cards.all()) {
      const overflow = await card.evaluate((element) => [...element.querySelectorAll<HTMLElement>('div, span, button, a, h3, p')]
        .filter((node) => node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 2)
        .map((node) => ({ class: node.className, width: node.clientWidth, content: node.scrollWidth })));
      expect(overflow).toEqual([]);
    }
    const card = cards.first();
    const firstRowAlignment = await card.locator('.reference-family__row').first().evaluate((row) => ({ number: row.querySelector('.reference-family__number')!.getBoundingClientRect().right, price: row.querySelector('.reference-family__price')!.getBoundingClientRect().left }));
    expect(firstRowAlignment.price).toBeGreaterThan(firstRowAlignment.number);
    await expect(card.locator('.reference-family__total')).toHaveText('₹63,997');
    mkdirSync(output, { recursive: true });
    await card.screenshot({ path: path.join(output, `family-card-${width}.png`), style: captureStyle });
    const select = card.getByRole('button', { name: 'Deselect 9353 115 511' });
    await select.focus();
    await select.press('Enter');
    await expect(card.locator('.reference-family__total')).toHaveText('₹43,998');
    await expect(card.getByText('2 of 3 selected')).toBeVisible();
    await card.getByRole('button', { name: 'Select all' }).click();
    await card.getByRole('button', { name: 'Clear selection' }).click();
    await expect(card.locator('.reference-family__total')).toHaveText('₹0');
    await expect(card.getByRole('button', { name: 'Buy Now' })).toBeDisabled();
    await expect(cards.last().getByRole('button', { name: 'Buy Now' })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
  });
}

test('ten-number packs stay readable and preserve the palette in dark mode', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockPacks(page);
  await page.goto('/family-pack');
  await page.getByRole('combobox', { name: 'Numbers in pack' }).selectOption('10');
  const card = page.getByTestId('family-pack-card').first();
  await expect(card.locator('.reference-family__row')).toHaveCount(10);
  await expect(card.getByText('10 of 10 selected')).toBeVisible();
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await expect(card).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(card.locator('.reference-family__header')).toHaveCSS('background-image', /linear-gradient/);
  mkdirSync(output, { recursive: true });
  await card.screenshot({ path: path.join(output, 'family-ten-numbers-dark.png'), style: captureStyle });
  await card.getByRole('button', { name: 'Buy Now' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('capture a matching family-pack specimen at 446px', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 }, deviceScaleFactor: 3 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockPacks(page);
  await page.goto('/family-pack');
  const card = page.getByTestId('family-pack-card').first();
  await expect(card).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await card.evaluate((element) => { const grid = element.parentElement!; grid.style.gridTemplateColumns = '446px'; grid.style.width = '446px'; });
  const overflow = await card.evaluate((element) => [...element.querySelectorAll<HTMLElement>('div, span, button, a')]
    .filter((node) => node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 2).map((node) => node.className));
  expect(overflow).toEqual([]);
  mkdirSync(output, { recursive: true });
  await card.screenshot({ path: path.join(output, 'family-reference-446.png'), style: captureStyle });
  await page.close();
});
