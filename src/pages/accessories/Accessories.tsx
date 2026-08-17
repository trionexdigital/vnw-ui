import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { accessoriesAPI, type AccessoryListResponse } from '@/core/api/vnwAPI';
import AccessoryCard from '@/shared/components/AccessoryCard';
import { EmptyState, Loader } from '@/shared/components/ui-bits';
import { MotionGrid, MotionGridItem, MotionReveal } from '@/shared/motion/MotionPrimitives';

export default function Accessories() {
  const [data, setData] = useState<AccessoryListResponse>({ items: [], total: 0, page: 1, limit: 12, facets: [] });
  const [query, setQuery] = useState({ q: '', brand: '', category: '', sort: 'newest', page: 1 });
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { setLoading(true); setError(''); accessoriesAPI.list({ ...query, limit: 12 }).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [query]);
  const brands = [...new Set(data.facets.map((x) => x.brand).filter(Boolean))];
  const categories = [...new Set(data.facets.map((x) => x.category).filter(Boolean))];
  const control = 'min-h-11 rounded-xl border border-border bg-card px-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
  return <div className="mx-auto max-w-7xl px-4 py-8">
    <MotionReveal><header className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-card via-card to-primary/10 p-6 sm:p-10">
      <div className="text-xs font-black uppercase tracking-[.25em] text-primary">VIP lifestyle store</div><h1 className="mt-2 text-3xl font-black text-foreground sm:text-5xl">Accessories that match your number.</h1><p className="mt-3 max-w-2xl text-muted-foreground">Curated mobile essentials with genuine stock, secure payments, free delivery, and seven-day issue support.</p>
    </header></MotionReveal>
    <MotionReveal delay={.06} className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-3 md:grid-cols-[1fr_repeat(3,180px)]">
      <label className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"/><input aria-label="Search accessories" className={`${control} w-full pl-10`} placeholder="Search brand, model or accessory" value={query.q} onChange={(e) => setQuery({ ...query, q: e.target.value, page: 1 })}/></label>
      <select aria-label="Brand" className={control} value={query.brand} onChange={(e) => setQuery({ ...query, brand: e.target.value, page: 1 })}><option value="">All brands</option>{brands.map((x) => <option key={x}>{x}</option>)}</select>
      <select aria-label="Category" className={control} value={query.category} onChange={(e) => setQuery({ ...query, category: e.target.value, page: 1 })}><option value="">All categories</option>{categories.map((x) => <option key={x}>{x}</option>)}</select>
      <select aria-label="Sort" className={control} value={query.sort} onChange={(e) => setQuery({ ...query, sort: e.target.value, page: 1 })}><option value="newest">Newest</option><option value="price_asc">Price: Low to high</option><option value="price_desc">Price: High to low</option></select>
    </MotionReveal>
    <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><SlidersHorizontal className="h-4 w-4"/>{data.total} available products</div>
    {loading ? <div className="py-20"><Loader /></div> : error ? <EmptyState title="Accessories could not be loaded" subtitle={error}/> : !data.items.length ? <EmptyState title="No matching accessories" subtitle="Try clearing one or more filters."/> : <MotionGrid className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.items.map((p) => <MotionGridItem key={p.accessory_id}><AccessoryCard product={p}/></MotionGridItem>)}</MotionGrid>}
    {data.total > data.limit && <nav aria-label="Pagination" className="mt-8 flex justify-center gap-3"><button className="btn-gold-outline min-h-11" disabled={data.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Previous</button><span className="grid min-h-11 place-items-center text-sm font-bold">Page {data.page} of {Math.ceil(data.total/data.limit)}</span><button className="btn-gold-outline min-h-11" disabled={data.page * data.limit >= data.total} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Next</button></nav>}
  </div>;
}
