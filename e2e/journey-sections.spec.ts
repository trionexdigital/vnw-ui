import { expect, test } from '@playwright/test';

test('journey alternates desktop sections and adapts art to both themes', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.route('**/vipnumberworld/**', route => route.fulfill({ json: { status: 1, data: [] } }));
  await page.goto('/how-it-works');
  const steps = page.locator('.how-step');
  await expect(steps).toHaveCount(5);
  await expect(page.getByRole('heading', { name: 'How it works', exact: true })).toBeVisible();
  for (let index = 0; index < 5; index++) {
    const row = steps.nth(index);
    await row.scrollIntoViewIfNeeded();
    const image = row.locator('img');
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(row.locator('.how-step__details')).toBeVisible();
    await expect.poll(async () => row.locator('.how-step__details').evaluate(e => Number(getComputedStyle(e).opacity))).toBe(1);
    const detail = await row.locator('.how-step__details').boundingBox();
    const card = await row.locator('.how-step__card').boundingBox();
    if (index % 2) expect(card!.x + card!.width).toBeLessThan(detail!.x);
    else expect(detail!.x + detail!.width).toBeLessThan(card!.x);
    expect(Math.abs(detail!.width - card!.width)).toBeLessThan(1);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('journey-light-desktop.png') });
  const art = steps.first().locator('.how-step__art');
  const lightBackground = await art.evaluate(e => getComputedStyle(e).backgroundImage);
  await page.locator('.public-header__panel').getByRole('radio', { name: 'Use dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(await art.evaluate(e => getComputedStyle(e).backgroundImage)).not.toBe(lightBackground);
  await page.screenshot({ path: testInfo.outputPath('journey-dark-desktop.png') });
});

test('mobile journey stacks details before cards with reduced motion', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.route('**/vipnumberworld/**', route => route.fulfill({ json: { status: 1, data: [] } }));
  await page.goto('/how-it-works');
  await expect(page.locator('html')).toHaveClass(/dark/);
  const steps = page.locator('.how-step');
  for (let index = 0; index < 5; index++) {
    const row = steps.nth(index);
    await row.scrollIntoViewIfNeeded();
    const detail = await row.locator('.how-step__details').boundingBox();
    const card = await row.locator('.how-step__card').boundingBox();
    expect(detail!.y + detail!.height).toBeLessThan(card!.y);
    expect(Math.abs(detail!.x - card!.x)).toBeLessThan(1);
    expect(await row.locator('.how-step__details').evaluate(e => getComputedStyle(e).opacity)).toBe('1');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await steps.first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('journey-dark-mobile.png') });
});
