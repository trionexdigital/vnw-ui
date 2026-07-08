import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { numbersAPI, categoriesAPI } from '@/core/api/vnwAPI';
import NumberCard, { NumberItem } from '@/shared/components/NumberCard';
import { Loader } from '@/shared/components/ui-bits';
import { badgeOptions, operatorOptions } from '@/core/lib/format';

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<NumberItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [aiInfo, setAiInfo] = useState<any>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const ai = params.get('ai') || '';
  const badge = params.get('badge') || '';
  const operator = params.get('operator') || '';
  const numerology = params.get('numerology') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 1);
  const priceMax = params.get('price_max') || '';

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
      : numbersAPI.list({ category, q, badge, operator, numerology, sort, page, price_max: priceMax, limit: 12 });
    req
      .then((d) => { setItems(d.items || []); setTotal(d.total || 0); setPages(d.pages || 1); setAiInfo(d.ai || null); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category, q, ai, badge, operator, numerology, sort, page, priceMax]);

  const FilterContent = ({ compact = false }: { compact?: boolean }) => (
    <>
      <div className="mb-5">
        <div className="mb-2 text-xs font-black uppercase text-muted-foreground">Category</div>
        <div className={compact ? 'grid grid-cols-2 gap-2' : 'space-y-1'}>
          <button onClick={() => update({ category: '' })} className={`rounded-xl px-3 py-2 text-left text-sm font-bold ${!category ? 'bg-white/80 text-[#7c2cff] shadow-sm' : 'bg-white/35 text-muted-foreground hover:text-foreground'}`}>All</button>
          {categories.map((c) => (
            <button key={c.category_id} onClick={() => update({ category: c.slug })}
              className={`rounded-xl px-3 py-2 text-left text-sm font-bold ${category === c.slug ? 'bg-white/80 text-[#7c2cff] shadow-sm' : 'bg-white/35 text-muted-foreground hover:text-foreground'}`}>{c.name}</button>
          ))}
        </div>
      </div>
      <div className="mb-5">
        <div className="mb-2 text-xs font-black uppercase text-muted-foreground">Max Price: {priceMax ? `Rs ${Number(priceMax).toLocaleString('en-IN')}` : 'Any'}</div>
        <input type="range" min={5000} max={100000} step={5000} value={priceMax || 100000}
          onChange={(e) => update({ price_max: e.target.value })} className="w-full accent-fuchsia-500" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <div>
          <div className="mb-2 text-xs font-black uppercase text-muted-foreground">Operator</div>
          <select value={operator} onChange={(e) => update({ operator: e.target.value })} className="input-luxury w-full">
            <option value="">Any</option>
            {operatorOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="chip mb-2 text-[#7c2cff]">Premium Marketplace</div>
          <h1 className="text-3xl font-black text-[#1d1830]">Browse <span className="text-gradient-vnw">VIP Numbers</span></h1>
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

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="vnw-card hidden h-fit p-5 lg:block">
          <div className="mb-4 flex items-center gap-2 font-black text-[#1d1830]"><SlidersHorizontal className="h-4 w-4 text-[#7c2cff]" /> Filters</div>
          <FilterContent />
        </aside>

        <div>
          {aiInfo && (
            <div className="glass-panel mb-5 rounded-2xl p-4">
              <div className="text-sm font-black text-[#1d1830]">AI Search Results</div>
              <p className="mt-1 text-sm text-muted-foreground">{aiInfo.explanation} <span className="font-bold text-[#7c2cff]">({aiInfo.mode === 'openai' ? 'OpenAI agent' : 'local DB agent'})</span></p>
            </div>
          )}
          {loading ? <Loader variant="cards" /> : items.length === 0 ? (
            <div className="vnw-card py-20 text-center text-muted-foreground">No numbers match your filters.</div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((n) => <NumberCard key={n.number_id} item={n} />)}
              </div>
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

      {filtersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-[#1d1830]/35 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div className="glass-panel absolute inset-x-3 bottom-3 max-h-[82vh] overflow-y-auto rounded-[1.5rem] p-4 animate-rise-in">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-base font-black text-[#1d1830]"><Sparkles className="h-4 w-4 text-[#7c2cff]" /> Smart Filters</div>
                <p className="text-xs text-muted-foreground">Optimized for mobile browsing</p>
              </div>
              <button onClick={() => setFiltersOpen(false)} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70"><X className="h-5 w-5" /></button>
            </div>
            <FilterContent compact />
            <button onClick={() => setFiltersOpen(false)} className="btn-royal mt-3 w-full">Show Results</button>
          </div>
        </div>
      )}
    </div>
  );
}
