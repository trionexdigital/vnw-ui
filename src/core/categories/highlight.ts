import type { NumberMatchSpan } from './types';

export interface NumberDisplaySegment extends NumberMatchSpan {
  text: string;
  matched: boolean;
}

export interface HighlightedNumberModel {
  canonicalNumber: string;
  segments: NumberDisplaySegment[];
  matchedGroups: string[];
  hasHighlights: boolean;
}

/**
 * Converts API and display values to the ten canonical mobile digits when
 * possible. The optional Indian country code is presentation data, not part
 * of the classifier's zero-based span coordinates.
 */
export function normalizeNumberDigits(value: string | number | null | undefined): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

/**
 * Validates classifier evidence and merges genuine overlaps. Adjacent spans
 * intentionally remain separate because they represent semantic groups such
 * as 70 | 70 | 70 or 00 | 66 | 22.
 */
export function normalizeMatchSpans(
  spans: NumberMatchSpan[] | null | undefined,
  numberLength: number,
): NumberMatchSpan[] | null {
  if (!Array.isArray(spans) || spans.length === 0 || numberLength <= 0) return null;

  const sorted: NumberMatchSpan[] = [];
  for (const span of spans) {
    if (
      !span
      || !Number.isInteger(span.start)
      || !Number.isInteger(span.end)
      || span.start < 0
      || span.end <= span.start
      || span.end > numberLength
    ) {
      return null;
    }
    sorted.push({ start: span.start, end: span.end });
  }

  sorted.sort((a, b) => a.start - b.start || a.end - b.end);

  const normalized: NumberMatchSpan[] = [];
  for (const span of sorted) {
    const previous = normalized[normalized.length - 1];
    if (previous && span.start < previous.end) {
      previous.end = Math.max(previous.end, span.end);
    } else {
      normalized.push({ ...span });
    }
  }

  return normalized;
}

function fallbackSegments(number: string): NumberDisplaySegment[] {
  if (number.length !== 10) {
    return number ? [{ start: 0, end: number.length, text: number, matched: false }] : [];
  }

  return [
    { start: 0, end: 4, text: number.slice(0, 4), matched: false },
    { start: 4, end: 7, text: number.slice(4, 7), matched: false },
    { start: 7, end: 10, text: number.slice(7), matched: false },
  ];
}

export function buildHighlightedNumberModel(
  value: string | number | null | undefined,
  spans: NumberMatchSpan[] | null | undefined,
): HighlightedNumberModel {
  const canonicalNumber = normalizeNumberDigits(value);
  const normalizedSpans = normalizeMatchSpans(spans, canonicalNumber.length);

  if (!normalizedSpans) {
    return {
      canonicalNumber,
      segments: fallbackSegments(canonicalNumber),
      matchedGroups: [],
      hasHighlights: false,
    };
  }

  const segments: NumberDisplaySegment[] = [];
  let cursor = 0;
  for (const span of normalizedSpans) {
    if (span.start > cursor) {
      segments.push({
        start: cursor,
        end: span.start,
        text: canonicalNumber.slice(cursor, span.start),
        matched: false,
      });
    }
    segments.push({
      ...span,
      text: canonicalNumber.slice(span.start, span.end),
      matched: true,
    });
    cursor = span.end;
  }

  if (cursor < canonicalNumber.length) {
    segments.push({
      start: cursor,
      end: canonicalNumber.length,
      text: canonicalNumber.slice(cursor),
      matched: false,
    });
  }

  return {
    canonicalNumber,
    segments,
    matchedGroups: segments.filter((segment) => segment.matched).map((segment) => segment.text),
    hasHighlights: true,
  };
}

export function createNumberAriaLabel(model: HighlightedNumberModel, categoryName?: string | null): string {
  const digitLabel = model.canonicalNumber.split('').join(' ');
  const parts = [`VIP number, digits ${digitLabel || 'unavailable'}.`];
  if (categoryName) parts.push(`Category: ${categoryName}.`);
  if (model.matchedGroups.length > 0) {
    parts.push(`Matching digits: ${model.matchedGroups.join(', ')}.`);
  }
  return parts.join(' ');
}
