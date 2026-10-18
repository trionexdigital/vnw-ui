import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import { categoriesAPI, siteAPI, type CorporatePack, type CorporatePackType } from '@/core/api/vnwAPI';
import type { NumberCategory } from '@/core/categories/types';
import { ThemedSelect } from '@/shared/ui/themed-select';
import CompactPageHeader from '@/shared/components/CompactPageHeader';
import { Loader } from '@/shared/components/ui-bits';
import { CorporatePackCard, PACK_TYPE_LABELS } from '@/pages/home/components/MarketplaceSections';

const SIZES = [10, 20, 50, 75, 100, 150, 200];
const TYPES: CorporatePackType[] = ['SERIES', 'MIXED', 'SIMILAR_START', 'SIMILAR_END', 'SIMILAR_BOTH'];

export default function CorporateNumbers({ preview = false }: { preview?: boolean }) {
  const [packs, setPacks] = useState<CorporatePack[]>([]);
  const [categories, setCategories] = useState<NumberCategory[]>([]);
  const [size, setSize] = useState(10);
  const [type, setType] = useState<CorporatePackType>('SERIES');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    categoriesAPI.list().then((items) => { if (active) setCategories(items); }).catch(() => { if (active) setError('Unable to load categories. Please retry.'); });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    siteAPI.corporatePacks({ size, pack_type: type, category_slug: category || undefined, limit: preview ? 4 : 12 })
      .then((items) => { if (active) setPacks(items); })
      .catch((failure) => { if (active) { setPacks([]); setError(failure.message || 'Unable to load corporate packs.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [size, type, category, preview, retry]);
  const controls = 'public-control h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-bold';
  return <section className={preview ? 'home-corporate-shelf bg-background py-6' : 'compact-content-page bg-background py-4'} aria-label="Corporate Numbers">
    <div className="page-container">
      {preview ? <div className="home-discovery-heading"><h2>Corporate Numbers</h2><Link className="home-discovery-view-all" to="/corporate-numbers">View all <ArrowRight size={17} /></Link></div> : <CompactPageHeader title="Corporate Numbers" subtitle="Give your business one memorable identity with a complete pack of live VIP numbers." icon={Building2} />}
      <div className="my-4 grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-3">
        <label className="grid gap-1.5 text-xs font-bold">Matching style<ThemedSelect aria-label="Corporate matching style" className={controls} value={type} onChange={(event) => setType(event.target.value as CorporatePackType)}>{TYPES.map((value) => <option key={value} value={value}>{PACK_TYPE_LABELS[value]}</option>)}</ThemedSelect></label>
        <label className="grid gap-1.5 text-xs font-bold">Pack of<ThemedSelect aria-label="Corporate pack size" className={controls} value={size} onChange={(event) => setSize(Number(event.target.value))}>{SIZES.map((value) => <option key={value} value={value}>{value} numbers</option>)}</ThemedSelect></label>
        <label className="grid gap-1.5 text-xs font-bold">Category<ThemedSelect aria-label="Corporate category" className={controls} value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</ThemedSelect></label>
      </div>
      {loading ? <Loader variant="packs" /> : error ? <div role="alert" className="rounded-2xl border border-border bg-card p-5 text-sm">{error}<button onClick={() => setRetry((value) => value + 1)} className="btn-gold-outline ml-3">Retry</button></div> : packs.length ? <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-4">{packs.map((pack) => <CorporatePackCard key={pack.pack_id} pack={pack} />)}</div> : <div className="rounded-2xl border border-border bg-card p-6 text-center"><Building2 className="mx-auto h-7 w-7 text-primary" /><h3 className="mt-2 text-sm font-black">No complete matching packs available</h3><p className="mt-2 text-xs text-muted-foreground">Try a smaller pack, another category, or a different matching style.</p><Link to="/contact?subject=corporate-numbers" className="btn-gold-outline mt-4">Request a corporate pack <ArrowRight size={15} /></Link></div>}
    </div>
  </section>;
}
