import { expect, test } from '@playwright/test';

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
];

function documentFor(width: number, height: number) {
  return {
    version: 1,
    artboard: { width, height },
    settings: { background: '#140c08' },
    fabric: {
      version: '6', background: '#140c08', objects: [
        { type: 'Rect', vnwId: 'background', left: 0, top: 0, width, height, fill: '#140c08', selectable: false, evented: false },
        { type: 'Rect', vnwId: 'safe-border', left: 18, top: 18, width: width - 36, height: height - 36, fill: 'transparent', stroke: '#f5bd42', strokeWidth: 18 },
      ],
    },
  };
}

const slide = {
  carousel_id: 1, name: 'Responsive proof', sort_order: 0, published_revision: 1,
  published_desktop: documentFor(1600, 900), published_mobile: documentFor(1080, 1920),
  published_desktop_preview_id: 1, published_mobile_preview_id: 2,
  transition_style: 'fade', autoplay_seconds: 8, published_at: '2026-07-20',
};

for (const viewport of viewports) {
  test(`published carousel fits the viewport at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route('http://localhost:3002/vipnumberworld/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/carousel/preview/')) {
        return route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL6WQAAAABJRU5ErkJggg==', 'base64') });
      }
      const data = url.endsWith('/carousel/list') ? [slide]
        : url.endsWith('/site/hero-stats') ? { delivered_numbers: 7, available_numbers: 0, customers_served: 0 }
          : url.endsWith('/numbers/list') ? { items: [], total: 0 }
            : [];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, info: 'OK', data }) });
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const slideFrame = page.locator('.home-carousel [aria-roledescription="slide"]').first();
    await slideFrame.scrollIntoViewIfNeeded();
    const image = slideFrame.getByRole('img', { name: 'Responsive proof' });
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((item: HTMLImageElement) => item.naturalWidth)).toBe(1);
    await expect(image).toHaveCSS('object-fit', viewport.width < 768 ? 'contain' : 'cover');
    const box = await slideFrame.boundingBox();
    const imageBox = await image.boundingBox();
    expect(box).not.toBeNull(); expect(imageBox).not.toBeNull();
    expect(Math.abs(imageBox!.width - box!.width)).toBeLessThan(2);
    expect(Math.abs(imageBox!.height - box!.height)).toBeLessThan(2);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  });
}
