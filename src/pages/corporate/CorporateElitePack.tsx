import { ThemedSelect } from '@/shared/ui/themed-select';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Check, Users2 } from 'lucide-react';
import { siteAPI, type CorporatePack, type CorporatePackType } from '@/core/api/vnwAPI';
import CompactPageHeader from '@/shared/components/CompactPageHeader';
import { PACK_TYPE_LABELS } from '@/pages/home/components/MarketplaceSections';
import FamilyPackCard from '@/shared/components/FamilyPackCard';
import { Loader } from '@/shared/components/ui-bits';

const types: CorporatePackType[] = ['MIXED', 'SIMILAR_START', 'SIMILAR_END', 'SIMILAR_BOTH'];

export default function FamilyPack() {
  const [packs, setPacks] = useState<CorporatePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<CorporatePackType>('MIXED');
  const [size, setSize] = useState(3);
  useEffect(() => {
    let active = true;
    setLoading(true);
    siteAPI.familyPacks({ pack_type: type, size })
      .then((items) => { if (active) setPacks(items); })
      .catch(() => { if (active) setPacks([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type, size]);

  return (
    <main className="compact-content-page bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 pt-4"><CompactPageHeader title="Family packs" subtitle="Choose a matching style and pick the numbers your family loves." icon={Users2} /></div>

      <section className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="public-control-panel rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_190px] md:items-end">
              <div><div className="text-[10px] font-black uppercase tracking-[.12em] text-primary">Matching style</div><div className="mt-2 flex flex-wrap gap-1.5">{types.map((value) => <button key={value} onClick={() => setType(value)} className={`public-segment min-h-9 rounded-lg border px-3 text-[11px] font-black transition ${type === value ? 'is-active border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background text-foreground hover:border-primary hover:text-primary'}`}>{PACK_TYPE_LABELS[value]}</button>)}</div></div>
              <label className="block"><span className="text-[10px] font-black uppercase tracking-[.12em] text-primary">Pack of</span><ThemedSelect value={size} onChange={(event) => setSize(Number(event.target.value))} className="public-control mt-2 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs font-black text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" aria-label="Pack of">{Array.from({ length: 9 }, (_, index) => index + 2).map((value) => <option key={value} value={value}>{value} numbers</option>)}</ThemedSelect></label>
            </div>
          </div>

          <div className="mt-4">
            {loading ? <Loader variant="packs" /> : packs.length ? <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{packs.map((pack) => <FamilyPackCard key={pack.pack_id} pack={pack} />)}</div> : <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center"><Building2 className="mx-auto h-10 w-10 text-primary" /><h2 className="mt-3 text-xl font-black">No matching live Family Pack right now</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Try another matching style or a smaller pack size. Results are generated only from numbers that are currently available.</p><Link to="/contact?subject=family-pack" className="btn-gold mt-5">Ask for assistance <ArrowRight className="h-4 w-4" /></Link></div>}
          </div>
        </div>
      </section>
    </main>
  );
}
