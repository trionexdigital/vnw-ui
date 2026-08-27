import { expect, test } from '@playwright/test';

const viewports = [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }];

async function mockApi(page: import('@playwright/test').Page) {
  await page.route('http://localhost:3002/vipnumberworld/**', async route => {
    const url = route.request().url();
    const data = url.endsWith('/site/settings')
      ? { SITE_TITLE: 'VIP Number World', CONTACT_EMAIL: 'support@example.test', POLICY_EFFECTIVE_DATE: '17 August 2026' }
      : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, info: 'OK', data }) });
  });
}

for (const viewport of viewports) {
  test(`legal screen fits ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockApi(page);
    await page.goto('/refund-policy');
    await expect(page.getByRole('heading', { name: 'Refund and Cancellation Policy' })).toBeVisible();
    await expect(page.getByRole('button', { name: /VIP number and pre-book refunds/ })).toHaveAttribute('aria-expanded', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}

test('header and legal navigation retain readable hover contrast', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockApi(page);
  await page.goto('/terms-and-conditions');

  const familyPack = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Family Pack' });
  await familyPack.hover();
  const headerColors = await familyPack.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(headerColors.color).not.toBe(headerColors.background);

  const tocLink = page.getByRole('complementary').getByRole('link', { name: '1. Acceptance and accounts' });
  await tocLink.hover();
  const tocColors = await tocLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(tocColors.color).not.toBe(tocColors.background);
});
