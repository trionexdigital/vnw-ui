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
});
