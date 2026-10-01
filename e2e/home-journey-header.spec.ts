import { expect, test } from '@playwright/test';

test('homepage shares all journey images in light and dark themes', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/vipnumberworld/**', route => route.fulfill({ json: { status: 1, data: [] } }));
  await page.goto('/');
  const cards = page.locator('.journey-card');
  await expect(cards).toHaveCount(5);
  await cards.first().scrollIntoViewIfNeeded();
  const sources = await cards.locator('img').evaluateAll(images => images.map(img => img.getAttribute('src')));
  expect(sources).toEqual(['payment', 'upc', 'transfer', 'activation', 'assurance'].map(name => `/images/journey/${name}.png`));
  for (let index = 0; index < 5; index++) {
    await expect.poll(() => cards.nth(index).locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    const imageBox = await cards.nth(index).locator('img').boundingBox();
    const titleBox = await cards.nth(index).getByRole('heading').boundingBox();
    expect(imageBox!.y + imageBox!.height).toBeLessThan(titleBox!.y);
  }
  await expect.poll(() => cards.first().evaluate(e => getComputedStyle(e).opacity)).toBe('1');
  await cards.first().locator('img').hover();
  await expect.poll(() => cards.first().locator('img').evaluate(e => getComputedStyle(e).transform)).not.toBe('none');
  await cards.first().locator('img').screenshot({ path: info.outputPath('home-journey-art.png') });
  await page.mouse.move(0, 0);
  await cards.first().locator('..').screenshot({ path: info.outputPath('home-journey-light.png') });
  await page.locator('.public-header__panel').getByRole('radio', { name: 'Use dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await cards.first().scrollIntoViewIfNeeded();
  await cards.first().locator('..').screenshot({ path: info.outputPath('home-journey-dark.png') });
  await page.setViewportSize({ width: 375, height: 812 });
  await cards.first().scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath('home-journey-mobile.png') });
  await page.goto('/how-it-works');
  await expect(page.locator('.how-step__art img')).toHaveCount(5);
  expect(await page.locator('.how-step__art img').evaluateAll(images => images.map(img => img.getAttribute('src')))).toEqual(sources);
});

test('signed-in account button is the rightmost desktop header action', async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ user_id: 1, full_name: 'Test Customer', email: 'test@example.test', role: 'USER' }));
  });
  await page.route('**/vipnumberworld/**', route => route.fulfill({ json: { status: 1, data: [] } }));
  for (const width of [1200, 1440, 1920]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/how-it-works');
    const header = page.locator('.public-header__panel');
    const account = header.getByRole('button', { name: 'Open account menu' });
    await expect(account).toBeVisible();
    const accountBox = await account.boundingBox();
    const contactBox = await header.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Contact' }).boundingBox();
    const searchBox = await header.locator('.header-number-search').boundingBox();
    expect(contactBox!.x + contactBox!.width).toBeLessThanOrEqual(searchBox!.x);
    const compareBox = await header.getByRole('link', { name: 'Compare numbers', exact: true }).boundingBox();
    expect(accountBox!.x).toBeGreaterThan(compareBox!.x + compareBox!.width);
    const actions = await header.locator('button:visible, a:visible').evaluateAll(elements => elements.map(e => e.getBoundingClientRect().right));
    expect(accountBox!.x + accountBox!.width).toBe(Math.max(...actions));
    await account.hover();
    await expect(header.getByRole('link', { name: 'Profile', exact: true })).toBeVisible();
    await page.mouse.move(0, 100);
    await header.screenshot({ path: info.outputPath(`account-right-${width}.png`) });
  }
});
