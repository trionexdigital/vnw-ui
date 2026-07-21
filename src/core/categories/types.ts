export interface NumberMatchSpan {
  start: number;
  end: number;
}

export interface NumberCategoryMatch {
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  examples?: string[];
  aliases?: string[];
  sort_order?: number;
  priority?: number;
  classifier_version?: number;
  match_spans?: NumberMatchSpan[];
}

export interface NumberCategory extends NumberCategoryMatch {
  number_count: number;
  is_active?: boolean | number;
}

export interface CategoryClassification {
  canonical_number: string;
  categories: NumberCategoryMatch[];
  primary_category: NumberCategoryMatch | null;
  classifier_version: number;
}

export interface CategorizedNumber {
  categories?: NumberCategoryMatch[];
  primary_category?: NumberCategoryMatch | null;
  category_name?: string | null;
  category_slug?: string | null;
}

export function getNumberCategories(value: CategorizedNumber | null | undefined): NumberCategoryMatch[] {
  const candidates = Array.isArray(value?.categories) ? value.categories : [];
  const normalized: NumberCategoryMatch[] = [];
  const seen = new Set<string>();

  for (const category of candidates) {
    const slug = String(category?.slug || '').trim();
    const name = String(category?.name || '').trim();
    if (!slug || !name || seen.has(slug)) continue;
    seen.add(slug);
    normalized.push({ ...category, slug, name });
  }

  const primary = value?.primary_category;
  if (primary?.slug && primary?.name && !seen.has(primary.slug)) {
    normalized.unshift(primary);
    seen.add(primary.slug);
  }

  const legacyName = String(value?.category_name || '').trim();
  const legacySlug = String(value?.category_slug || '').trim();
  if (!normalized.length && legacyName) {
    normalized.push({ slug: legacySlug || legacyName.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: legacyName });
  }

  return normalized;
}

export function getPrimaryCategory(value: CategorizedNumber | null | undefined): NumberCategoryMatch | null {
  const primary = value?.primary_category;
  if (primary && String(primary.slug || '').trim() && String(primary.name || '').trim()) {
    return {
      ...primary,
      slug: String(primary.slug).trim(),
      name: String(primary.name).trim(),
    };
  }

  return getNumberCategories(value)[0] || null;
}

export function getCategoryNames(value: CategorizedNumber | null | undefined, _separator = ', '): string {
  return getPrimaryCategory(value)?.name || '';
}

export function getCategoryCount(category: Pick<NumberCategory, 'number_count'>): number {
  const count = Number(category.number_count);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
