import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, BarChart2, Crown, Star, IndianRupee, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { cartAPI, wishlistAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { useToast } from '@/shared/hooks/use-toast';
import { formatINR, BADGE_META, digitTotal, numerologySum } from '@/core/lib/format';
import { cn } from '@/core/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';

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
  const reduceMotion = useReducedMotion();
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
    <motion.article
      className="premium-card vnw-card-hover group relative flex min-h-[184px] flex-col overflow-hidden rounded-xl p-3"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-75" />
      <div className="relative mb-2 flex items-center justify-between gap-2">
        {badge.label
          ? <span className={cn('chip !rounded-md !px-2 !py-0.5 text-[9px]', badge.className)}><Star className="h-2.5 w-2.5" fill="currentColor" />{badge.label}</span>
          : <span className="chip !rounded-md !px-2 !py-0.5 text-[9px]"><Star className="h-2.5 w-2.5" fill="currentColor" />VIP</span>}
        <button onClick={toggleWish} aria-label="wishlist"
          className={cn('grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-amber-600 hover:text-amber-800', wished && 'border-rose-200 bg-rose-50 text-rose-600')}>
          <Heart className="h-4 w-4" fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>

      <button onClick={() => navigate(`/number/${item.number_id}`)} className="relative text-center">
        <div className="mb-1 flex items-center justify-center gap-1.5 truncate text-[10px] font-bold text-stone-500">
          <Crown className="h-3.5 w-3.5 shrink-0 text-amber-700" /> <span className="truncate">{item.title_label || item.category_name || 'Signature VIP Number'}</span>
        </div>
        <div className="truncate text-[1.32rem] font-black tabular-nums tracking-wide text-stone-950 sm:text-[1.42rem]">
          {formatNumberParts(item.display_number)}
        </div>
      </button>

      <div className="relative my-2 flex items-center justify-center gap-1.5 border-y border-stone-100 py-1.5 text-emerald-700">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold">Verified &amp; available on any operator</span>
      </div>

      <div className="relative grid grid-cols-4 gap-1.5">
        <div className="rounded-lg border border-stone-200 bg-stone-50 py-1.5 text-center">
          <div className="text-[9px] text-stone-500">Total</div>
          <div className="text-sm font-black text-stone-900">{total}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 py-1.5 text-center">
          <div className="text-[9px] text-stone-500">Sum</div>
          <div className="text-sm font-black text-stone-900">{sum}</div>
        </div>
        <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] text-stone-500 line-through">{formatINR(item.mrp)}</span>
            {discountPct > 0 && <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black text-amber-800">{discountPct}%</span>}
          </div>
          <div className="flex items-center justify-end gap-0.5 text-base font-black leading-none text-stone-950"><IndianRupee className="h-3.5 w-3.5" />{Number(item.offer_price).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="relative mt-2 grid grid-cols-[1fr_auto_auto] gap-1.5">
        <button className="h-9 rounded-lg bg-stone-900 px-3 text-xs font-black text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-50" onClick={buyNow} disabled={!!sold}>{sold ? 'Sold' : 'Buy Now'}</button>
        <button aria-label="add to cart" className="grid h-9 w-10 place-items-center rounded-lg border border-stone-300 bg-white text-stone-800 transition hover:border-amber-700 hover:text-amber-800 disabled:opacity-50" onClick={addToCart} disabled={busy || !!sold}>
          <ShoppingCart className="h-4 w-4" />
        </button>
        <button onClick={() => toggleCompare(item.number_id)}
          aria-label="compare"
          className={cn('grid h-9 w-10 place-items-center rounded-lg border border-stone-300 bg-white transition hover:border-amber-700', inCompare ? 'border-amber-600 bg-amber-50 text-amber-800' : 'text-stone-800')}>
          <BarChart2 className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  );
}
