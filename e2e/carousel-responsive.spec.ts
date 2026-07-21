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
  test(`contains the complete artboard at ${viewport.width}x${viewport.height}`, async ({ page }) => {
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
    const artboard = page.locator('[data-carousel-artboard]').first();
    await artboard.scrollIntoViewIfNeeded();
    await expect(artboard).toBeVisible();
    const box = await artboard.boundingBox();
    const canvasBox = await artboard.locator('canvas').boundingBox();
    expect(box).not.toBeNull(); expect(canvasBox).not.toBeNull();
    const expectedRatio = viewport.width < 768 ? 1080 / 1920 : 1600 / 900;
    expect(Math.abs((box!.width / box!.height) - expectedRatio)).toBeLessThan(0.015);
    expect(Math.abs(canvasBox!.width - box!.width)).toBeLessThan(2);
    expect(Math.abs(canvasBox!.height - box!.height)).toBeLessThan(2);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  });
}
