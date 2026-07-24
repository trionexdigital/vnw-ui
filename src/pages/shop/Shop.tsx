import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { numbersAPI, categoriesAPI } from '@/core/api/vnwAPI';
import NumberCard, { NumberItem } from '@/shared/components/NumberCard';
import { Loader } from '@/shared/components/ui-bits';
import { badgeOptions } from '@/core/lib/format';
import { MotionGrid, MotionGridItem } from '@/shared/motion/MotionPrimitives';
import type { NumberCategory } from '@/core/categories/types';
import { getCategoryCount } from '@/core/categories/types';
import SearchWorkbench from './SearchWorkbench';
import {
  PATTERN_PRESETS,
  PRICE_BANDS,
  formatPrice,
  listPayloadFromParams,
} from './searchTypes';

interface SearchAlternative {
  relaxed_key: string;
  label: string;
  items: NumberItem[];
}

type FilterTab = 'categories' | 'prices';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Biggest Discount' },
  { value: 'popular', label: 'Most Popular' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<NumberCategory[]>([]);
  const [items, setItems] = useState<NumberItem[]>([]);
  const [alternatives, setAlternatives] = useState<SearchAlternative[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryToken, setRetryToken] = useState(0);
  const [aiInfo, setAiInfo] = useState<any>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('categories');
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const filterDialogRef = useRef<HTMLDivElement>(null);
  const paramsKey = params.toString();

  const category = params.get('category') || '';
  const ai = params.get('ai') || '';
  const sort = params.get('sort') || 'newest';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const priceMin = params.get('price_min') || '';
  const priceMax = params.get('price_max') || '';

  const update = (patch: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    next.delete('focus');
    if (resetPage) next.delete('page');
    setParams(next);
  };

  const resetAll = () => setParams(new URLSearchParams());

  useEffect(() => {
    categoriesAPI.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const listingPayload = listPayloadFromParams(params);
    const request = ai
      ? numbersAPI.aiSearch({ ...listingPayload, query: ai })
      : numbersAPI.list(listingPayload);
    request
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setAlternatives(data.alternatives || []);
        setTotal(data.total || 0);
        setPages(Math.max(1, data.pages || 1));
        setAiInfo(data.ai || null);
      })
      .catch((requestError: any) => {
        if (cancelled) return;
        setItems([]);
        setAlternatives([]);
        setTotal(0);
        setPages(1);
        setAiInfo(null);
        setError(requestError?.message || 'We could not load VIP numbers. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [paramsKey, retryToken]);

  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFiltersOpen(false);
      if (event.key === 'Tab') {
        const focusable = Array.from(filterDialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ) || []).filter((element) => !element.hasAttribute('hidden'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      filterButtonRef.current?.focus();
    };
  }, [filtersOpen]);

  const setPriceBand = (min: string, max: string) => update({ price_min: min, price_max: max });
  const selectedPrice = PRICE_BANDS.find((band) => band.min === priceMin && band.max === priceMax);

  const activeFilters = useMemo(() => {
    const filters: Array<{ id: string; label: string; keys: string[] }> = [];
    const categoryItem = categories.find((item) => item.slug === category);
    if (category) filters.push({
      id: 'category',
      label: `Category: ${categoryItem?.name || category}`,
      keys: ['category'],
    });
    if (ai) filters.push({ id: 'ai', label: `AI: ${ai}`, keys: ['ai', 'mode'] });
    const q = params.get('q');
    if (q) {
      const scopeLabel = params.get('global_scope') === 'starts_with'
        ? 'Starts with'
        : params.get('global_scope') === 'ends_with'
          ? 'Ends with'
          : 'Contains';
      filters.push({ id: 'q', label: `${scopeLabel}: ${q}`, keys: ['q', 'global_scope', 'mode'] });
    }
    if (priceMin || priceMax) filters.push({
      id: 'price',
      label: selectedPrice?.label || `${priceMin ? `From ${formatPrice(priceMin)}` : 'Any minimum'} · ${priceMax ? `to ${formatPrice(priceMax)}` : 'Any maximum'}`,
      keys: ['price_min', 'price_max'],
    });
    const patternLabels = new Map(PATTERN_PRESETS.map((preset) => [preset.value, preset.label]));
    const direct: Array<{ key: string; label: string }> = [
      { key: 'starts_with', label: 'Starts with' },
      { key: 'anywhere', label: 'Anywhere' },
      { key: 'ends_with', label: 'Ends with' },
      { key: 'must_contain', label: 'Must contain' },
      { key: 'must_not_contain', label: 'Must not contain' },
      { key: 'digit_sum', label: 'Full sum' },
      { key: 'mid_sum', label: 'Mid sum' },
      { key: 'score_sum', label: 'Root sum' },
      { key: 'exact_mask', label: 'Mask' },
    ];
    direct.forEach(({ key, label }) => {
      const value = params.get(key);
      if (value) filters.push({ id: key, label: `${label}: ${value}`, keys: [key] });
    });
    ['starts_with_pattern', 'ends_with_pattern'].forEach((key) => {
      const value = params.get(key);
      if (value) filters.push({
        id: key,
        label: `${key.startsWith('starts') ? 'Starts' : 'Ends'}: ${patternLabels.get(value as any) || value}`,
        keys: [key],
      });
    });
    const frequency = params.get('frequencies');
    if (frequency) filters.push({ id: 'frequencies', label: 'Digit frequency', keys: ['frequencies'] });
    const numerology = params.get('numerology');
    if (numerology) filters.push({ id: 'numerology', label: `Numerology: ${numerology}`, keys: ['numerology'] });
    const badge = params.get('badge');
    if (badge) filters.push({
      id: 'badge',
      label: `Badge: ${badgeOptions.find((item) => item.value === badge)?.label || badge}`,
      keys: ['badge'],
    });
    return filters;
  }, [paramsKey, categories, category, ai, priceMin, priceMax, selectedPrice?.label]);

  const removeChip = (keys: string[]) => {
    const next = new URLSearchParams(params);
    keys.forEach((key) => next.delete(key));
    next.delete('page');
    setParams(next);
  };

  const FilterOptions = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex min-h-0 flex-1 flex-col ${mobile ? '' : 'px-4 pb-4'}`}>
      <div className="grid grid-cols-2 rounded-xl border border-border bg-muted p-1" role="tablist" aria-label="Filter groups">
        <button
          type="button"
          role="tab"
          aria-selected={filterTab === 'categories'}
          onClick={() => setFilterTab('categories')}
          className={`min-h-10 rounded-lg text-sm font-black transition ${filterTab === 'categories' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Categories
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filterTab === 'prices'}
          onClick={() => setFilterTab('prices')}
          className={`min-h-10 rounded-lg text-sm font-black transition ${filterTab === 'prices' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Prices
        </button>
      </div>
      <div
        role="tabpanel"
        className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]"
      >
        {filterTab === 'categories' ? (
          <>
            <button
              type="button"
              onClick={() => update({ category: '' })}
              className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-bold ${
                !category ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <span>All Categories</span>
              {!category && <Check className="h-4 w-4" aria-hidden="true" />}
            </button>
            {categories.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => update({ category: item.slug })}
                className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-sm font-bold ${
                  category === item.slug
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <span className="min-w-0 truncate">{item.name}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${category === item.slug ? 'bg-background/20' : 'bg-muted'}`}>
                  {getCategoryCount(item).toLocaleString('en-IN')}
                </span>
              </button>
            ))}
          </>
        ) : PRICE_BANDS.map((band) => {
          const selected = band.min === priceMin && band.max === priceMax;
          return (
            <button
              key={band.label}
              type="button"
              onClick={() => setPriceBand(band.min, band.max)}
              className={`flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-bold ${
                selected ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {band.label}
              {selected && <Check className="h-4 w-4" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  const FilterHeader = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="shrink-0 border-b border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
          <Filter className="h-5 w-5 text-primary" aria-hidden="true" /> Filters
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-black text-primary hover:bg-primary/10"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
          </button>
          {mobile && (
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-border text-foreground"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <label className="mt-3 block text-xs font-black uppercase tracking-wide text-muted-foreground">
        Sort results
        <select
          value={sort}
          onChange={(event) => update({ sort: event.target.value })}
          className="input-luxury mt-1 h-11 w-full text-base normal-case tracking-normal"
        >
          {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl overflow-x-clip px-4 py-6 sm:px-6 lg:px-8">
      <SearchWorkbench placement="shop" loading={loading} error={error} />

      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[.12em] text-primary">
            Premium marketplace
          </div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            VIP number <span className="text-primary">results</span>
          </h1>
          <p aria-live="polite" className="mt-1 text-sm text-muted-foreground">
            {loading ? 'Searching available numbers…' : `${total.toLocaleString('en-IN')} exact ${total === 1 ? 'match' : 'matches'}`}
          </p>
        </div>
        <div className="flex gap-2 lg:hidden">
          <button
            ref={filterButtonRef}
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="btn-gold-outline min-h-11 flex-1 text-sm sm:min-w-36"
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters{activeFilters.length ? ` (${activeFilters.length})` : ''}
          </button>
          <label className="min-w-0 flex-1 sm:min-w-52">
            <span className="sr-only">Sort results</span>
            <select
              value={sort}
              onChange={(event) => update({ sort: event.target.value })}
              className="input-luxury h-11 w-full text-base"
            >
              {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => removeChip(filter.keys)}
              className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 text-left text-xs font-bold text-primary"
            >
              <span className="truncate">{filter.label}</span>
              <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only">Remove {filter.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex min-h-9 items-center gap-1.5 px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset all
          </button>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] min-h-[480px] self-start overflow-hidden lg:block">
          <div className="vnw-card flex h-full max-h-[calc(100vh-7rem)] min-h-[480px] flex-col overflow-hidden">
            <FilterHeader />
            <FilterOptions />
          </div>
        </aside>

        <section aria-label="VIP number search results" className="min-w-0">
          {aiInfo && (
            <div className="mb-5 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-foreground">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> AI search interpretation
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {aiInfo.explanation}{' '}
                <span className="font-bold text-primary">
                  ({aiInfo.mode === 'openai' ? 'AI assisted' : 'smart local matching'})
                </span>
              </p>
            </div>
          )}

          {loading ? (
            <Loader variant="cards" />
          ) : error ? (
            <div className="vnw-card px-5 py-14 text-center" role="alert">
              <Search className="mx-auto h-9 w-9 text-destructive" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-black text-foreground">Search is temporarily unavailable</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{error}</p>
              <button type="button" onClick={() => setRetryToken((value) => value + 1)} className="btn-royal mt-5">Try again</button>
            </div>
          ) : items.length === 0 ? (
            <>
              <div className="vnw-card px-5 py-10 text-center">
                <Search className="mx-auto h-9 w-9 text-primary" aria-hidden="true" />
                <h2 className="mt-3 text-lg font-black text-foreground">No exact match found</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  We checked every active condition together. Review a filter or explore the closest matches below.
                </p>
                <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                  <button type="button" onClick={resetAll} className="btn-royal">Reset search</button>
                  <Link to="/contact?subject=choice-number" className="btn-gold-outline">Request a choice number</Link>
                </div>
              </div>
              {alternatives.map((group) => (
                <section key={group.relaxed_key} className="mt-8" aria-labelledby={`alternative-${group.relaxed_key}`}>
                  <div className="mb-3">
                    <div className="text-xs font-black uppercase tracking-[.12em] text-primary">Closest matches</div>
                    <h2 id={`alternative-${group.relaxed_key}`} className="mt-1 text-lg font-black text-foreground">{group.label}</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.slice(0, 6).map((number) => <NumberCard key={number.number_id} item={number} />)}
                  </div>
                </section>
              ))}
            </>
          ) : (
            <>
              <MotionGrid className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((number) => (
                  <MotionGridItem key={number.number_id}>
                    <NumberCard item={number} />
                  </MotionGridItem>
                ))}
              </MotionGrid>
              {pages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Search results pagination">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => update({ page: String(page - 1) }, false)}
                    className="btn-gold-outline min-h-11 px-3 disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="px-3 text-sm font-semibold text-muted-foreground">Page {page} of {pages}</span>
                  <button
                    type="button"
                    disabled={page >= pages}
                    onClick={() => update({ page: String(page + 1) }, false)}
                    className="btn-gold-outline min-h-11 px-3 disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            className="fixed inset-0 z-[80] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Dismiss filters"
              className="absolute inset-0 h-full w-full bg-foreground/45"
              onClick={() => setFiltersOpen(false)}
            />
            <motion.div
              ref={filterDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-filter-title"
              className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] min-h-[65dvh] flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div id="mobile-filter-title" className="sr-only">Filter VIP number results</div>
              <FilterHeader mobile />
              <div className="flex min-h-0 flex-1 flex-col px-4 pt-4">
                <FilterOptions mobile />
              </div>
              <div className="shrink-0 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button type="button" onClick={() => setFiltersOpen(false)} className="btn-royal min-h-12 w-full">
                  Apply · Show {total.toLocaleString('en-IN')} Results
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
