import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  Calendar,
  Calculator,
  CheckCircle2,
  Hexagon,
  Layers3,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  User2,
} from 'lucide-react';
import { numbersAPI, siteAPI } from '@/core/api/vnwAPI';
import NumberCard, { type NumberItem } from '@/shared/components/NumberCard';
import { Loader } from '@/shared/components/ui-bits';
import { useToast } from '@/shared/hooks/use-toast';
import {
  MotionGrid,
  MotionGridItem,
  MotionReveal,
  MotionSection,
  motion,
  useReducedMotion,
} from '@/shared/motion/MotionPrimitives';

const reduce = (value: number): number => {
  let next = value;
  while (next > 9) next = String(next).split('').reduce((sum, digit) => sum + Number(digit), 0);
  return next;
};

const reduceStr = (value: string): number => reduce(value.replace(/\D/g, '').split('').reduce((sum, digit) => sum + Number(digit), 0));
const PYTHA: Record<string, number> = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9, s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8 };
const nameNumber = (name: string): number => reduce(name.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((sum, character) => sum + (PYTHA[character] || 0), 0));

const INFO: Record<number, { planet: string; traits: string; lucky: number[] }> = {
  1: { planet: 'Sun', traits: 'Leadership, independence, ambition & authority.', lucky: [1, 9] },
  2: { planet: 'Moon', traits: 'Sensitivity, intuition, diplomacy & harmony.', lucky: [2, 7] },
  3: { planet: 'Jupiter', traits: 'Creativity, wisdom, optimism & growth.', lucky: [3, 9] },
  4: { planet: 'Rahu', traits: 'Discipline, stability, hard work & structure.', lucky: [4, 8] },
  5: { planet: 'Mercury', traits: 'Communication, freedom, intellect & versatility.', lucky: [5, 6] },
  6: { planet: 'Venus', traits: 'Love, luxury, beauty & relationships.', lucky: [6, 9] },
  7: { planet: 'Ketu', traits: 'Spirituality, research, wisdom & mystery.', lucky: [7, 2] },
  8: { planet: 'Saturn', traits: 'Power, wealth, ambition & karma.', lucky: [8, 4] },
  9: { planet: 'Mars', traits: 'Energy, courage, passion & determination.', lucky: [9, 3] },
};

const SERVICES = [
  { icon: Smartphone, title: 'Current Number Analysis', description: 'Understand the digit total and numerological root of the mobile number you already use.' },
  { icon: BriefcaseBusiness, title: 'New Number Guidance', description: 'Use your personal results to explore available numbers with a matching numerology sum.' },
  { icon: Layers3, title: 'Combined Consultation', description: 'Discuss both your current number and preferences for a new premium identity.' },
] as const;

const inputClass = 'h-12 w-full rounded-xl border border-card-border bg-secondary/65 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15';

function NumberResult({ number, label }: { number: number; label: string }) {
  return (
    <div className="rounded-2xl border border-primary/25 bg-background/75 p-4 text-center shadow-sm">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-amber-500/50 bg-[radial-gradient(circle_at_35%_25%,#fff8d9,#e9bd55)] text-2xl font-black text-emerald-950 shadow-[0_10px_24px_-14px_rgba(112,73,7,.7)]">
        {number}
      </div>
      <div className="mt-3 text-[10px] font-black uppercase tracking-[.12em] text-muted-foreground">{label}</div>
    </div>
  );
}

function Metric({ label, value, helper }: { label: string; value: number; helper: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="rounded-2xl border border-primary/20 bg-background/75 p-3 text-center shadow-sm">
      <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{label}</div>
      <motion.div
        key={value}
        initial={reduceMotion ? false : { opacity: 0, y: 5, scale: .94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : .24 }}
        className="mt-1 text-2xl font-black text-primary"
      >
        {value}
      </motion.div>
      <div className="mt-1 hidden text-[10px] text-muted-foreground sm:block">{helper}</div>
    </div>
  );
}

export default function Numerology() {
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const [dob, setDob] = useState('');
  const [name, setName] = useState('');
  const [result, setResult] = useState<{ mulank: number; bhagyank: number; nameNo: number } | null>(null);
  const [matches, setMatches] = useState<NumberItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSum, setActiveSum] = useState<number | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [service, setService] = useState('Current Number Analysis');
  const [enquiry, setEnquiry] = useState({ name: '', phone: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const digits = mobileNumber.replace(/\D/g, '').slice(0, 10);
  const digitTotal = digits.split('').reduce((sum, digit) => sum + Number(digit), 0);
  const midTotal = String(digitTotal).split('').reduce((sum, digit) => sum + Number(digit), 0);
  const finalRoot = digits.length === 10 ? reduce(midTotal) : 0;

  const chooseService = (next: string) => {
    setService(next);
    window.setTimeout(() => document.getElementById('numerology-enquiry')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }), 0);
  };

  const submitEnquiry = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      const response = await siteAPI.enquiry({
        ...enquiry,
        type: 'NUMEROLOGY',
        subject: service,
        message: `${service}: ${enquiry.message || 'Please contact me about this numerology service.'}`,
      });
      if (response?.status !== 1) throw new Error(response?.info || 'Unable to send enquiry.');
      toast({ title: 'Enquiry received', description: response.info });
      setEnquiry({ name: '', phone: '', email: '', message: '' });
    } catch (error: any) {
      toast({ title: 'Could not send enquiry', description: error.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const loadMatches = (sum: number) => {
    if (!sum) return;
    setActiveSum(sum);
    setLoading(true);
    numbersAPI.list({ numerology: sum, limit: 8, status: 'AVAILABLE' })
      .then((data) => setMatches(data.items || []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  };

  const calculateProfile = (event: React.FormEvent) => {
    event.preventDefault();
    if (!dob && !name) return;
    const day = dob ? Number(dob.split('-')[2]) : 0;
    const nextResult = {
      mulank: day ? reduce(day) : 0,
      bhagyank: dob ? reduceStr(dob) : 0,
      nameNo: name ? nameNumber(name) : 0,
    };
    setResult(nextResult);
    loadMatches(nextResult.mulank || nextResult.bhagyank || nextResult.nameNo);
  };

  const profileSums = result
    ? [result.mulank, result.bhagyank, result.nameNo].filter((value, index, values) => value && values.indexOf(value) === index)
    : [];

  return (
    <main className="overflow-hidden bg-background text-foreground">
      <MotionSection className="relative border-b border-border bg-card px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,hsl(var(--primary)/.15),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-9 lg:grid-cols-[1.15fr_.85fr]">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-primary">
              <Hexagon className="h-4 w-4" /> Free numerology tools
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              Find the numbers that <span className="text-gold">feel like you</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base lg:mx-0">
              Explore your mobile number root, personal numerology, and available VIP numbers aligned with your preferred sum.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-bold text-muted-foreground lg:justify-start">
              {['Instant calculation', 'Available VIP matches', 'Optional expert guidance'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {item}
                </span>
              ))}
            </div>
          </div>

          <MotionReveal delay={.08} className="mx-auto w-full max-w-md">
            <div className="vnw-card relative overflow-hidden p-5 sm:p-6">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative flex items-center justify-between gap-3">
                <div><div className="text-xs font-black uppercase tracking-[.14em] text-primary">The nine roots</div><div className="mt-1 text-sm text-muted-foreground">Every result reduces to a single digit.</div></div>
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <MotionGrid className="relative mt-5 grid grid-cols-3 gap-2.5">
                {Array.from({ length: 9 }, (_, index) => index + 1).map((number) => (
                  <MotionGridItem key={number}>
                    <button type="button" onClick={() => loadMatches(number)} className="vnw-interactive grid aspect-square w-full place-items-center rounded-2xl border border-primary/20 bg-background/80 text-xl font-black text-primary shadow-sm" aria-label={`Browse numerology sum ${number}`}>
                      {number}
                    </button>
                  </MotionGridItem>
                ))}
              </MotionGrid>
            </div>
          </MotionReveal>
        </div>
      </MotionSection>

      <MotionSection className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[.18em] text-primary">Choose your path</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Numerology guidance for every stage</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Start with a free calculation or ask our team for personal assistance.</p>
          </div>
          <MotionGrid className="mt-7 grid gap-4 md:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, description }) => (
              <MotionGridItem key={title}>
                <article className="vnw-card vnw-interactive group flex h-full flex-col p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-lg font-black">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
                  <button type="button" onClick={() => chooseService(title)} className="mt-4 inline-flex min-h-11 items-center gap-2 self-start rounded-xl px-1 text-sm font-black text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    Request guidance <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </article>
              </MotionGridItem>
            ))}
          </MotionGrid>
        </div>
      </MotionSection>

      <MotionSection className="border-y border-border bg-card px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 text-center">
            <p className="text-xs font-black uppercase tracking-[.18em] text-primary">Free calculators</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Two simple ways to explore your numerology</h2>
          </div>

          <div className="grid items-stretch gap-5 lg:grid-cols-2">
            <MotionReveal className="h-full">
              <section className="vnw-card flex h-full flex-col p-5 sm:p-6" aria-labelledby="mobile-root-title">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Smartphone className="h-5 w-5" /></span>
                  <div><div className="text-[10px] font-black uppercase tracking-[.14em] text-primary">10-digit calculator</div><h3 id="mobile-root-title" className="mt-1 text-xl font-black">Reveal your mobile number root</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">The result updates automatically after all ten digits are entered.</p></div>
                </div>
                <label htmlFor="numerology-mobile" className="mt-6 block text-xs font-black uppercase tracking-wide text-muted-foreground">Mobile number</label>
                <input id="numerology-mobile" inputMode="numeric" autoComplete="tel" value={digits} onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" className={`${inputClass} mt-2 text-center text-lg font-black tracking-[.18em]`} />
                <span className="mt-1 block text-right text-xs text-muted-foreground">{digits.length}/10 digits</span>
                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                  <Metric label="Digit Total" value={digits.length === 10 ? digitTotal : 0} helper="Sum of all digits" />
                  <Metric label="Mid Sum" value={digits.length === 10 ? midTotal : 0} helper="Secondary total" />
                  <Metric label="Final Root" value={finalRoot} helper="Numerology root" />
                </div>
                <div className="mt-auto pt-5">
                  <button type="button" onClick={() => loadMatches(finalRoot)} disabled={!finalRoot} className="btn-gold w-full disabled:cursor-not-allowed disabled:opacity-45">
                    <Star className="h-4 w-4" /> {finalRoot ? `Show Sum ${finalRoot} Numbers` : 'Enter 10 digits to continue'}
                  </button>
                </div>
              </section>
            </MotionReveal>

            <MotionReveal delay={.06} className="h-full">
              <form onSubmit={calculateProfile} className="vnw-card flex h-full flex-col p-5 sm:p-6" aria-labelledby="profile-calculator-title">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Calculator className="h-5 w-5" /></span>
                  <div><div className="text-[10px] font-black uppercase tracking-[.14em] text-primary">Personal profile</div><h3 id="profile-calculator-title" className="mt-1 text-xl font-black">Calculate your personal numbers</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Use your birth date, name, or both to calculate your core numbers.</p></div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label htmlFor="numerology-dob" className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                    <span className="mb-2 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> Date of birth</span>
                    <input id="numerology-dob" type="date" className={inputClass} value={dob} onChange={(event) => setDob(event.target.value)} />
                  </label>
                  <label htmlFor="numerology-name" className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                    <span className="mb-2 flex items-center gap-1.5"><User2 className="h-3.5 w-3.5 text-primary" /> Full name (optional)</span>
                    <input id="numerology-name" className={inputClass} placeholder="e.g. Rahul Sharma" value={name} onChange={(event) => setName(event.target.value)} />
                  </label>
                </div>
                <div className="mt-5 grid gap-2 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs text-muted-foreground sm:grid-cols-3">
                  {['Mulank / Driver', 'Bhagyank / Destiny', 'Name Number'].map((item) => <span key={item} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" /> {item}</span>)}
                </div>
                <button disabled={!dob && !name.trim()} className="btn-gold mt-auto w-full disabled:cursor-not-allowed disabled:opacity-45"><Sparkles className="h-4 w-4" /> Calculate My Numbers</button>
              </form>
            </MotionReveal>
          </div>
        </div>
      </MotionSection>

      {result && (
        <MotionSection className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="vnw-card mx-auto max-w-4xl overflow-hidden p-5 sm:p-7">
            <div className="text-center"><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Your profile</p><h2 className="mt-2 text-2xl font-black">Your core numerology numbers</h2></div>
            <MotionGrid className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
              {result.mulank ? <MotionGridItem><NumberResult number={result.mulank} label="Mulank (Driver)" /></MotionGridItem> : null}
              {result.bhagyank ? <MotionGridItem><NumberResult number={result.bhagyank} label="Bhagyank (Destiny)" /></MotionGridItem> : null}
              {result.nameNo ? <MotionGridItem><NumberResult number={result.nameNo} label="Name Number" /></MotionGridItem> : null}
            </MotionGrid>
            {result.mulank ? (
              <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-sm">Ruling planet: <strong>{INFO[result.mulank]?.planet}</strong></p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{INFO[result.mulank]?.traits}</p>
                <p className="mt-2 text-sm">Lucky digits: <span className="font-black text-primary">{INFO[result.mulank]?.lucky.join(', ')}</span></p>
              </div>
            ) : null}
            <div className="mt-6 text-center">
              <div className="text-sm font-bold">Explore VIP numbers matching your profile</div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {profileSums.map((sum) => (
                  <button key={sum} type="button" onClick={() => loadMatches(sum)} aria-pressed={activeSum === sum} className={`min-h-10 rounded-full border px-4 text-sm font-black transition-colors ${activeSum === sum ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-primary/30 bg-background text-primary hover:bg-primary/10'}`}>
                    Sum {sum}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </MotionSection>
      )}

      {activeSum !== null && (
        <MotionSection className="border-y border-border bg-card px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
              <div><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Available matches</p><h2 className="mt-2 text-2xl font-black">VIP numbers aligned with Sum {activeSum}</h2><p className="mt-2 text-sm text-muted-foreground">Live available numbers with the numerology root you selected.</p></div>
              <Link to={`/shop?numerology=${activeSum}`} className="btn-gold-outline self-center sm:self-auto">View all Sum {activeSum} <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-7">
              {loading ? <Loader variant="cards" /> : matches.length === 0 ? (
                <div className="rounded-3xl border border-primary/20 bg-background px-6 py-12 text-center"><Sparkles className="mx-auto h-8 w-8 text-primary" /><h3 className="mt-3 text-lg font-black">No Sum {activeSum} numbers available right now</h3><p className="mt-2 text-sm text-muted-foreground">Explore the full marketplace or try another numerology root.</p><Link to="/shop" className="btn-gold mt-5">Browse all numbers <ArrowRight className="h-4 w-4" /></Link></div>
              ) : (
                <div className="number-card-grid">{matches.map((number) => <NumberCard key={number.number_id} item={number} />)}</div>
              )}
            </div>
          </div>
        </MotionSection>
      )}

      <MotionSection id="numerology-enquiry" className="scroll-mt-28 px-4 py-10 sm:px-6 lg:px-8">
        <div className="vnw-card mx-auto grid max-w-5xl overflow-hidden lg:grid-cols-[.8fr_1.2fr]">
          <div className="border-b border-border bg-primary/5 p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Send className="h-5 w-5" /></span>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[.14em] text-primary">Selected service</p>
            <h2 className="mt-1 text-2xl font-black">{service}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Share a contact method and our team will follow up. This is an enquiry, not a paid automated report.</p>
            <div className="mt-5 flex items-start gap-2 rounded-2xl border border-primary/15 bg-background/70 p-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Numerology is informational and does not guarantee financial, career, health, or relationship outcomes.</div>
          </div>

          <form onSubmit={submitEnquiry} className="p-5 sm:p-7">
            <h3 className="text-xl font-black">Request a consultation</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your contact details are used only to respond to this request.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label htmlFor="enquiry-name" className="text-xs font-black uppercase tracking-wide text-muted-foreground">Your name<input id="enquiry-name" required placeholder="Enter your name" className={`${inputClass} mt-2 normal-case tracking-normal`} value={enquiry.name} onChange={(event) => setEnquiry({ ...enquiry, name: event.target.value })} /></label>
              <label htmlFor="enquiry-phone" className="text-xs font-black uppercase tracking-wide text-muted-foreground">Phone<input id="enquiry-phone" inputMode="tel" autoComplete="tel" placeholder="Phone number" className={`${inputClass} mt-2 normal-case tracking-normal`} value={enquiry.phone} onChange={(event) => setEnquiry({ ...enquiry, phone: event.target.value })} /></label>
              <label htmlFor="enquiry-email" className="text-xs font-black uppercase tracking-wide text-muted-foreground sm:col-span-2">Email<input id="enquiry-email" type="email" autoComplete="email" placeholder="you@example.com" className={`${inputClass} mt-2 normal-case tracking-normal`} value={enquiry.email} onChange={(event) => setEnquiry({ ...enquiry, email: event.target.value })} /></label>
              <label htmlFor="enquiry-message" className="text-xs font-black uppercase tracking-wide text-muted-foreground sm:col-span-2">How can we help?<textarea id="enquiry-message" rows={4} placeholder="Tell us what you would like help with" className={`${inputClass} mt-2 h-auto min-h-28 py-3 normal-case tracking-normal`} value={enquiry.message} onChange={(event) => setEnquiry({ ...enquiry, message: event.target.value })} /></label>
            </div>
            <button disabled={sending || (!enquiry.phone && !enquiry.email)} className="btn-gold mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /> {sending ? 'Sending…' : 'Send enquiry'}</button>
          </form>
        </div>
      </MotionSection>
    </main>
  );
}
