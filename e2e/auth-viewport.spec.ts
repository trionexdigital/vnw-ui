import { expect, test } from '@playwright/test';

for (const [route, title] of [['/login', 'Sign In'], ['/register', 'Create Account'], ['/forgot', 'Reset Password']] as const) {
  test(`${title} fits the viewport and keeps its form accessible`, async ({ page }, testInfo) => {
    for (const width of [320, 375, 1280, 1920]) {
      await page.setViewportSize({ width, height: width < 400 ? 640 : 800 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Back to store' })).toBeVisible();
      await expect(page.getByRole('radiogroup', { name: 'Color theme' })).toHaveCount(0);
      await page.getByRole('button', { name: title, exact: true }).scrollIntoViewIfNeeded();
      const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, viewportWidth: innerWidth, viewportHeight: innerHeight }));
      expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
      expect(dimensions.height).toBeLessThanOrEqual(dimensions.viewportHeight + 1);
      if (width === 320 || width === 1280) await page.screenshot({ path: testInfo.outputPath(`${route.slice(1)}-${width}.png`) });
    }
  });
}
