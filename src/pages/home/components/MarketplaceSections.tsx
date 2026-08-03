import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BadgeIndianRupee, Building2, ChevronDown, CircleHelp, CreditCard, Headphones,
  Network, PhoneCall, RefreshCw, ShieldCheck, ShoppingCart, Smartphone, Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  cartAPI, siteAPI, type CorporatePack, type CorporatePackType, type FaqItem, type OperatorFacet, type TrustedClient,
} from '@/core/api/vnwAPI';
import { formatINR } from '@/core/lib/format';
import { localService } from '@/core/services/local';
import { useStore } from '@/shared/store/useStore';
import { useToast } from '@/shared/hooks/use-toast';
import { SectionHeader } from './HomeSections';

export const PACK_TYPE_LABELS: Record<CorporatePack['pack_type'], string> = {
  SERIES: 'Numbers in Series',
  MIXED: 'All Mixed',
  SIMILAR_START: 'Similar Start',
  SIMILAR_END: 'Similar End',
  SIMILAR_BOTH: 'Similar Both Ends',
};

const PACK_TYPES: CorporatePackType[] = ['MIXED', 'SIMILAR_START', 'SIMILAR_END', 'SIMILAR_BOTH'];

const reveal = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };

export function CorporatePackCard({ pack }: { pack: CorporatePack }) {
  const navigate = useNavigate();
  const { refreshCounts } = useStore();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const [busy, setBusy] = useState(false);

  const addPack = async () => {
    if (!localService.getToken()) { navigate('/login'); return; }
    if (!pack.is_available) return;
    setBusy(true);
    try {
      await cartAPI.addMany(pack.numbers.map((number) => number.number_id));
      await refreshCounts();
      toast({ title: 'Complete pack added', description: `${pack.size} VIP numbers are ready in your cart.` });
      navigate('/cart');
    } catch (error: any) {
      toast({ title: 'Pack could not be added', description: error.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  return (
    <motion.article
      variants={reveal}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      className="group relative overflow-hidden rounded-2xl border border-primary/25 bg-card p-4 shadow-sm transition-shadow hover:shadow-xl"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-primary">
            <Building2 className="h-3.5 w-3.5" /> {PACK_TYPE_LABELS[pack.pack_type]}
          </div>
          <h3 className="mt-3 text-lg font-black text-foreground">{pack.title}</h3>
        </div>
        <span className="grid h-11 min-w-11 place-items-center rounded-xl border border-border bg-muted text-sm font-black text-primary">{pack.size}</span>
      </div>
      {pack.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{pack.description}</p>}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {pack.numbers.map((number) => (
          <Link key={number.number_id} to={`/number/${number.number_id}`} className="rounded-xl border border-border bg-background px-3 py-2 transition hover:border-primary">
            <div className="font-black tracking-wide text-foreground">{number.display_number}</div>
            <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>{number.operator || 'Any operator'}</span><span>{formatINR(number.offer_price)}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div><div className="text-[10px] font-bold uppercase text-muted-foreground">Complete pack</div><div className="text-lg font-black text-foreground">{formatINR(pack.total_price)}</div></div>
        <button onClick={addPack} disabled={!pack.is_available || busy} className="btn-gold min-h-10 px-4 text-xs disabled:cursor-not-allowed disabled:opacity-50">
          <ShoppingCart className="h-4 w-4" /> {busy ? 'Adding…' : pack.is_available ? 'Add complete pack' : 'Unavailable'}
        </button>
      </div>
    </motion.article>
  );
}

export function CorporatePackPreview() {
  const [packs, setPacks] = useState<CorporatePack[]>([]);
  const [type, setType] = useState<CorporatePackType>('MIXED');
  const [size, setSize] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    siteAPI.corporatePacks({ pack_type: type, size, limit: 3 })
      .then((items) => { if (active) setPacks(items); })
      .catch(() => { if (active) setPacks([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type, size]);

  const visible = packs.filter((pack) => pack.is_available).slice(0, 3);
  return (
    <section className="bg-card px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Corporate Elite Pack" title="One identity across your whole team" description="Live groups generated automatically from currently available VIP numbers." action={<Link to="/corporate-elite-pack" className="btn-gold-outline">Explore Elite Packs <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="mb-5 rounded-2xl border border-border bg-background p-3 shadow-sm sm:p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_190px] md:items-end">
            <div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-wider text-primary">Matching style</div><div className="mt-2 flex gap-2 overflow-x-auto pb-1">{PACK_TYPES.map((value) => <button key={value} type="button" onClick={() => setType(value)} aria-pressed={type === value} className={`min-h-9 shrink-0 rounded-xl border px-3 text-xs font-black transition ${type === value ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card text-foreground hover:border-primary hover:text-primary'}`}>{PACK_TYPE_LABELS[value]}</button>)}</div></div>
            <label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-primary">Numbers in pack</span><select value={size} onChange={(event) => setSize(Number(event.target.value))} className="mt-2 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-black text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" aria-label="Homepage pack size">{Array.from({ length: 9 }, (_, index) => index + 2).map((value) => <option key={value} value={value}>{value} numbers</option>)}</select></label>
          </div>
        </div>
        {loading ? (
          <div className="grid min-h-44 place-items-center rounded-2xl border border-primary/20 bg-background"><div className="flex items-center gap-2 text-sm font-bold text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin text-primary" /> Finding live matching packs…</div></div>
        ) : visible.length ? (
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .15 }} transition={{ staggerChildren: .08 }} className="grid gap-4 lg:grid-cols-3">
            {visible.map((pack) => <CorporatePackCard key={pack.pack_id} pack={pack} />)}
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-primary/20 bg-background p-6 sm:flex sm:items-center sm:justify-between">
            <div><h3 className="text-lg font-black text-foreground">Build a coordinated number collection</h3><p className="mt-1 text-sm text-muted-foreground">Tell us your preferred pack size and matching style.</p></div>
            <Link to="/corporate-elite-pack" className="btn-gold mt-4 sm:mt-0">Configure a pack <ArrowRight className="h-4 w-4" /></Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function OperatorSection({ operators }: { operators: OperatorFacet[] }) {
  const tones = ['bg-primary/10', 'bg-accent', 'bg-muted', 'bg-secondary'];
  if (!operators.length) return null;
  return (
    <section className="bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Shop by network" title="Choose your preferred operator" description="Explore currently available VIP numbers by network operator." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {operators.map((item, index) => (
            <motion.div key={item.operator} whileHover={{ y: -5, rotate: index % 2 ? .4 : -.4 }}>
              <Link to={`/shop?operator=${encodeURIComponent(item.operator)}`} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary hover:shadow-lg">
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${tones[index % tones.length]} text-primary`}><Smartphone className="h-7 w-7" /></span>
                <span className="min-w-0"><span className="block text-lg font-black text-foreground">{item.operator}</span><span className="text-sm text-muted-foreground">{item.count} available</span></span>
                <ArrowRight className="ml-auto h-4 w-4 text-primary transition group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const JOURNEY_STEPS = [
  { icon: CreditCard, title: 'Secure Payment', text: 'Review the listing and complete checkout through the existing protected payment flow.' },
  { icon: ShieldCheck, title: 'UPC Delivery', text: 'Receive order guidance and the information needed to begin your number transfer.' },
  { icon: RefreshCw, title: 'MNP Initiation', text: 'Follow the supported mobile number portability steps with your chosen operator.' },
  { icon: PhoneCall, title: 'SIM Activation', text: 'Complete operator verification and activate your premium number on the new SIM.' },
  { icon: BadgeIndianRupee, title: '100% Money Back', text: 'Guaranteed full refund if you encounter any issues with UPC delivery or number activation.' },
];

export function JourneyPreview() {
  return (
    <section className="overflow-hidden bg-card px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Premium number journey" title="From checkout to confident activation" description="A clear five-stage path, including our 100% money-back assurance." action={<Link to="/how-it-works" className="btn-gold-outline">See the full journey <ArrowRight className="h-4 w-4" /></Link>} />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} transition={{ staggerChildren: .1 }} className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="absolute left-[10%] right-[10%] top-7 hidden h-px bg-primary/30 lg:block" aria-hidden="true" />
          {JOURNEY_STEPS.map((step, index) => (
            <motion.article variants={reveal} key={step.title} className="relative rounded-2xl border border-border bg-background p-4 text-center shadow-sm transition hover:border-primary">
              <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-md"><step.icon className="h-6 w-6" /></span>
              <div className="mt-3 text-[10px] font-black uppercase tracking-[.15em] text-primary">Step {index + 1}</div>
              <h3 className="mt-1 font-black text-foreground">{step.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.text}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function TrustedClientsSection({ clients }: { clients: TrustedClient[] }) {
  const visible = clients.filter((client) => client.has_logo);
  if (!visible.length) return null;
  return (
    <section className="bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <div className="text-xs font-black uppercase tracking-[.16em] text-primary">Trusted by industry leaders</div>
        <h2 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">Brands that value a memorable identity</h2>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {visible.map((client) => {
            const content = <img src={siteAPI.trustedClientLogoUrl(client.client_id)} alt={client.alt_text || `${client.name} logo`} className="max-h-12 max-w-[130px] object-contain grayscale transition duration-300 group-hover:grayscale-0 group-hover:scale-105" />;
            return client.website_url
              ? <a key={client.client_id} href={client.website_url} target="_blank" rel="noreferrer" className="group grid min-h-24 place-items-center rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary">{content}</a>
              : <div key={client.client_id} className="group grid min-h-24 place-items-center rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary">{content}</div>;
          })}
        </div>
      </div>
    </section>
  );
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(items[0]?.faq_id || null);
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const expanded = open === item.faq_id;
        return (
          <div key={item.faq_id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-primary/50">
            <button type="button" aria-expanded={expanded} aria-controls={`faq-${item.faq_id}`} onClick={() => setOpen(expanded ? null : item.faq_id)} className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
              <CircleHelp className="h-5 w-5 shrink-0 text-primary" /><span className="flex-1 text-sm font-black text-foreground sm:text-base">{item.question}</span><ChevronDown className={`h-4 w-4 text-primary transition ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && <div id={`faq-${item.faq_id}`} className="border-t border-border px-4 py-4 pl-12 text-sm leading-6 text-muted-foreground">{item.answer}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function FaqPreview({ faqs }: { faqs: FaqItem[] }) {
  if (!faqs.length) return null;
  return (
    <section className="bg-card px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.75fr_1.25fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary"><Sparkles className="h-3.5 w-3.5" /> Help centre</div>
          <h2 className="mt-3 text-3xl font-black text-foreground">Questions before choosing your number?</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Clear answers about purchase, payment, porting, categories, and numerology.</p>
          <Link to="/faq" className="btn-gold-outline mt-5">View all FAQs <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <FaqAccordion items={faqs.slice(0, 6)} />
      </div>
    </section>
  );
}

export function MarketplaceCta() {
  return (
    <section className="bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-primary/30 bg-card px-6 py-10 text-center shadow-xl sm:px-10">
        <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
        <Network className="mx-auto h-9 w-9 text-primary" />
        <h2 className="mt-3 text-3xl font-black text-foreground">Ready to make your number memorable?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Browse the curated premium collection or speak with our support team for help choosing the right identity.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/premium-numbers" className="btn-gold">Browse Premium Numbers <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/contact" className="btn-gold-outline"><Headphones className="h-4 w-4" /> Talk to an expert</Link>
        </div>
      </div>
    </section>
  );
}
