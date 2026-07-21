import { describe, expect, it } from 'vitest';
import {
  CAROUSEL_ARTBOARDS,
  CAROUSEL_FONTS,
  copyDesktopDocumentToMobile,
  createBlankCarouselDocument,
  getCarouselDocumentIssues,
  isAllowedCarouselLink,
  normalizeCarouselDocument,
  serializeCarouselDocument,
  type CarouselDocument,
} from '@/core/carousel/types';

describe('carousel studio documents', () => {
  it('offers a curated, duplicate-free mix of display, serif, sans, and monospace fonts', () => {
    expect(CAROUSEL_FONTS).toEqual(expect.arrayContaining([
      'Inter', 'Playfair Display', 'Arial', 'Georgia', 'Courier New', 'Impact',
    ]));
    expect(new Set(CAROUSEL_FONTS).size).toBe(CAROUSEL_FONTS.length);
  });

  it('normalizes versioned documents to the required artboard', () => {
    const document = createBlankCarouselDocument('desktop');
    document.artboard = { width: 12, height: 34 };
    const normalized = normalizeCarouselDocument(document, 'desktop');
    expect(normalized.artboard).toEqual(CAROUSEL_ARTBOARDS.desktop);
    expect(normalized.fabric.objects[0].vnwId).toBeTruthy();
  });

  it('fits a desktop design into mobile without cropping any layer bounds', () => {
    const desktop = createBlankCarouselDocument('desktop');
    desktop.fabric.objects.push({ type: 'Rect', vnwId: 'card', left: 100, top: 100, width: 1400, height: 700, scaleX: 1, scaleY: 1 });
    const mobile = copyDesktopDocumentToMobile(desktop);
    const card = mobile.fabric.objects[1];
    const right = Number(card.left) + Number(card.width) * Number(card.scaleX);
    const bottom = Number(card.top) + Number(card.height) * Number(card.scaleY);
    expect(mobile.artboard).toEqual(CAROUSEL_ARTBOARDS.mobile);
    expect(Number(card.left)).toBeGreaterThanOrEqual(0);
    expect(Number(card.top)).toBeGreaterThanOrEqual(0);
    expect(right).toBeLessThanOrEqual(CAROUSEL_ARTBOARDS.mobile.width);
    expect(bottom).toBeLessThanOrEqual(CAROUSEL_ARTBOARDS.mobile.height);
  });

  it('accepts only relative and HTTP(S) links', () => {
    expect(isAllowedCarouselLink('/shop')).toBe(true);
    expect(isAllowedCarouselLink('https://example.com')).toBe(true);
    expect(isAllowedCarouselLink('//example.com')).toBe(false);
    expect(isAllowedCarouselLink('javascript:alert(1)')).toBe(false);
  });

  it('reports the ten-upload-layer limit and duplicate IDs', () => {
    const document = createBlankCarouselDocument('desktop');
    document.fabric.objects.push(...Array.from({ length: 11 }, (_, index) => ({
      type: 'Image', vnwId: index === 10 ? 'image-9' : `image-${index}`, vnwAssetId: index + 1,
    })));
    const issues = getCarouselDocumentIssues(document, 'desktop');
    expect(issues).toContain('An artboard can use at most 10 uploaded image/sticker layers.');
    expect(issues).toContain('Every layer needs a unique ID.');
  });

  it('replaces in-memory image URLs with stable asset references before saving', () => {
    const document = createBlankCarouselDocument('desktop') as CarouselDocument;
    document.fabric.objects.push({ type: 'Image', vnwId: 'uploaded', vnwAssetId: 42, src: 'blob:http://localhost/temp' });
    expect(serializeCarouselDocument(document).fabric.objects[1].src).toBe('asset:42');
  });

  it('preserves the complete editable typography model when saving', () => {
    const document = createBlankCarouselDocument('desktop') as CarouselDocument;
    const typography = {
      type: 'Textbox',
      vnwId: 'styled-copy',
      text: 'Premium identity',
      fontFamily: 'Playfair Display',
      fontSize: 92,
      fontWeight: '800',
      fontStyle: 'italic',
      underline: true,
      linethrough: true,
      charSpacing: 80,
      lineHeight: 1.25,
      textAlign: 'center',
      textBackgroundColor: '#fff2bf',
    };
    document.fabric.objects.push(typography);

    const saved = serializeCarouselDocument(document);
    expect(saved.fabric.objects[1]).toMatchObject(typography);
  });
});
