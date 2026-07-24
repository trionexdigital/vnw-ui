export type SearchMode = 'ai' | 'global' | 'price' | 'advanced';
export type GlobalScope = 'anywhere' | 'starts_with' | 'ends_with';
export type PatternPreset =
  | 'double'
  | 'triple'
  | 'tetra'
  | 'penta'
  | 'hexa'
  | 'counting'
  | 'doubling'
  | 'abc_abc'
  | 'ab_ab'
  | 'mirror'
  | 'semi_mirror';

export interface DigitFrequency {
  digit: string;
  min: string;
  max: string;
}

export interface SearchState {
  mode: SearchMode;
  ai: string;
  globalScope: GlobalScope;
  globalDigits: string;
  priceMin: string;
  priceMax: string;
  startsWith: string;
  startsPattern: PatternPreset | '';
  anywhere: string;
  endsWith: string;
  endsPattern: PatternPreset | '';
  mustContain: string;
  mustNotContain: string;
  digitSum: string;
  midSum: string;
  scoreSum: string;
  exactMask: string;
  frequencies: DigitFrequency[];
}

export const PRICE_BANDS = [
  { label: 'Any Price', min: '', max: '' },
  { label: '₹0 – ₹1,500', min: '0', max: '1500' },
  { label: '₹1,501 – ₹3,000', min: '1501', max: '3000' },
  { label: '₹3,001 – ₹5,000', min: '3001', max: '5000' },
  { label: '₹5,001 – ₹10,000', min: '5001', max: '10000' },
  { label: '₹10,001 – ₹30,000', min: '10001', max: '30000' },
  { label: '₹30,001 – ₹50,000', min: '30001', max: '50000' },
  { label: '₹50,001 – ₹1,00,000', min: '50001', max: '100000' },
  { label: '₹1,00,001 – ₹10,00,000', min: '100001', max: '1000000' },
] as const;

export const PATTERN_PRESETS: Array<{ value: PatternPreset; label: string }> = [
  { value: 'double', label: 'Double' },
  { value: 'triple', label: 'Triple' },
  { value: 'tetra', label: 'Tetra' },
  { value: 'penta', label: 'Penta' },
  { value: 'hexa', label: 'Hexa' },
  { value: 'counting', label: 'Counting' },
  { value: 'doubling', label: 'Doubling' },
  { value: 'abc_abc', label: 'ABC ABC' },
  { value: 'ab_ab', label: 'AB AB' },
  { value: 'mirror', label: 'Mirror' },
  { value: 'semi_mirror', label: 'Semi Mirror' },
];

export const SEARCH_PARAM_KEYS = [
  'mode',
  'ai',
  'q',
  'global_scope',
  'starts_with',
  'starts_with_pattern',
  'anywhere',
  'ends_with',
  'ends_with_pattern',
  'must_contain',
  'must_not_contain',
  'digit_sum',
  'mid_sum',
  'score_sum',
  'exact_mask',
  'frequencies',
] as const;

const blankState = (): SearchState => ({
  mode: 'ai',
  ai: '',
  globalScope: 'anywhere',
  globalDigits: '',
  priceMin: '',
  priceMax: '',
  startsWith: '',
  startsPattern: '',
  anywhere: '',
  endsWith: '',
  endsPattern: '',
  mustContain: '',
  mustNotContain: '',
  digitSum: '',
  midSum: '',
  scoreSum: '',
  exactMask: '',
  frequencies: [],
});

function parseFrequencies(value: string | null): DigitFrequency[] {
  if (!value) return [];
  return value.split(';').slice(0, 10).flatMap((group) => {
    const [digit = '', min = '', max = ''] = group.split(':');
    if (!/^\d$/.test(digit)) return [];
    return [{ digit, min, max }];
  });
}

export function readSearchState(params: URLSearchParams): SearchState {
  const state = blankState();
  const requestedMode = params.get('mode');
  const hasAdvanced = [
    'starts_with', 'starts_with_pattern', 'anywhere', 'ends_with', 'ends_with_pattern',
    'must_contain', 'must_not_contain', 'digit_sum', 'mid_sum', 'score_sum',
    'exact_mask', 'frequencies',
  ].some((key) => params.has(key));
  state.mode = requestedMode === 'ai' || requestedMode === 'global'
    || requestedMode === 'price' || requestedMode === 'advanced'
    ? requestedMode
    : params.has('ai')
      ? 'ai'
      : hasAdvanced
        ? 'advanced'
        : params.has('price_min') || params.has('price_max')
          ? 'price'
          : params.has('q')
            ? 'global'
            : 'ai';
  state.ai = params.get('ai') || '';
  state.globalScope = params.get('global_scope') === 'starts_with'
    || params.get('global_scope') === 'ends_with'
    ? params.get('global_scope') as GlobalScope
    : 'anywhere';
  state.globalDigits = params.get('q') || '';
  state.priceMin = params.get('price_min') || '';
  state.priceMax = params.get('price_max') || '';
  state.startsWith = params.get('starts_with') || '';
  state.startsPattern = (params.get('starts_with_pattern') || '') as PatternPreset | '';
  state.anywhere = params.get('anywhere') || '';
  state.endsWith = params.get('ends_with') || '';
  state.endsPattern = (params.get('ends_with_pattern') || '') as PatternPreset | '';
  state.mustContain = params.get('must_contain') || '';
  state.mustNotContain = params.get('must_not_contain') || '';
  state.digitSum = params.get('digit_sum') || '';
  state.midSum = params.get('mid_sum') || '';
  state.scoreSum = params.get('score_sum') || '';
  state.exactMask = params.get('exact_mask') || '';
  state.frequencies = parseFrequencies(params.get('frequencies'));
  return state;
}

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}

export function writeSearchState(current: URLSearchParams, state: SearchState) {
  const params = new URLSearchParams(current);
  SEARCH_PARAM_KEYS.forEach((key) => params.delete(key));
  params.set('mode', state.mode);
  params.delete('page');

  if (state.mode === 'ai') {
    const query = state.ai.trim();
    if (/^\d{1,10}$/.test(query)) {
      params.set('mode', 'global');
      params.set('global_scope', 'anywhere');
      params.set('q', query);
    } else {
      setOrDelete(params, 'ai', query);
    }
  }
  if (state.mode === 'global') {
    params.set('global_scope', state.globalScope);
    setOrDelete(params, 'q', state.globalDigits.replace(/\D/g, '').slice(0, 10));
  }
  if (state.mode === 'price') {
    setOrDelete(params, 'price_min', state.priceMin);
    setOrDelete(params, 'price_max', state.priceMax);
  }
  if (state.mode === 'advanced') {
    setOrDelete(params, 'starts_with', state.startsWith);
    setOrDelete(params, 'starts_with_pattern', state.startsPattern);
    setOrDelete(params, 'anywhere', state.anywhere);
    setOrDelete(params, 'ends_with', state.endsWith);
    setOrDelete(params, 'ends_with_pattern', state.endsPattern);
    setOrDelete(params, 'must_contain', state.mustContain);
    setOrDelete(params, 'must_not_contain', state.mustNotContain);
    setOrDelete(params, 'digit_sum', state.digitSum);
    setOrDelete(params, 'mid_sum', state.midSum);
    setOrDelete(params, 'score_sum', state.scoreSum);
    setOrDelete(params, 'exact_mask', state.exactMask);
    setOrDelete(
      params,
      'frequencies',
      state.frequencies.map(({ digit, min, max }) => `${digit}:${min}:${max}`).join(';'),
    );
    setOrDelete(params, 'price_min', state.priceMin);
    setOrDelete(params, 'price_max', state.priceMax);
  }
  return params;
}

function commaValues(value: string | null) {
  return (value || '')
    .split(',')
    .map((entry) => entry.replace(/\D/g, '').slice(0, 10))
    .filter(Boolean);
}

export function listPayloadFromParams(params: URLSearchParams) {
  const search: Record<string, unknown> = { include_alternatives: true };
  const scope = params.get('global_scope') || 'anywhere';
  const q = (params.get('q') || '').replace(/\D/g, '').slice(0, 10);
  if (q && scope === 'starts_with') search.starts_with = q;
  else if (q && scope === 'ends_with') search.ends_with = q;

  const directKeys = [
    'starts_with', 'starts_with_pattern', 'anywhere', 'ends_with',
    'ends_with_pattern', 'digit_sum', 'mid_sum', 'score_sum', 'exact_mask',
  ] as const;
  directKeys.forEach((key) => {
    const value = params.get(key);
    if (value) search[key] = ['digit_sum', 'mid_sum', 'score_sum'].includes(key) ? Number(value) : value;
  });
  const mustContain = commaValues(params.get('must_contain'));
  const mustNotContain = commaValues(params.get('must_not_contain'));
  if (mustContain.length) search.must_contain = mustContain;
  if (mustNotContain.length) search.must_not_contain = mustNotContain;
  const frequencies = parseFrequencies(params.get('frequencies')).map(({ digit, min, max }) => ({
    digit: Number(digit),
    ...(min ? { min: Number(min) } : {}),
    ...(max ? { max: Number(max) } : {}),
  }));
  if (frequencies.length) search.digit_frequencies = frequencies;

  return {
    category: params.get('category') || undefined,
    ...(q && scope === 'anywhere' ? { q } : {}),
    badge: params.get('badge') || undefined,
    numerology: params.get('numerology') || undefined,
    sort: params.get('sort') || 'newest',
    page: Math.max(1, Number(params.get('page')) || 1),
    price_min: params.get('price_min') || undefined,
    price_max: params.get('price_max') || undefined,
    limit: 12,
    search,
  };
}

export function formatPrice(value: string | number) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}
