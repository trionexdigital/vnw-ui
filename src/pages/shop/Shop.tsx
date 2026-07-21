import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronLeft, ChevronRight, X, Sparkles, Search, RotateCcw } from 'lucide-react';
import { numbersAPI, categoriesAPI } from '@/core/api/vnwAPI';
import NumberCard, { NumberItem } from '@/shared/components/NumberCard';
import { Loader } from '@/shared/components/ui-bits';
import { badgeOptions } from '@/core/lib/format';
import { AnimatePresence, motion } from 'framer-motion';
import { MotionGrid, MotionGridItem } from '@/shared/motion/MotionPrimitives';
import type { NumberCategory } from '@/core/categories/types';
import { getCategoryCount } from '@/core/categories/types';

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<NumberCategory[]>([]);
  const [items, setItems] = useState<NumberItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [aiInfo, setAiInfo] = useState<any>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');

  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const ai = params.get('ai') || '';
  const badge = params.get('badge') || '';
  const numerology = params.get('numerology') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 1);
  const priceMax = params.get('price_max') || '';

  useEffect(() => { setSearchDraft(ai || q); }, [ai, q]);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => { v ? next.set(k, v) : next.delete(k); });
    if (!('page' in patch)) next.delete('ai');
    if (!('page' in patch)) next.set('page', '1');
    setParams(next);
  };

  useEffect(() => { categoriesAPI.list().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    const req = ai
      ? numbersAPI.aiSearch({ query: ai, page })
      : numbersAPI.list({ category, q, badge, numerology, sort, page, price_max: priceMax, limit: 12 });
    req
      .then((d) => { setItems(d.items || []); setTotal(d.total || 0); setPages(d.pages || 1); setAiInfo(d.ai || null); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category, q, ai, badge, numerology, sort, page, priceMax]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    const value = searchDraft.trim();
    value ? next.set('q', value) : next.delete('q');
    next.delete('ai');
    next.set('page', '1');
    setParams(next);
  };

  const activeFilters = [
    category && { key: 'category', label: `Category: ${categories.find((item) => item.slug === category)?.name || category}` },
    q && { key: 'q', label: `Digits: ${q}` },
    ai && { key: 'ai', label: `AI: ${ai}` },
    priceMax && { key: 'price_max', label: `Up to ₹${Number(priceMax).toLocaleString('en-IN')}` },
    numerology && { key: 'numerology', label: `Sum: ${numerology}` },
    badge && { key: 'badge', label: badgeOptions.find((item) => item.value === badge)?.label || badge },
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const FilterContent = ({ compact = false }: { compact?: boolean }) => (
    <>
      <div className="mb-5">
        <div className="mb-2 text-xs font-black uppercase text-muted-foreground">Category</div>
        <div className={compact ? 'grid grid-cols-2 gap-2' : 'max-h-[380px] space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]'}>
          <button onClick={() => update({ category: '' })} className={`rounded-xl px-3 py-2 text-left text-sm font-bold ${!category ? 'border border-primary/30 bg-primary/10 text-primary' : 'border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground'}`}>All</button>
          {categories.map((c) => (
            <button key={c.slug} onClick={() => update({ category: c.slug })}
              className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold ${category === c.slug ? 'border border-primary/30 bg-primary/10 text-primary' : 'border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
              <span className="min-w-0 truncate">{c.name}</span>
              <span className="shrink-0 text-[10px] opacity-70">{getCategoryCount(c).toLocaleString('en-IN')}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mb-5">
        <div className="mb-2 text-xs font-black uppercase text-muted-foreground">Max Price: {priceMax ? `Rs ${Number(priceMax).toLocaleString('en-IN')}` : 'Any'}</div>
        <input aria-label="Maximum price" type="range" min={5000} max={100000} step={5000} value={priceMax || 100000}
          onChange={(e) => update({ price_max: e.target.value })} className="w-full accent-amber-700" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <div className="mb-2 text-xs font-black uppercase text-muted-foreground">Numerology Sum</div>
          <select value={numerology} onChange={(e) => update({ numerology: e.target.value })} className="input-luxury w-full">
            <option value="">Any</option>
            {Array.from({ length: 9 }).map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
          </select>
        </div>
        <div>
          <div className="mb-2 text-xs font-black uppercase text-muted-foreground">Badge</div>
          <select value={badge} onChange={(e) => update({ badge: e.target.value === 'NONE' ? '' : e.target.value })} className="input-luxury w-full">
            <option value="">Any</option>
            {badgeOptions.filter((b) => b.value !== 'NONE').map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
      </div>
      <button onClick={() => setParams(new URLSearchParams())} className="btn-gold-outline mt-5 w-full text-sm">Clear Filters</button>
    </>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <form onSubmit={submitSearch} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Search mobile number digits</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
            <input
              type="search"
              inputMode="numeric"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search any digits or pattern, e.g. 9999 or 786"
              className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-base font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/15"
            />
          </label>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-black text-background transition hover:opacity-90">
            <Search className="h-4 w-4" /> Search numbers
          </button>
        </form>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs font-bold text-muted-foreground">
          <span className="shrink-0 py-2">Quick search:</span>
          {['9999', '786', '0001', '1234'].map((term) => (
            <button key={term} onClick={() => { setSearchDraft(term); update({ q: term }); }} className="shrink-0 rounded-full border border-border bg-muted px-3 py-2 transition hover:border-primary hover:bg-accent">{term}</button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="chip mb-2 text-primary">Premium marketplace</div>
          <h1 className="text-2xl font-black text-foreground">Browse <span className="text-primary">VIP numbers</span></h1>
          <p className="text-sm text-muted-foreground">{total} numbers available{category ? ` / ${category}` : ''}{q ? ` / "${q}"` : ''}{ai ? ` / AI: "${ai}"` : ''}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button onClick={() => setFiltersOpen(true)} className="btn-gold-outline flex-1 text-sm lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
          <select value={sort} onChange={(e) => update({ sort: e.target.value })} className="input-luxury flex-1 sm:min-w-[210px]">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="discount">Biggest Discount</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <button key={filter.key} onClick={() => update({ [filter.key]: '' })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary">
              {filter.label}<X className="h-3.5 w-3.5" />
            </button>
          ))}
          <button onClick={() => setParams(new URLSearchParams())} className="inline-flex min-h-9 items-center gap-1.5 px-2 text-xs font-bold text-muted-foreground hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /> Reset all</button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <aside className="vnw-card hidden h-fit p-4 lg:block">
          <div className="mb-4 flex items-center gap-2 font-black text-foreground"><SlidersHorizontal className="h-4 w-4 text-primary" /> Filters</div>
          <FilterContent />
        </aside>

        <div>
          {aiInfo && (
            <div className="mb-5 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <div className="text-sm font-black text-foreground">AI search results</div>
              <p className="mt-1 text-sm text-muted-foreground">{aiInfo.explanation} <span className="font-bold text-primary">({aiInfo.mode === 'openai' ? 'AI assisted' : 'smart matching'})</span></p>
            </div>
          )}
          {loading ? <Loader variant="cards" /> : items.length === 0 ? (
            <div className="vnw-card px-5 py-14 text-center">
              <Search className="mx-auto h-9 w-9 text-primary" />
              <h2 className="mt-3 text-lg font-black text-foreground">No exact match yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Try fewer digits, a higher budget, or send your preferred pattern and budget to our team.</p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <button onClick={() => setParams(new URLSearchParams())} className="btn-royal">Clear filters</button>
                <Link to="/contact?subject=choice-number" className="btn-gold-outline">Request a choice number</Link>
              </div>
            </div>
          ) : (
            <>
              <MotionGrid className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((n) => <MotionGridItem key={n.number_id}><NumberCard item={n} /></MotionGridItem>)}
              </MotionGrid>
              {pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} className="btn-gold-outline !px-3 !py-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="px-3 text-sm text-muted-foreground">Page {page} of {pages}</span>
                  <button disabled={page >= pages} onClick={() => update({ page: String(page + 1) })} className="btn-gold-outline !px-3 !py-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
      {filtersOpen && (
        <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-stone-950/35" onClick={() => setFiltersOpen(false)} />
          <motion.div className="glass-panel absolute inset-x-3 bottom-3 max-h-[82vh] overflow-y-auto rounded-xl p-4" initial={{ y: 28 }} animate={{ y: 0 }} exit={{ y: 28 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-base font-black text-foreground"><Sparkles className="h-4 w-4 text-primary" /> Smart filters</div>
                <p className="text-xs text-muted-foreground">Optimized for mobile browsing</p>
              </div>
              <button onClick={() => setFiltersOpen(false)} className="grid h-10 w-10 place-items-center rounded-2xl bg-card/70 text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <FilterContent compact />
            <button onClick={() => setFiltersOpen(false)} className="btn-royal mt-3 w-full">Show results</button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
