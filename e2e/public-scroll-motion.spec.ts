import { expect, test } from '@playwright/test';

test('public sections reveal smoothly as they enter the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/how-it-works', { waitUntil: 'domcontentloaded' });

  const reveals = page.locator('[data-vnw-scroll-reveal="true"]');
  await expect.poll(() => reveals.count()).toBeGreaterThanOrEqual(3);
  await expect(reveals.first()).toHaveAttribute('data-vnw-scroll-state', 'visible');

  const finalSection = reveals.last();
  await finalSection.scrollIntoViewIfNeeded();
  await expect(finalSection).toHaveAttribute('data-vnw-scroll-state', 'visible');
  await expect.poll(() => finalSection.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity))).toBe(1);
  const styles = await finalSection.evaluate((element) => {
    const computed = getComputedStyle(element);
    return { opacity: computed.opacity, transform: computed.transform };
  });
  expect(styles.opacity).toBe('1');
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(styles.transform);
});

test('reduced motion makes public content immediate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/about', { waitUntil: 'domcontentloaded' });

  const reveal = page.locator('[data-vnw-scroll-reveal="true"]').first();
  await expect(reveal).toHaveAttribute('data-vnw-scroll-state', 'visible');
  const styles = await reveal.evaluate((element) => {
    const computed = getComputedStyle(element);
    return { opacity: computed.opacity, transform: computed.transform, transition: computed.transitionDuration };
  });
  expect(styles.opacity).toBe('1');
  expect(styles.transform).toBe('none');
  expect(Number.parseFloat(styles.transition)).toBeLessThanOrEqual(0.001);
});
