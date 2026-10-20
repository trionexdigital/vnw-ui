import { describe, expect, it } from 'vitest';
import { formatNumberDisplay, numberDisplayGroups } from '@/core/categories/numberDisplay';

describe('category-aware number display', () => {
  it('normalizes country code and keeps every digit in mirror and repeat groups', () => {
    expect(numberDisplayGroups('+91 98765 98765', { slug: 'customer-care-numbers' })).toEqual(['98765', '98765']);
    expect(numberDisplayGroups('9777712345', { slug: 'choice-mobile-number' })).toEqual(['9', '7777', '12345']);
    expect(numberDisplayGroups('9123786786', { slug: '786-vip-mobile-numbers' }).join('')).toBe('9123786786');
  });

  it('falls back to readable 4-3-3 when no reliable category pattern applies', () => {
    expect(formatNumberDisplay('9988998877')).toBe('9988 998 877');
    expect(numberDisplayGroups('9988998877', { slug: 'numerology-numbers' }).join('')).toBe('9988998877');
  });

  it('uses the displayed category evidence for the same spacing in cards and packs', () => {
    const category = { slug: 'doublling-aabbcc', match_spans: [{ start: 0, end: 3 }, { start: 3, end: 6 }] };
    expect(numberDisplayGroups('8008005413', category)).toEqual(['800', '800', '5413']);
    expect(formatNumberDisplay('+91 8008005413', category)).toBe('800 800 5413');
    expect(numberDisplayGroups('8008005413', { ...category, match_spans: [{ start: 0, end: 12 }] }).join('')).toBe('8008005413');
  });

  it.each([
    ['9988771234', 'doublling-aabbcc', '99 88 77 1234'],
    ['9777888123', 'unforgettable-vip-number', '9 777 888 123'],
    ['9193999999', 'buy-vip-mobile-number-online', '9193 999999'],
    ['9000000123', 'Hexa-vip-mobile-number', '9 000000 123'],
    ['9123000456', 'vip-number-000', '9123 000 456'],
    ['9123123456', 'vip-number-online', '9 123 123 456'],
    ['8008005413', 'doublling-aabbcc', '800 800 5413'],
  ])('groups %s using the %s category when classifier spans are absent', (number, slug, expected) => {
    expect(formatNumberDisplay(number, { slug })).toBe(expected);
  });
});
