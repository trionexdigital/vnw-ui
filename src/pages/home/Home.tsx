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
import { Logo as BrandLogo } from '@/shared/components/Logo';

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
    <div className="relative mx-auto flex min-h-[420px] w-full max-w-[610px] items-center justify-center overflow-visible py-8 lg:min-h-[520px]">
      <div className="absolute inset-x-8 bottom-10 h-24 rounded-full bg-gradient-to-r from-[#ffd66f]/45 via-[#f2b7ff]/55 to-[#b9fff0]/40 blur-2xl" />
      <div className="absolute left-4 top-8 hidden w-32 rounded-2xl border border-white/75 bg-white/72 p-3 shadow-[0_20px_60px_-38px_rgba(29,24,48,.62)] backdrop-blur md:block">
        <div className="text-[10px] font-black uppercase text-muted-foreground">Best Seller</div>
        <div className="mt-1 text-2xl font-black text-[#b57908]">9999</div>
      </div>
      <div className="absolute bottom-14 right-0 hidden w-36 rounded-2xl border border-white/75 bg-white/75 p-3 shadow-[0_20px_60px_-38px_rgba(29,24,48,.62)] backdrop-blur sm:block">
        <div className="text-[10px] font-black uppercase text-muted-foreground">Lucky Pick</div>
        <div className="mt-1 text-2xl font-black text-[#7c2cff]">786</div>
      </div>

      <div className="relative w-full max-w-[430px] rounded-[2rem] border border-white/80 bg-white/52 p-4 shadow-[0_38px_110px_-58px_rgba(75,35,146,.86)] backdrop-blur-2xl sm:p-5">
        <div className="rounded-[1.45rem] border border-white/75 bg-gradient-to-br from-white/72 via-[#fff6fd]/54 to-[#fff2c8]/38 p-6 text-center">
          <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-[#f2d67b]/50 bg-[#130f20] shadow-[0_24px_60px_-38px_rgba(0,0,0,.9)] sm:h-32 sm:w-32">
            <BrandLogo className="h-24 w-24 rounded-full object-contain sm:h-28 sm:w-28" />
          </div>
          <Crown className="mx-auto mt-5 h-12 w-12 text-[#d9a31b]" />
          <div className="mt-4 text-6xl font-black text-gold sm:text-[5.5rem]">VNW</div>
          <div className="mt-2 text-sm font-black uppercase text-[#9a6808] sm:text-base">VIP Number World</div>
          <div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-2">
            {['1111', '5555', '7777'].map((n) => (
              <span key={n} className="rounded-2xl border border-white/80 bg-white/72 px-3 py-2 text-sm font-black text-[#1d1830] shadow-sm">{n}</span>
            ))}
          </div>
        </div>
      </div>

      {FLOATING_NUMBERS.map((n, i) => {
        const pos = [
          'left-0 top-28', 'right-6 top-16', 'left-8 bottom-28', 'right-10 top-56', 'left-20 top-4', 'right-24 bottom-7',
        ][i];
        return (
          <span key={n} className={`absolute ${pos} animate-float-soft-delayed rounded-2xl border border-white/80 bg-white/68 px-4 py-2 text-base font-black text-[#b57908] shadow-lg backdrop-blur sm:px-5 sm:py-3 sm:text-xl`}>
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
      <section className="relative overflow-hidden px-4 pb-10 pt-6 sm:pt-8 lg:pb-14">
        <div className="absolute left-[-12rem] top-16 h-72 w-72 rounded-full bg-[#ffd66f]/20 blur-3xl" />
        <div className="absolute right-[-10rem] top-0 h-80 w-80 rounded-full bg-[#b99cff]/22 blur-3xl" />
        <div className="mx-auto grid min-h-[calc(100vh-13rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1fr_.92fr]">
          <div className="animate-rise-in text-center lg:text-left">
            <div className="chip mb-5 text-[#6c27ee]">
              <Sparkles className="h-4 w-4 text-[#d9a31b]" />
              India's Most Trusted VIP Number Marketplace
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[1.03] text-[#11101d] sm:text-6xl lg:mx-0 lg:text-7xl">
              Own a number people remember.
              <span className="mt-2 block text-gradient-vnw">Carry it like a signature.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-muted-foreground sm:text-lg lg:mx-0">
              Discover verified VIP, fancy, lucky, and premium mobile numbers for business identity, personal status, and memorable first impressions.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link to="/shop" className="btn-royal min-h-12 px-6">Explore VIP Numbers <ArrowRight className="h-4 w-4" /></Link>
              <a href="#vip-search" className="btn-gold-outline min-h-12 px-6">Search by Digits <Search className="h-4 w-4" /></a>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [Shield, 'Verified numbers'],
                [Lock, 'Secure payment'],
                [Truck, 'Pan India delivery'],
                [RotateCcw, 'Easy returns'],
              ].map(([Icon, label]: any) => (
                <span key={label} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/75 bg-white/58 px-4 py-3 text-sm font-black text-[#1d1830]/78 shadow-sm backdrop-blur lg:justify-start">
                  <Icon className="h-4 w-4 shrink-0 text-[#7c2cff]" /> {label}
                </span>
              ))}
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section id="vip-search" className="relative mx-auto max-w-7xl px-4 pb-8">
        <form onSubmit={submit} className="glass-panel mx-auto grid gap-5 rounded-[1.6rem] p-4 sm:p-5 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
          <div className="rounded-[1.15rem] border border-white/75 bg-white/48 p-4 sm:p-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/72 px-3 py-1 text-xs font-black uppercase text-[#7c2cff]">
              <Sparkles className="h-3.5 w-3.5 text-[#d9a31b]" /> Smart Search
            </span>
            <h2 className="mt-4 text-2xl font-black leading-tight text-[#1d1830] sm:text-3xl">Find your perfect VIP number</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Search by exact digits, repeating patterns, numerology values, or describe what you want in plain words.</p>
          </div>

          <div className="min-w-0">
            <div className="mb-3 grid grid-cols-2 gap-2 rounded-[1.15rem] border border-white/70 bg-white/36 p-1 text-xs font-black text-muted-foreground sm:grid-cols-4 sm:text-sm">
              {[
                ['number', Phone, 'Number'],
                ['pattern', Wand2, 'Pattern'],
                ['numerology', Hash, 'Numerology'],
                ['ai', Sparkles, 'AI Search'],
              ].map(([key, Icon, label]: any) => (
                <button key={key} type="button" onClick={() => setSearchMode(key)} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-2 py-2 text-center leading-tight transition sm:px-3 ${searchMode === key ? 'bg-white text-[#1d1830] shadow-sm' : 'hover:bg-white/55'}`}>
                  <Icon className="h-4 w-4 shrink-0 text-[#7c2cff]" /> <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-3 rounded-[1.25rem] border border-white/70 bg-white/50 p-3 md:grid-cols-[170px_1fr_150px] lg:grid-cols-[180px_1fr_160px]">
              <select aria-label="Operator" className="h-12 rounded-2xl border border-[#d8cae9] bg-white/78 px-4 text-sm font-bold text-[#1d1830] outline-none">
                <option>All Operators</option>
                <option>Jio</option>
                <option>Airtel</option>
                <option>Vi</option>
              </select>
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c2cff]" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchMode === 'ai' ? 'Try: lucky business number under 50000' : 'Enter your dream number...'} className="h-12 w-full rounded-2xl border border-[#d8cae9] bg-white/78 pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#d923c6]" />
              </div>
              <button className="btn-royal h-12 !rounded-2xl">Search</button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-black text-[#1d1830]">Popular</span>
              {POPULAR.map((p) => <button type="button" key={p} onClick={() => go(p)} className="rounded-2xl border border-white/75 bg-white/62 px-4 py-2 font-bold text-[#1d1830]/75 shadow-sm transition hover:-translate-y-0.5">{p}</button>)}
              <button type="button" onClick={() => { setSearchMode('ai'); setQ('premium number under 50000'); }} className="rounded-2xl border border-[#d923c6]/20 bg-[#fce7ff]/75 px-4 py-2 font-black text-[#7c2cff] shadow-sm">premium under 50000</button>
            </div>
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
        {loading ? <Loader variant="cards" /> : numbers.length === 0 ? (
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
