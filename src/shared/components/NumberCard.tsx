import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, BarChart2, Crown, Star, IndianRupee, ShieldCheck, Zap } from 'lucide-react';
import { useState } from 'react';
import { cartAPI, wishlistAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { useToast } from '@/shared/hooks/use-toast';
import { formatINR, BADGE_META, digitTotal, numerologySum } from '@/core/lib/format';
import { cn } from '@/core/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';
import type { CategorizedNumber } from '@/core/categories/types';
import { getPrimaryCategory } from '@/core/categories/types';
import HighlightedNumber from '@/shared/components/HighlightedNumber';

export interface NumberItem extends CategorizedNumber {
  number_id: number;
  number_value?: string;
  display_number: string;
  title_label?: string;
  badge?: string;
  mrp: number;
  offer_price: number;
  discount_pct?: number;
  numerology_sum?: number;
  operator?: string;
  stock?: number;
  status?: string;
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
  const primaryCategory = getPrimaryCategory(item);
  const titleLabel = String(item.title_label || '').trim();
  const displayTitle = titleLabel && titleLabel.toLowerCase() !== primaryCategory?.name.toLowerCase()
    ? titleLabel
    : 'Signature VIP Number';

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
      className="number-card-shell group relative flex h-full min-h-[216px] flex-col overflow-hidden rounded-xl p-2.5"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -4, scale: 1.008 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="number-card__sheen" aria-hidden="true" />
      <span className="number-card__topline" aria-hidden="true" />

      <div className="relative mb-1.5 flex items-center justify-between gap-2">
        {badge.label
          ? <span className={cn('number-card__badge inline-flex min-h-5 items-center gap-1 rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-wide', badge.className)}><Star className="h-2.5 w-2.5" fill="currentColor" />{badge.label}</span>
          : <span className="number-card__badge number-card__badge--default inline-flex min-h-5 items-center gap-1 rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-wide"><Star className="h-2.5 w-2.5" fill="currentColor" />VIP</span>}
        <button
          onClick={toggleWish}
          aria-label={wished ? 'remove from wishlist' : 'add to wishlist'}
          aria-pressed={wished}
          className={cn('number-card__icon-button grid h-7 w-7 place-items-center rounded-lg', wished && 'is-wished')}
        >
          <Heart className="h-3.5 w-3.5" fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>

      <button onClick={() => navigate(`/number/${item.number_id}`)} className="relative w-full text-center">
        <div className="number-card__eyebrow mb-1 flex items-center justify-center gap-1 text-[9px] font-bold">
          <Crown className="number-card__crown h-3 w-3 shrink-0" />
          <span className="min-w-0 truncate">{displayTitle}</span>
        </div>
        <HighlightedNumber
          number={item.number_value || item.display_number}
          category={primaryCategory}
          className="number-card__number"
        />
      </button>

      <div className="number-card__identity-row relative mt-1.5 flex min-h-7 items-center justify-between gap-1 border-y py-1">
        <div className="min-w-0" aria-label="Automatic number category">
          {primaryCategory ? (
          <button
            type="button"
            title={primaryCategory.name}
            onClick={() => navigate(`/shop?category=${encodeURIComponent(primaryCategory.slug)}`)}
            className="number-card__category max-w-full rounded-md border px-1.5 py-0.5 text-[9px] font-black"
          >
            <span className="block truncate">{primaryCategory.name}</span>
          </button>
          ) : (
            <span className="number-card__collection block truncate text-[9px] font-black uppercase tracking-wide">VIP Collection</span>
          )}
        </div>
        <span
          className="number-card__verified flex shrink-0 items-center gap-1 text-[9px] font-black"
          title="Verified and available on any operator"
        >
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          Verified
        </span>
      </div>

      <div className="relative mt-1.5 grid grid-cols-[38px_38px_minmax(0,1fr)] gap-1">
        <div className="number-card__metric rounded-lg border py-1 text-center">
          <div className="text-[8px] leading-none">Total</div>
          <div className="mt-0.5 text-xs font-black leading-none">{total}</div>
        </div>
        <div className="number-card__metric rounded-lg border py-1 text-center">
          <div className="text-[8px] leading-none">Sum</div>
          <div className="mt-0.5 text-xs font-black leading-none">{sum}</div>
        </div>
        <div className="number-card__price min-w-0 rounded-lg border px-1.5 py-1">
          <div className="flex items-center justify-between gap-1">
            <span className="number-card__mrp truncate text-[8px] line-through">{formatINR(item.mrp)}</span>
            {discountPct > 0 && <span className="number-card__discount shrink-0 rounded-full px-1 py-0.5 text-[8px] font-black leading-none">{discountPct}%</span>}
          </div>
          <div className="number-card__offer mt-0.5 flex min-w-0 items-center justify-end gap-0.5 text-sm font-black leading-none">
            <IndianRupee className="h-3 w-3 shrink-0" />
            <span className="truncate">{Number(item.offer_price).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="relative mt-1.5 grid grid-cols-[1fr_auto_auto] gap-1">
        <button className="number-card__primary-action inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-[10px] font-black disabled:opacity-50" onClick={buyNow} disabled={!!sold}>
          {!sold && <Zap className="h-3 w-3" aria-hidden="true" />}
          {sold ? 'Sold' : 'Buy Now'}
        </button>
        <button aria-label="add to cart" className="number-card__secondary-action grid h-8 w-9 place-items-center rounded-lg border disabled:opacity-50" onClick={addToCart} disabled={busy || !!sold}>
          <ShoppingCart className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => toggleCompare(item.number_id)}
          aria-label="compare"
          aria-pressed={inCompare}
          className={cn('number-card__secondary-action grid h-8 w-9 place-items-center rounded-lg border', inCompare && 'is-active')}
        >
          <BarChart2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.article>
  );
}
