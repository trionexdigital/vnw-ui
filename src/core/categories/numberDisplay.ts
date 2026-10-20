import type { NumberCategoryMatch } from './types';
import { buildHighlightedNumberModel, normalizeNumberDigits } from './highlight';

type DisplayCategory = Pick<NumberCategoryMatch, 'slug'> & Partial<Pick<NumberCategoryMatch, 'match_spans'>>;

/** Presentation-only grouping. Classification and the canonical value never change. */
export function numberDisplayGroups(value: string | number, category?: DisplayCategory | null): string[] {
  const digits = normalizeNumberDigits(value);
  if (digits.length !== 10) return [digits || String(value)];

  // Classifier evidence is authoritative for the category shown to the customer.
  const model = buildHighlightedNumberModel(digits, category?.match_spans);
  if (model.hasHighlights) return model.segments.map((segment) => segment.text);

  const slug = (category?.slug || '').toLowerCase();
  const splitAt = (start: number, end: number, unit = 0) => {
    const matched = digits.slice(start, end);
    const middle = unit ? matched.match(new RegExp(`.{1,${unit}}`, 'g')) || [matched] : [matched];
    return [digits.slice(0, start), ...middle, digits.slice(end)].filter(Boolean);
  };
  const splitRuns = (minimum: number) => {
    const matches = [...digits.matchAll(new RegExp(`(\\d)\\1{${minimum - 1},}`, 'g'))];
    if (!matches.length) return null;
    const groups: string[] = [];
    let cursor = 0;
    for (const match of matches) {
      const start = match.index!;
      if (start > cursor) groups.push(digits.slice(cursor, start));
      groups.push(match[0]);
      cursor = start + match[0].length;
    }
    if (cursor < digits.length) groups.push(digits.slice(cursor));
    return groups;
  };

  if (/mirror|symmetr|customer-care|best-mobile-number/.test(slug)) return [digits.slice(0, 5), digits.slice(5)];

  if (/786|1313|numerology/.test(slug)) {
    const marker = digits.includes('786') ? '786' : digits.includes('1313') ? '1313' : '';
    if (marker) return splitAt(digits.indexOf(marker), digits.indexOf(marker) + marker.length);
  }

  if (/penta|hexa|septa|octa|choice-mobile|buy-vip-mobile-number-online/.test(slug)) {
    const groups = splitRuns(/septa|octa/.test(slug) ? 7 : /hexa|buy-vip-mobile-number-online/.test(slug) ? 6 : /penta/.test(slug) ? 5 : 4);
    if (groups) return groups;
  }

  if (/unforgettable|online-vip-mobile-number/.test(slug)) {
    const groups = splitRuns(/unforgettable/.test(slug) ? 3 : 2);
    if (groups) return groups;
  }

  if (/xyxy|abab|doublling|doubling|xyzxyz|abcd-abcd|vip-number-india|^vip-mobile-number$|^vip-mobile-number-india$|^vip-number-online$/.test(slug)) {
    const units = /abcd-abcd/.test(slug) ? [4, 2, 3] : /xyzxyz|^vip-number-online$/.test(slug) ? [3, 2, 4] : [2, 3, 4];
    for (const unit of units) {
      const pattern = new RegExp(`(\\d{${unit}})\\1+`, 'g');
      const match = [...digits.matchAll(pattern)].sort((a, b) => b[0].length - a[0].length)[0];
      if (match && match[0].length >= unit * 2) return splitAt(match.index || 0, (match.index || 0) + match[0].length, unit);
    }
    if (/doublling|doubling/.test(slug)) {
      const groups = splitRuns(2);
      if (groups) return groups;
    }
  }

  if (/000|00x00|00xy00|choice-mobile|penta|hexa|septa|octa|2-digit/.test(slug)) {
    const runs = [...digits.matchAll(/(\d)\1{2,}/g)].sort((a, b) => b[0].length - a[0].length);
    const run = /00/.test(slug) ? runs.find((candidate) => candidate[1] === '0') || runs[0] : runs[0];
    if (run) return splitAt(run.index || 0, (run.index || 0) + run[0].length);
    const zeroPattern = digits.match(/00\d{1,2}00/);
    if (zeroPattern) return splitAt(zeroPattern.index || 0, (zeroPattern.index || 0) + zeroPattern[0].length);
  }

  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7)];
}

export function formatNumberDisplay(value: string | number, category?: DisplayCategory | null): string {
  return numberDisplayGroups(value, category).join(' ');
}
