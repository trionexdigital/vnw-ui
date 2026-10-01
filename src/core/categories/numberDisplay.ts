import type { NumberCategoryMatch } from './types';
import { normalizeNumberDigits } from './highlight';

/** Presentation-only grouping. Classification and the canonical value never change. */
export function numberDisplayGroups(value: string | number, category?: Pick<NumberCategoryMatch, 'slug'> | null): string[] {
  const digits = normalizeNumberDigits(value);
  if (digits.length !== 10) return [digits || String(value)];

  const slug = category?.slug || '';
  const splitAt = (start: number, end: number, unit = 0) => {
    const matched = digits.slice(start, end);
    const middle = unit ? matched.match(new RegExp(`.{1,${unit}}`, 'g')) || [matched] : [matched];
    return [digits.slice(0, start), ...middle, digits.slice(end)].filter(Boolean);
  };

  if (/mirror|symmetr|customer-care|best-mobile-number/.test(slug)) return [digits.slice(0, 5), digits.slice(5)];

  if (/786|1313|numerology/.test(slug)) {
    const marker = digits.includes('786') ? '786' : digits.includes('1313') ? '1313' : '';
    if (marker) return splitAt(digits.indexOf(marker), digits.indexOf(marker) + marker.length);
  }

  if (/xyxy|abab|doublling|unforgettable|xyzxyz|abcd-abcd|vip-number-india|vip-mobile-number/.test(slug)) {
    for (const unit of [2, 3, 4]) {
      const pattern = new RegExp(`(\\d{${unit}})\\1+`, 'g');
      const match = [...digits.matchAll(pattern)].sort((a, b) => b[0].length - a[0].length)[0];
      if (match && match[0].length >= unit * 2) return splitAt(match.index || 0, (match.index || 0) + match[0].length, unit);
    }
  }

  if (/000|00x00|00xy00|choice-mobile|penta|hexa|septa|octa|2-digit/.test(slug)) {
    const runs = [...digits.matchAll(/(\d)\1{3,}/g)].sort((a, b) => b[0].length - a[0].length);
    const run = /00/.test(slug) ? runs.find((candidate) => candidate[1] === '0') || runs[0] : runs[0];
    if (run) return splitAt(run.index || 0, (run.index || 0) + run[0].length);
    const zeroPattern = digits.match(/00\d{1,2}00/);
    if (zeroPattern) return splitAt(zeroPattern.index || 0, (zeroPattern.index || 0) + zeroPattern[0].length);
  }

  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7)];
}

export function formatNumberDisplay(value: string | number, category?: Pick<NumberCategoryMatch, 'slug'> | null): string {
  return numberDisplayGroups(value, category).join(' ');
}
