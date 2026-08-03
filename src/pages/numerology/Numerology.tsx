import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, User2, ArrowRight, Hexagon, Smartphone, BriefcaseBusiness, Layers3, Send, ShieldCheck } from 'lucide-react';
import { numbersAPI, siteAPI } from '@/core/api/vnwAPI';
import NumberCard, { NumberItem } from '@/shared/components/NumberCard';
import { Loader } from '@/shared/components/ui-bits';
import { useToast } from '@/shared/hooks/use-toast';

const reduce = (n: number): number => { while (n > 9) n = String(n).split('').reduce((s, d) => s + Number(d), 0); return n; };
const reduceStr = (s: string): number => reduce(s.replace(/\D/g, '').split('').reduce((a, d) => a + Number(d), 0));
const PYTHA: Record<string, number> = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9, s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8 };
const nameNumber = (name: string): number => reduce(name.toLowerCase().replace(/[^a-z]/g, '').split('').reduce((a, c) => a + (PYTHA[c] || 0), 0));

const INFO: Record<number, { planet: string; traits: string; lucky: number[]; color: string }> = {
  1: { planet: 'Sun', traits: 'Leadership, independence, ambition & authority.', lucky: [1, 9], color: 'from-amber-400 to-orange-500' },
  2: { planet: 'Moon', traits: 'Sensitivity, intuition, diplomacy & harmony.', lucky: [2, 7], color: 'from-slate-300 to-slate-500' },
  3: { planet: 'Jupiter', traits: 'Creativity, wisdom, optimism & growth.', lucky: [3, 9], color: 'from-yellow-400 to-amber-600' },
  4: { planet: 'Rahu', traits: 'Discipline, stability, hard work & structure.', lucky: [4, 8], color: 'from-stone-400 to-stone-600' },
  5: { planet: 'Mercury', traits: 'Communication, freedom, intellect & versatility.', lucky: [5, 6], color: 'from-emerald-400 to-green-600' },
  6: { planet: 'Venus', traits: 'Love, luxury, beauty & relationships.', lucky: [6, 9], color: 'from-pink-400 to-rose-500' },
  7: { planet: 'Ketu', traits: 'Spirituality, research, wisdom & mystery.', lucky: [7, 2], color: 'from-amber-400 to-yellow-700' },
  8: { planet: 'Saturn', traits: 'Power, wealth, ambition & karma.', lucky: [8, 4], color: 'from-zinc-500 to-zinc-800' },
  9: { planet: 'Mars', traits: 'Energy, courage, passion & determination.', lucky: [9, 3], color: 'from-red-500 to-rose-700' },
};

function NumCircle({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br ${INFO[n]?.color || 'from-amber-400 to-orange-500'} text-3xl font-extrabold text-white shadow-lg`}>{n}</div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

export default function Numerology() {
  const { toast } = useToast();
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
    window.setTimeout(() => document.getElementById('numerology-enquiry')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };

  const submitEnquiry = async (event: React.FormEvent) => {
    event.preventDefault(); setSending(true);
    try {
      const response = await siteAPI.enquiry({ ...enquiry, type: 'NUMEROLOGY', subject: service, message: `${service}: ${enquiry.message || 'Please contact me about this numerology service.'}` });
      if (response?.status !== 1) throw new Error(response?.info || 'Unable to send enquiry.');
      toast({ title: 'Enquiry received', description: response.info });
      setEnquiry({ name: '', phone: '', email: '', message: '' });
    } catch (error: any) { toast({ title: 'Could not send enquiry', description: error.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  const calc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob && !name) return;
    const day = dob ? Number(dob.split('-')[2]) : 0;
    const mulank = day ? reduce(day) : 0;
    const bhagyank = dob ? reduceStr(dob) : 0;
    const nameNo = name ? nameNumber(name) : 0;
    setResult({ mulank, bhagyank, nameNo });
    loadMatches(mulank || bhagyank || nameNo);
  };

  const loadMatches = (sum: number) => {
    if (!sum) return;
    setActiveSum(sum); setLoading(true);
    numbersAPI.list({ numerology: sum, limit: 8, status: 'AVAILABLE' })
      .then((d) => setMatches(d.items || [])).catch(() => setMatches([])).finally(() => setLoading(false));
  };

  const input = 'w-full rounded-lg border border-card-border bg-secondary/60 px-3 py-2.5 text-sm outline-none focus:border-gold';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl royal-gradient-bg text-gold"><Hexagon className="h-7 w-7" /></span>
        <h1 className="mt-4 text-3xl font-extrabold text-foreground sm:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>Free <span className="text-gold">Numerology</span> Calculator</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Discover your lucky numbers and find VIP numbers that align with your destiny.</p>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          [Smartphone, 'Current Number Analysis', 'Understand the digit total and numerological root of the mobile number you already use.'],
          [BriefcaseBusiness, 'New Number Guidance', 'Use your personal results to explore available numbers with a matching numerology sum.'],
          [Layers3, 'Combined Consultation', 'Discuss both your current number and preferences for a new premium identity.'],
        ].map(([Icon, title, description]: any) => (
          <article key={title} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-lg">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
            <h2 className="mt-4 text-lg font-black text-foreground">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            <button type="button" onClick={() => chooseService(title)} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary">Request guidance <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></button>
          </article>
        ))}
      </section>

      <section className="vnw-card mx-auto mt-8 max-w-3xl p-6">
        <div className="text-center"><div className="text-xs font-black uppercase tracking-[.15em] text-primary">10-digit number calculator</div><h2 className="mt-2 text-2xl font-black text-foreground">Reveal your mobile number root</h2><p className="mt-2 text-sm text-muted-foreground">Calculations appear automatically when all ten digits are entered.</p></div>
        <label className="mt-6 block"><span className="mb-2 block text-xs font-black uppercase text-muted-foreground">Mobile number</span><input inputMode="numeric" autoComplete="tel" value={digits} onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" className={`${input} h-13 text-center text-xl font-black tracking-[.2em]`} /><span className="mt-1 block text-right text-xs text-muted-foreground">{digits.length}/10 digits</span></label>
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
          {[['Digit Total', digits.length === 10 ? digitTotal : 0, 'Sum of all digits'], ['Mid Sum', digits.length === 10 ? midTotal : 0, 'Secondary total'], ['Final Root', finalRoot, 'Numerological root']].map(([label, value, helper]) => <div key={label} className="rounded-xl border border-border bg-background p-3 text-center"><div className="text-[10px] font-black uppercase text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-black text-primary">{value}</div><div className="mt-1 hidden text-[10px] text-muted-foreground sm:block">{helper}</div></div>)}
        </div>
        {finalRoot > 0 && <div className="mt-5 text-center"><button type="button" onClick={() => loadMatches(finalRoot)} className="btn-gold">Show Sum {finalRoot} Numbers <ArrowRight className="h-4 w-4" /></button></div>}
      </section>

      <form onSubmit={calc} className="vnw-card mx-auto mt-8 max-w-2xl p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Date of Birth</label>
            <input type="date" className={input} value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground"><User2 className="h-3.5 w-3.5" /> Full Name (optional)</label>
            <input className={input} placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <button className="btn-gold mt-4 w-full"><Sparkles className="h-4 w-4" /> Calculate My Numbers</button>
      </form>

      {result && (
        <>
          <div className="vnw-card mx-auto mt-6 max-w-2xl p-6">
            <div className="flex flex-wrap items-center justify-around gap-6">
              {result.mulank ? <NumCircle n={result.mulank} label="Mulank (Driver)" /> : null}
              {result.bhagyank ? <NumCircle n={result.bhagyank} label="Bhagyank (Destiny)" /> : null}
              {result.nameNo ? <NumCircle n={result.nameNo} label="Name Number" /> : null}
            </div>
            {result.mulank ? (
              <div className="mt-6 rounded-xl border border-card-border bg-secondary/40 p-4 text-center">
                <p className="text-sm text-foreground">Ruling Planet: <b>{INFO[result.mulank]?.planet}</b></p>
                <p className="mt-1 text-sm text-muted-foreground">{INFO[result.mulank]?.traits}</p>
                <p className="mt-2 text-sm">Lucky digits: <span className="font-bold text-gold-dark">{INFO[result.mulank]?.lucky.join(', ')}</span></p>
              </div>
            ) : null}
          </div>

          {/* match selector */}
          <div className="mt-8 text-center">
            <h2 className="text-xl font-bold text-foreground">VIP Numbers matching your vibration</h2>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {[result.mulank, result.bhagyank, result.nameNo].filter((x, i, a) => x && a.indexOf(x) === i).map((s) => (
                <button key={s} onClick={() => loadMatches(s)} className={`rounded-full px-4 py-1.5 text-sm ${activeSum === s ? 'btn-gold' : 'btn-gold-outline'}`}>Sum {s}</button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {loading ? <Loader variant="cards" /> : matches.length === 0 ? (
              <p className="text-center text-muted-foreground">No matching numbers right now. <Link to="/shop" className="text-gold-dark">Browse all numbers</Link></p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{matches.map((n) => <NumberCard key={n.number_id} item={n} />)}</div>
                <div className="mt-6 text-center"><Link to={`/shop?numerology=${activeSum}`} className="btn-royal">View All Sum {activeSum} Numbers <ArrowRight className="h-4 w-4" /></Link></div>
              </>
            )}
          </div>
        </>
      )}

      <section id="numerology-enquiry" className="vnw-card mx-auto mt-10 max-w-3xl p-6">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Send className="h-5 w-5" /></span><div><h2 className="text-xl font-black text-foreground">Request {service}</h2><p className="mt-1 text-sm text-muted-foreground">Share a contact method and our team will follow up. This is an enquiry, not a paid automated report.</p></div></div>
        <form onSubmit={submitEnquiry} className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3"><input required placeholder="Your name" className={input} value={enquiry.name} onChange={(e) => setEnquiry({ ...enquiry, name: e.target.value })} /><input placeholder="Phone" className={input} value={enquiry.phone} onChange={(e) => setEnquiry({ ...enquiry, phone: e.target.value })} /><input type="email" placeholder="Email" className={input} value={enquiry.email} onChange={(e) => setEnquiry({ ...enquiry, email: e.target.value })} /></div>
          <textarea rows={3} placeholder="What would you like help with?" className={input} value={enquiry.message} onChange={(e) => setEnquiry({ ...enquiry, message: e.target.value })} />
          <button disabled={sending || (!enquiry.phone && !enquiry.email)} className="btn-gold w-full disabled:opacity-50"><Send className="h-4 w-4" /> {sending ? 'Sending…' : 'Send enquiry'}</button>
        </form>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Numerology content is informational and does not guarantee financial, career, health, or relationship outcomes. Contact information is used only to respond to your request.</div>
      </section>
    </div>
  );
}
