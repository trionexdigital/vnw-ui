import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Zap, BarChart2, Crown, Star, IndianRupee } from 'lucide-react';
import { useState } from 'react';
import { cartAPI, wishlistAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { useToast } from '@/shared/hooks/use-toast';
import { formatINR, BADGE_META, digitTotal, numerologySum } from '@/core/lib/format';
import { cn } from '@/core/lib/utils';

export interface NumberItem {
  number_id: number;
  display_number: string;
  title_label?: string;
  badge?: string;
  mrp: number;
  offer_price: number;
  discount_pct?: number;
  numerology_sum?: number;
  operator?: string;
  category_name?: string;
  stock?: number;
  status?: string;
}

function formatNumberParts(number: string) {
  const clean = String(number || '').replace(/\s+/g, '');
  if (clean.length === 10) return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  return String(number || '').trim();
}

export default function NumberCard({ item, onWishlistChange }: { item: NumberItem; onWishlistChange?: () => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCounts, compare, toggleCompare } = useStore();
  const [wished, setWished] = useState(false);
  const [busy, setBusy] = useState(false);
  const badge = BADGE_META[item.badge || 'NONE'];
  const inCompare = compare.includes(item.number_id);
  const total = digitTotal(item.display_number);
  const sum = item.numerology_sum ?? numerologySum(item.display_number);
  const sold = item.status && item.status !== 'AVAILABLE';
  const discountPct = item.discount_pct ?? (Number(item.mrp) > 0
    ? Math.round(((Number(item.mrp) - Number(item.offer_price)) / Number(item.mrp)) * 100) : 0);

  const requireAuth = (): boolean => {
    if (!localService.getToken()) { navigate('/login'); return false; }
    return true;
  };

  const addToCart = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      await cartAPI.add(item.number_id);
      await refreshCounts();
      toast({ title: 'Added to cart', description: item.display_number });
    } catch (e: any) { toast({ title: 'Could not add', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const buyNow = () => { if (!requireAuth()) return; navigate(`/checkout?number_id=${item.number_id}`); };

  const toggleWish = async () => {
    if (!requireAuth()) return;
    try {
      if (wished) { await wishlistAPI.remove(item.number_id); setWished(false); }
      else { await wishlistAPI.add(item.number_id); setWished(true); }
      await refreshCounts(); onWishlistChange?.();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div className="premium-card vnw-card-hover group relative flex min-h-[196px] flex-col overflow-hidden rounded-[1.35rem] p-3 animate-rise-in">
      <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-[#fff2a8]/60 blur-2xl transition-transform group-hover:scale-125" />
      <div className="relative mb-2 flex items-center justify-between gap-2">
        {badge.label
          ? <span className={cn('chip chip-emerald !rounded-lg !px-2 !py-0.5 text-[9px]', badge.className)}><Star className="h-2.5 w-2.5" fill="currentColor" />{badge.label}</span>
          : <span className="chip chip-emerald !rounded-lg !px-2 !py-0.5 text-[9px]"><Star className="h-2.5 w-2.5" fill="currentColor" />VIP</span>}
        <button onClick={toggleWish} aria-label="wishlist"
          className={cn('grid h-8 w-8 place-items-center rounded-xl border border-[#d9a31b]/35 bg-white/70 text-[#063d2a] shadow-sm transition hover:scale-105', wished && 'text-rose-500')}>
          <Heart className="h-4 w-4" fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>

      <button onClick={() => navigate(`/number/${item.number_id}`)} className="relative text-center">
        <div className="mb-0.5 flex items-center justify-center gap-1.5 truncate text-[11px] font-bold text-[#063d2a]/80">
          <Crown className="h-3.5 w-3.5 shrink-0 text-[#d9a31b]" /> <span className="truncate">{item.title_label || item.category_name || 'Signature VIP Number'}</span>
        </div>
        <div className="truncate text-[1.36rem] font-black tracking-wide text-[#063d2a] drop-shadow-[0_1px_0_rgba(217,163,27,.45)] sm:text-[1.48rem]">
          {formatNumberParts(item.display_number)}
        </div>
      </button>

      <div className="relative my-2 flex items-center justify-center gap-2 text-[#b57908]">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d9a31b]/55 to-[#d9a31b]/25" />
        <span className="max-w-[7rem] truncate text-[10px] font-black uppercase tracking-wide">{item.operator || item.category_name || 'Premium'}</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#d9a31b]/55 to-[#d9a31b]/25" />
      </div>

      <div className="relative grid grid-cols-4 gap-1.5">
        <div className="rounded-xl border border-[#d9a31b]/20 bg-white/56 py-1.5 text-center">
          <div className="text-[9px] text-[#33233c]/60">Total</div>
          <div className="text-sm font-black text-[#063d2a]">{total}</div>
        </div>
        <div className="rounded-xl border border-[#d9a31b]/20 bg-white/56 py-1.5 text-center">
          <div className="text-[9px] text-[#33233c]/60">Sum</div>
          <div className="text-sm font-black text-[#063d2a]">{sum}</div>
        </div>
        <div className="col-span-2 rounded-xl border border-[#d9a31b]/20 bg-white/56 px-2 py-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] text-[#33233c]/60 line-through">{formatINR(item.mrp)}</span>
            {discountPct > 0 && <span className="rounded-full bg-[#fff7d1] px-1.5 py-0.5 text-[9px] font-black text-[#b57908]">{discountPct}%</span>}
          </div>
          <div className="flex items-center justify-end gap-0.5 text-base font-black leading-none text-[#063d2a]"><IndianRupee className="h-3.5 w-3.5" />{Number(item.offer_price).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="relative mt-2 grid grid-cols-[1fr_auto_auto] gap-1.5">
        <button className="emerald-gradient-bg h-9 rounded-xl px-3 text-xs font-black text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 disabled:opacity-50" onClick={buyNow} disabled={!!sold}>{sold ? 'Sold' : 'Buy Now'}</button>
        <button aria-label="add to cart" className="grid h-9 w-10 place-items-center rounded-xl border border-[#063d2a]/55 bg-white/70 text-[#063d2a] transition hover:-translate-y-0.5 disabled:opacity-50" onClick={addToCart} disabled={busy || !!sold}>
          <ShoppingCart className="h-4 w-4" />
        </button>
        <button onClick={() => toggleCompare(item.number_id)}
          aria-label="compare"
          className={cn('grid h-9 w-10 place-items-center rounded-xl border border-[#d9a31b]/35 bg-white/70 transition hover:-translate-y-0.5', inCompare ? 'text-[#d9a31b]' : 'text-[#063d2a]')}>
          <BarChart2 className="h-4 w-4" />
        </button>
      </div>

      <div className="relative mt-1.5 flex items-center justify-center gap-1 text-[10px] font-bold text-[#b57908]">
        <Zap className="h-3 w-3" /> {sold ? 'Unavailable' : `Only ${item.stock ?? 1} left`}
      </div>
    </div>
  );
}
