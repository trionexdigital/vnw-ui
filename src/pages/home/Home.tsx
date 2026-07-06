import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Star, ArrowRight, Sparkles, Gem, Users, ShieldCheck, Lock,
  Truck, Headphones, Clock, ShoppingCart, Phone, Hash, Wand2, RotateCcw,
  Shield, Trophy, BadgeCheck, PackageCheck, Crown, Zap, UserRoundCheck,
} from 'lucide-react';
import { numbersAPI, categoriesAPI, testimonialsAPI } from '@/core/api/vnwAPI';
import NumberCard, { NumberItem } from '@/shared/components/NumberCard';
import { Loader } from '@/shared/components/ui-bits';
import { getRecentlyViewed } from '@/core/lib/recentlyViewed';
import { FamilyPackCard } from '@/shared/components/PremiumShowcaseCards';

const POPULAR = ['9999', '7777', '7878', '0001', '1234'];
const FLOATING_NUMBERS = ['7777', '9999', '786', '5555', '108', '1111'];

function Countdown() {
  const [t, setT] = useState({ d: 2, h: 14, m: 35, s: 48 });
  useEffect(() => {
    const target = Date.now() + (2 * 24 * 60 * 60 + 14 * 60 * 60 + 35 * 60 + 48) * 1000;
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  const Box = ({ v, l }: { v: number; l: string }) => (
    <div className="min-w-[72px] rounded-2xl border border-white/70 bg-white/66 px-3 py-2 text-center shadow-sm">
      <div className="text-2xl font-black text-[#1d1830]">{String(v).padStart(2, '0')}</div>
      <div className="text-[10px] text-muted-foreground">{l}</div>
    </div>
  );
  return <div className="flex flex-wrap items-center justify-center gap-2"><Box v={t.d} l="Days" /><Box v={t.h} l="Hours" /><Box v={t.m} l="Minutes" /><Box v={t.s} l="Seconds" /></div>;
}

function HeroVisual() {
  return (
    <div className="relative mx-auto min-h-[360px] w-full max-w-[560px]">
      <div className="absolute inset-x-12 bottom-2 h-24 rounded-[50%] bg-gradient-to-r from-[#e4d7ff] via-[#ffc7f3] to-[#fff3c7] blur-xl" />
      <div className="animate-float-soft absolute left-1/2 top-12 grid h-72 w-72 -translate-x-1/2 place-items-center rounded-[2rem] border border-white/80 bg-white/35 shadow-[0_30px_90px_-46px_rgba(93,44,159,.65)] backdrop-blur-md sm:h-80 sm:w-80">
        <div className="absolute inset-3 rounded-[1.6rem] border border-white/70 bg-gradient-to-br from-white/30 via-[#f0ddff]/30 to-[#ffc6ef]/25" />
        <Crown className="absolute top-10 h-20 w-20 text-[#d9a31b] drop-shadow" />
        <div className="relative mt-16 text-center">
          <div className="text-7xl font-black tracking-tight text-gold sm:text-8xl">VNW</div>
          <div className="mt-1 text-lg font-black uppercase tracking-[.16em] text-[#b57908]">VIP Number World</div>
        </div>
      </div>
      {FLOATING_NUMBERS.map((n, i) => {
        const pos = [
          'left-4 top-16', 'right-2 top-20', 'left-5 top-44', 'right-0 top-48', 'left-8 bottom-8', 'right-8 bottom-11',
        ][i];
        return (
          <span key={n} className={`absolute ${pos} animate-float-soft-delayed rounded-2xl border border-white/75 bg-white/45 px-5 py-3 text-xl font-black text-[#b57908] shadow-lg backdrop-blur`}>
            {n}
          </span>
        );
      })}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [numbers, setNumbers] = useState<NumberItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [trending, setTrending] = useState<NumberItem[]>([]);
  const [recent] = useState<NumberItem[]>(() => getRecentlyViewed() as NumberItem[]);
  const [searchMode, setSearchMode] = useState<'number' | 'pattern' | 'numerology' | 'ai'>('number');

  useEffect(() => {
    (async () => {
      try {
        const [cats, tlist, trend] = await Promise.all([
          categoriesAPI.list(), testimonialsAPI.list(), numbersAPI.list({ sort: 'popular', limit: 4 }),
        ]);
        setCategories(cats || []); setTestimonials(tlist || []); setTrending(trend.items || []);
      } catch { /* ignore */ }
    })();
  }, []);
  useEffect(() => {
    setLoading(true);
    numbersAPI.list({ is_featured: 1, limit: 8, sort: 'newest' })
      .then((d) => setNumbers(d.items || [])).catch(() => setNumbers([])).finally(() => setLoading(false));
  }, []);

  const go = (term: string) => navigate(`/shop?q=${encodeURIComponent(term.trim())}`);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return navigate('/shop');
    navigate(searchMode === 'ai' ? `/shop?ai=${encodeURIComponent(term)}` : `/shop?q=${encodeURIComponent(term)}`);
  };

  return (
    <div>
      <section className="relative mx-auto max-w-7xl px-4 pb-8 pt-4">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.05fr]">
          <div className="animate-rise-in">
            <div className="chip mb-5 text-[#7c2cff]"><Sparkles className="h-4 w-4 text-[#d9a31b]" /> India's Most Trusted VIP Number Marketplace <ArrowRight className="h-3.5 w-3.5" /></div>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-[#11101d] sm:text-6xl">
              Your Identity.<br />
              <span className="text-gradient-vnw">Your Signature Number.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-muted-foreground">Discover exclusive VIP & premium mobile numbers that speak success and status.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [Shield, 'Genuine Numbers'],
                [Lock, '100% Secure'],
                [Truck, 'Pan India Delivery'],
                [RotateCcw, 'Easy Returns'],
              ].map(([Icon, label]: any) => (
                <span key={label} className="glass-panel flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold text-[#1d1830]/74"><Icon className="h-4 w-4 text-[#7c2cff]" /> {label}</span>
              ))}
            </div>
          </div>
          <HeroVisual />
        </div>

        <form onSubmit={submit} className="glass-panel relative z-10 mx-auto -mt-2 max-w-5xl rounded-[1.7rem] p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <div className="text-sm font-black text-[#1d1830]">Find your VIP number</div>
              <div className="text-xs text-muted-foreground">Search by digits, pattern, numerology, or natural language</div>
            </div>
            <span className="hidden rounded-2xl bg-white/60 px-3 py-1.5 text-xs font-black text-[#7c2cff] sm:inline-flex"><Sparkles className="mr-1 h-3.5 w-3.5" /> AI Ready</span>
          </div>
          <div className="mb-3 grid grid-cols-4 gap-1.5 rounded-[1.25rem] border border-white/70 bg-white/35 p-1 text-[10px] font-black text-muted-foreground sm:text-sm">
            {[
              ['number', Phone, 'Number'],
              ['pattern', Wand2, 'Pattern'],
              ['numerology', Hash, 'Numerology'],
              ['ai', Sparkles, 'AI Search'],
            ].map(([key, Icon, label]: any) => (
                <button key={key} type="button" onClick={() => setSearchMode(key)} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-2xl px-1.5 py-2 text-center leading-tight transition sm:px-3 ${searchMode === key ? 'bg-white text-[#1d1830] shadow-sm' : 'hover:bg-white/50'}`}>
                  <Icon className="h-4 w-4 shrink-0 text-[#7c2cff]" /> <span className="truncate">{label}</span>
                </button>
            ))}
          </div>
          <div className="grid gap-2 rounded-[1.35rem] border border-white/70 bg-white/45 p-2 md:grid-cols-[170px_1fr_180px]">
            <select className="h-12 rounded-2xl border border-[#d8cae9] bg-white/70 px-4 text-sm font-bold text-[#1d1830] outline-none">
              <option>All Operators</option>
              <option>Jio</option>
              <option>Airtel</option>
              <option>Vi</option>
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c2cff]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchMode === 'ai' ? 'Try: lucky business number under 50000' : 'Enter your dream number...'} className="h-12 w-full rounded-2xl border border-[#d8cae9] bg-white/70 pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#d923c6]" />
            </div>
            <button className="btn-royal h-12 !rounded-2xl">Search</button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-black text-[#1d1830]">Popular</span>
            {POPULAR.map((p) => <button type="button" key={p} onClick={() => go(p)} className="rounded-2xl border border-white/70 bg-white/55 px-4 py-1.5 font-bold text-[#1d1830]/72 shadow-sm">{p}</button>)}
            <button type="button" onClick={() => { setSearchMode('ai'); setQ('premium number under 50000'); }} className="rounded-2xl border border-[#d923c6]/20 bg-[#fce7ff]/70 px-4 py-1.5 font-black text-[#7c2cff]">premium under 50000</button>
          </div>
        </form>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-3">
        {[
          { icon: Gem, t: 'Premium Numbers', d: 'Most desirable & elite numbers', to: '/shop?category=premium', c: 'from-[#efe1ff] to-[#fff4ff]' },
          { icon: Sparkles, t: 'Numerology Numbers', d: 'Numbers that align with your destiny', to: '/numerology', c: 'from-[#fff3dd] to-[#fff7ef]' },
          { icon: Users, t: 'Family Packs', d: 'Perfect number sets for your family', to: '/shop?category=family', c: 'from-[#e4fff7] to-[#f5fffb]' },
        ].map((c) => (
          <Link key={c.t} to={c.to} className={`vnw-card vnw-card-hover flex items-center gap-5 bg-gradient-to-br ${c.c} p-6`}>
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-white/70 text-[#7c2cff] shadow-lg"><c.icon className="h-10 w-10" /></span>
            <span>
              <b className="block text-lg text-[#1d1830]">{c.t}</b>
              <span className="text-sm text-muted-foreground">{c.d}</span>
              <span className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-2 text-xs font-black text-[#7c2cff]">Explore <ArrowRight className="h-3.5 w-3.5" /></span>
            </span>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="glass-panel flex flex-col items-center justify-between gap-5 rounded-[1.5rem] p-5 lg:flex-row">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#fff1bd] text-[#e29000]"><Zap className="h-10 w-10" /></span>
            <div><b className="text-[#1d1830]">Limited Time Offer</b><p className="text-sm text-muted-foreground">Grab exclusive VIP numbers at special prices!</p></div>
          </div>
          <Countdown />
          <Link to="/shop?badge=HOT_DEAL" className="btn-royal">View All Deals <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-[#1d1830]">Featured <span className="text-gradient-vnw">VIP</span> Numbers</h2>
          <Link to="/shop" className="text-sm font-black text-[#1d1830]">View All Numbers <ArrowRight className="inline h-4 w-4" /></Link>
        </div>
        {loading ? <Loader /> : numbers.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No numbers found yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{numbers.map((n) => <NumberCard key={n.number_id} item={n} />)}</div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5">
        <div className="glass-panel grid gap-4 rounded-[1.5rem] p-5 md:grid-cols-4">
          {[
            [ShieldCheck, '100% Authentic', 'Genuine & verified numbers'],
            [Lock, 'Secure Payments', 'Encrypted & safe transactions'],
            [Truck, 'Pan India Delivery', 'Fast & reliable shipping'],
            [Headphones, '24/7 Support', 'We are here to help you'],
          ].map(([Icon, t, d]: any) => (
            <div key={t} className="flex items-center gap-3 border-white/70 md:border-r md:last:border-r-0">
              <Icon className="h-9 w-9 text-[#7c2cff]" />
              <div><b className="text-[#1d1830]">{t}</b><p className="text-xs text-muted-foreground">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_.9fr]">
        <FamilyPackCard numbers={['9193 111 111', '9193 222 222', '9193 333 333', '9193 444 444']} perNumber={75000} total={300000} />
        <div className="glass-panel rounded-[2rem] p-6">
          <h2 className="text-2xl font-black text-[#1d1830]">Why Choose VNW?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Because you deserve the best.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              [PackageCheck, 'Wide Range', 'Largest collection of VIP numbers'],
              [BadgeCheck, 'Best Prices', 'Unbeatable deals & offers'],
              [Search, 'Easy Search', 'AI powered search experience'],
              [Trophy, 'Trusted by Thousands', 'Happy customers across India'],
            ].map(([Icon, t, d]: any) => (
              <div key={t} className="rounded-2xl bg-white/55 p-4">
                <Icon className="mb-3 h-7 w-7 text-[#d923c6]" />
                <b className="text-[#1d1830]">{t}</b>
                <p className="text-xs text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {trending.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-black text-[#1d1830]"><Crown className="h-5 w-5 text-[#d9a31b]" /> Trending Now</h2>
            <Link to="/shop?sort=popular" className="text-sm font-black text-[#7c2cff]">See more</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{trending.map((n) => <NumberCard key={n.number_id} item={n} />)}</div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <h2 className="mb-5 text-xl font-black text-[#1d1830]">Recently Viewed</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recent.slice(0, 4).map((n) => <NumberCard key={n.number_id} item={n} />)}</div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section id="testimonials" className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="mb-6 text-center text-2xl font-black text-[#1d1830]">Loved by <span className="text-gradient-vnw">VIP Customers</span></h2>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <div key={t.testimonial_id} className="vnw-card p-5">
                <div className="mb-3 flex gap-0.5 text-[#d9a31b]">{Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="h-4 w-4" fill="currentColor" />)}</div>
                <p className="text-sm text-muted-foreground">"{t.content}"</p>
                <div className="mt-4 flex items-center gap-3"><UserRoundCheck className="h-8 w-8 text-[#7c2cff]" /><b>{t.name}</b></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
