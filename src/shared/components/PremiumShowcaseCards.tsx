import { Crown, Heart, ShoppingCart, Star, Zap, CheckCircle2 } from 'lucide-react';
import { formatINR, digitTotal } from '@/core/lib/format';

export function PremiumNumberShowcaseCard({
  number,
  title = 'Signature VIP Number',
  pattern = 'Hexa Pattern',
  mrp,
  offerPrice,
  discount,
  sum,
  onBuy,
  onCart,
  onWish,
  sold,
}: {
  number: string;
  title?: string;
  pattern?: string;
  mrp: number | string;
  offerPrice: number | string;
  discount?: number | string;
  sum?: number | string;
  onBuy?: () => void;
  onCart?: () => void;
  onWish?: () => void;
  sold?: boolean;
}) {
  return (
    <section className="premium-card relative overflow-hidden rounded-[2rem] p-5 text-center sm:p-8">
      <div className="mb-5 flex items-start justify-between">
        <span className="chip chip-emerald !rounded-xl px-4 py-2 text-sm"><Star className="h-4 w-4" fill="currentColor" /> Best Seller</span>
        <button onClick={onWish} className="grid h-12 w-12 place-items-center rounded-2xl border border-[#d9a31b]/40 bg-white/70 text-[#063d2a] shadow-sm">
          <Heart className="h-6 w-6" />
        </button>
      </div>
      <div className="flex items-center justify-center gap-2 text-lg font-semibold text-[#063d2a]"><Crown className="h-6 w-6 text-[#d9a31b]" /> {title}</div>
      <h1 className="mt-4 text-5xl font-black tracking-[.08em] text-[#063d2a] drop-shadow-[0_2px_0_rgba(217,163,27,.5)] sm:text-7xl">{number}</h1>
      <div className="mx-auto my-6 flex max-w-3xl items-center justify-center gap-4 text-[#b57908]">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d9a31b] to-[#d9a31b]/20" />
        <span className="text-2xl font-semibold">{pattern}</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#d9a31b] to-[#d9a31b]/20" />
      </div>
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#d9a31b]/25 bg-white/58 p-4">
          <div className="text-sm text-[#33233c]/70">Total</div>
          <div className="text-3xl font-black text-[#063d2a]">{digitTotal(number)}</div>
        </div>
        <div className="rounded-2xl border border-[#d9a31b]/25 bg-white/58 p-4">
          <div className="text-sm text-[#33233c]/70">Sum</div>
          <div className="text-3xl font-black text-[#063d2a]">{sum ?? '-'}</div>
        </div>
      </div>
      <div className="mx-auto mt-6 grid max-w-4xl gap-4 rounded-2xl border border-[#d9a31b]/25 bg-white/58 p-4 sm:grid-cols-[1fr_1.3fr_1fr]">
        <div><div className="text-sm font-semibold">MRP Price</div><div className="text-2xl text-black line-through">{formatINR(mrp)}</div></div>
        <div><div className="text-sm font-semibold">Offer Price</div><div className="text-4xl font-black text-[#063d2a]">{formatINR(offerPrice)}</div></div>
        <div className="flex items-center justify-center"><span className="rounded-2xl border border-[#d9a31b]/28 bg-[#fff7d1] px-5 py-3 text-xl font-black text-[#b57908]">* {discount || 0}% OFF</span></div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button onClick={onBuy} disabled={sold} className="emerald-gradient-bg rounded-2xl px-6 py-4 text-2xl font-black text-white shadow-xl shadow-emerald-900/20 disabled:opacity-50"><Zap className="mr-2 inline h-7 w-7 text-[#fff7bf]" />{sold ? 'Sold' : 'Buy Now'}</button>
        <button onClick={onCart} disabled={sold} className="rounded-2xl border-2 border-[#063d2a] bg-white/65 px-6 py-4 text-2xl font-black text-[#063d2a] disabled:opacity-50"><ShoppingCart className="mr-2 inline h-7 w-7" />Add to Cart</button>
      </div>
    </section>
  );
}

export function FamilyPackCard({
  title = 'Gold Family Pack',
  numbers,
  perNumber,
  total,
}: {
  title?: string;
  numbers: string[];
  perNumber: number | string;
  total: number | string;
}) {
  return (
    <section className="premium-card relative overflow-hidden rounded-[1.5rem] p-4 text-center sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="chip chip-emerald !rounded-lg !px-3 !py-1 text-xs"><Star className="h-3.5 w-3.5" fill="currentColor" /> Best Seller</span>
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#d9a31b]/40 bg-white/70 text-[#063d2a]"><Heart className="h-5 w-5" /></span>
      </div>
      <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#063d2a]"><Crown className="h-4 w-4 text-[#d9a31b]" /> Signature Family Pack</div>
      <h2 className="mt-1 text-2xl font-black text-[#063d2a] sm:text-3xl">{title}</h2>
      <p className="mb-3 text-sm font-semibold text-[#b57908]">Perfect Matching Set</p>
      <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-[#d9a31b]/24 bg-white/44">
        {numbers.map((n) => (
          <div key={n} className="grid grid-cols-[1fr_auto] items-center border-b border-[#d9a31b]/18 px-3 py-2 text-left last:border-0">
            <span className="text-lg font-black tracking-[.12em] text-[#063d2a] sm:text-xl">{n}</span>
            <span className="text-lg font-black text-[#063d2a] sm:text-xl">{formatINR(perNumber)}</span>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-3 grid max-w-2xl grid-cols-3 gap-2">
        <div className="rounded-xl border border-[#d9a31b]/20 bg-white/58 p-2"><div className="text-[10px] text-muted-foreground">Qty</div><b className="text-sm text-[#063d2a]">{numbers.length} Numbers</b></div>
        <div className="rounded-xl border border-[#d9a31b]/20 bg-white/58 p-2"><div className="text-[10px] text-muted-foreground">Value</div><b className="text-sm text-[#063d2a]">Premium</b></div>
        <div className="rounded-xl border border-[#d9a31b]/20 bg-white/58 p-2"><div className="text-[10px] text-muted-foreground">Per No.</div><b className="text-sm text-[#063d2a]">{formatINR(perNumber)}</b></div>
      </div>
      <div className="mt-3 rounded-xl border border-[#d9a31b]/20 bg-white/58 p-3">
        <div className="text-xs font-bold text-muted-foreground">Total Price</div>
        <div className="text-2xl font-black text-[#063d2a]">{formatINR(total)}</div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button className="emerald-gradient-bg rounded-xl px-4 py-2.5 text-sm font-black text-white"><CheckCircle2 className="mr-1.5 inline h-5 w-5 text-[#fff7bf]" />Select Pack</button>
        <button className="rounded-xl border border-[#063d2a] bg-white/65 px-4 py-2.5 text-sm font-black text-[#063d2a]"><ShoppingCart className="mr-1.5 inline h-5 w-5" />Add to Cart</button>
      </div>
    </section>
  );
}
