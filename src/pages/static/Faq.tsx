import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleHelp } from 'lucide-react';
import { siteAPI, type FaqItem } from '@/core/api/vnwAPI';
import { FaqAccordion } from '@/pages/home/components/MarketplaceSections';
import { Loader } from '@/shared/components/ui-bits';

export default function Faq() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { siteAPI.faqs().then(setItems).catch(() => setItems([])).finally(() => setLoading(false)); }, []);
  const groups = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [items]);
  return (
    <main className="bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><CircleHelp className="h-7 w-7" /></span><h1 className="mt-4 text-4xl font-black">Frequently asked questions</h1><p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Clear guidance for choosing, buying, porting, and activating your VIP number.</p></div>
        {loading ? <div className="mt-10"><Loader /></div> : <div className="mt-10 space-y-10">{groups.map((group) => <section key={group}><h2 className="mb-4 text-xl font-black text-foreground">{group}</h2><FaqAccordion items={items.filter((item) => item.category === group)} /></section>)}</div>}
        <div className="mt-12 rounded-3xl border border-primary/30 bg-card p-7 text-center"><h2 className="text-2xl font-black">Still need help?</h2><p className="mt-2 text-sm text-muted-foreground">Send your question to our support team.</p><Link to="/contact" className="btn-gold mt-5">Contact us <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </main>
  );
}
