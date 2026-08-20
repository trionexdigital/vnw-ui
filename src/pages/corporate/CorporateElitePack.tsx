import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Check, Users2 } from 'lucide-react';
import { siteAPI, type CorporatePack, type CorporatePackType } from '@/core/api/vnwAPI';
import { PACK_TYPE_LABELS } from '@/pages/home/components/MarketplaceSections';
import FamilyPackCard, { useFamilyPackWishlist } from '@/shared/components/FamilyPackCard';
import { Loader } from '@/shared/components/ui-bits';

const types: CorporatePackType[] = ['MIXED', 'SIMILAR_START', 'SIMILAR_END', 'SIMILAR_BOTH'];

export default function FamilyPack() {
  const [packs, setPacks] = useState<CorporatePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<CorporatePackType>('MIXED');
  const [size, setSize] = useState(3);
  const { wishedIds, updateWishlist } = useFamilyPackWishlist();
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
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-card px-4 py-14 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,hsl(var(--primary)/.16),transparent_42%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div><span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary"><Building2 className="h-4 w-4" /> Family Pack</span><h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-5xl">A coordinated VIP identity for every family member</h1><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Select a matching style and pack size. Live available numbers are grouped automatically, with current pricing and availability checked before they reach your cart.</p></div>
          <div className="rounded-3xl border border-primary/25 bg-background p-6 shadow-xl"><Users2 className="h-9 w-9 text-primary" /><h2 className="mt-3 text-xl font-black">Designed for families</h2><div className="mt-4 space-y-3 text-sm text-muted-foreground">{['Live inventory and pricing', 'Choose individual or multiple numbers', 'Secure cart and checkout', 'Save favourites to your wishlist'].map((label) => <div key={label} className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary"><Check className="h-3.5 w-3.5" /></span>{label}</div>)}</div></div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="grid gap-5 md:grid-cols-[1fr_220px] md:items-end">
              <div><div className="text-xs font-black uppercase tracking-wide text-primary">Matching style</div><div className="mt-3 flex flex-wrap gap-2">{types.map((value) => <button key={value} onClick={() => setType(value)} className={`min-h-10 rounded-xl border px-3 text-xs font-black transition ${type === value ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background text-foreground hover:border-primary hover:text-primary'}`}>{PACK_TYPE_LABELS[value]}</button>)}</div></div>
              <label className="block"><span className="text-xs font-black uppercase tracking-wide text-primary">Numbers in pack</span><select value={size} onChange={(event) => setSize(Number(event.target.value))} className="mt-3 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-black text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" aria-label="Numbers in pack">{Array.from({ length: 9 }, (_, index) => index + 2).map((value) => <option key={value} value={value}>{value} numbers</option>)}</select></label>
            </div>
          </div>

          <div className="mt-7">
            {loading ? <Loader variant="packs" /> : packs.length ? <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{packs.map((pack) => <FamilyPackCard key={pack.pack_id} pack={pack} wishedIds={wishedIds} onWishlistChange={updateWishlist} />)}</div> : <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center"><Building2 className="mx-auto h-10 w-10 text-primary" /><h2 className="mt-3 text-xl font-black">No matching live Family Pack right now</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Try another matching style or a smaller pack size. Results are generated only from numbers that are currently available.</p><Link to="/contact?subject=family-pack" className="btn-gold mt-5">Ask for assistance <ArrowRight className="h-4 w-4" /></Link></div>}
          </div>
        </div>
      </section>
    </main>
  );
}
