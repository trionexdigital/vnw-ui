import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, User2, ArrowRight, Hexagon } from 'lucide-react';
import { numbersAPI } from '@/core/api/vnwAPI';
import NumberCard, { NumberItem } from '@/shared/components/NumberCard';
import { Loader } from '@/shared/components/ui-bits';

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
  7: { planet: 'Ketu', traits: 'Spirituality, research, wisdom & mystery.', lucky: [7, 2], color: 'from-indigo-400 to-purple-600' },
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
  const [dob, setDob] = useState('');
  const [name, setName] = useState('');
  const [result, setResult] = useState<{ mulank: number; bhagyank: number; nameNo: number } | null>(null);
  const [matches, setMatches] = useState<NumberItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSum, setActiveSum] = useState<number | null>(null);

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
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{matches.map((n) => <NumberCard key={n.number_id} item={n} />)}</div>
                <div className="mt-6 text-center"><Link to={`/shop?numerology=${activeSum}`} className="btn-royal">View All Sum {activeSum} Numbers <ArrowRight className="h-4 w-4" /></Link></div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
