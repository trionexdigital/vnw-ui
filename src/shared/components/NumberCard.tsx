import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, BarChart2, CalendarClock, Crown, Star, IndianRupee, ShieldCheck, Zap } from 'lucide-react';
import { useState, type PointerEvent } from 'react';
import { cartAPI, wishlistAPI } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { useToast } from '@/shared/hooks/use-toast';
import { formatINR, BADGE_META, digitTotal, numerologySum } from '@/core/lib/format';
import { cn } from '@/core/lib/utils';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import type { CategorizedNumber } from '@/core/categories/types';
import { getPrimaryCategory } from '@/core/categories/types';
import HighlightedNumber from '@/shared/components/HighlightedNumber';
import { formatRtpDate, getNumberPurchaseMode, numberActionPath } from '@/core/lib/numberPurchaseMode';

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
  rtp_status?: 'RTP' | 'NON_RTP';
  rtp_available_at?: string | null;
}

export default function NumberCard({ item, onWishlistChange }: { item: NumberItem; onWishlistChange?: () => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCounts, compare, toggleCompare } = useStore();
  const [wished, setWished] = useState(false);
  const [busy, setBusy] = useState(false);
  const reduceMotion = useReducedMotion();
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 260, damping: 24, mass: 0.72 });
  const rotateY = useSpring(rawRotateY, { stiffness: 260, damping: 24, mass: 0.72 });
  const badge = BADGE_META[item.badge || 'NONE'];
  const inCompare = compare.includes(item.number_id);
  const total = digitTotal(item.display_number);
  const sum = item.numerology_sum ?? numerologySum(item.display_number);
  const purchaseMode = getNumberPurchaseMode(item);
  const unavailable = purchaseMode === 'UNAVAILABLE';
  const isPrebook = purchaseMode === 'PREBOOK';
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

  const buyNow = () => { if (!requireAuth()) return; navigate(numberActionPath(item)); };

  const toggleWish = async () => {
    if (!requireAuth()) return;
    try {
      if (wished) { await wishlistAPI.remove(item.number_id); setWished(false); }
      else { await wishlistAPI.add(item.number_id); setWished(true); }
      await refreshCounts(); onWishlistChange?.();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const moveCard = (event: PointerEvent<HTMLElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    rawRotateX.set((0.5 - y) * 5);
    rawRotateY.set((x - 0.5) * 5);
    event.currentTarget.style.setProperty('--card-pointer-x', `${Math.round(x * 100)}%`);
    event.currentTarget.style.setProperty('--card-pointer-y', `${Math.round(y * 100)}%`);
  };

  const resetCard = (event: PointerEvent<HTMLElement>) => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    event.currentTarget.style.setProperty('--card-pointer-x', '50%');
    event.currentTarget.style.setProperty('--card-pointer-y', '30%');
  };

  return (
    <motion.article
      className="number-card-shell group relative flex h-full min-h-[296px] flex-col overflow-hidden rounded-[1.35rem] p-3.5"
      data-testid="number-card"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -6, scale: 1.01 }}
      whileTap={reduceMotion ? undefined : { scale: 0.992 }}
      onPointerMove={moveCard}
      onPointerLeave={resetCard}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      transition={{
        rotateX: { type: 'spring', stiffness: 260, damping: 24, mass: 0.72 },
        rotateY: { type: 'spring', stiffness: 260, damping: 24, mass: 0.72 },
        y: { type: 'spring', stiffness: 260, damping: 24, mass: 0.72 },
        scale: { type: 'spring', stiffness: 260, damping: 24, mass: 0.72 },
        opacity: { duration: reduceMotion ? 0 : 0.28 },
      }}
    >
      <span className="number-card__glow" aria-hidden="true" />
      <span className="number-card__topline" aria-hidden="true" />

      <div className="relative z-10 flex items-center justify-between gap-3">
        {badge.label
          ? <span className={cn('number-card__badge inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[.08em]', badge.className)}><Star className="h-3 w-3" fill="currentColor" />{badge.label}</span>
          : <span className="number-card__badge number-card__badge--default inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[.08em]"><Star className="h-3 w-3" fill="currentColor" />VIP Collection</span>}
        <button
          onClick={toggleWish}
          aria-label={wished ? 'remove from wishlist' : 'add to wishlist'}
          aria-pressed={wished}
          className={cn('number-card__icon-button grid h-11 w-11 shrink-0 place-items-center rounded-xl', wished && 'is-wished')}
        >
          <Heart className="h-[18px] w-[18px]" fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>

      <button onClick={() => navigate(`/number/${item.number_id}`)} className="relative z-10 mt-3 w-full rounded-xl text-center focus-visible:outline-none" aria-label={`View VIP number ${item.display_number}`}>
        <div className="number-card__eyebrow mb-1.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[.1em]">
          <Crown className="number-card__crown h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">{displayTitle}</span>
        </div>
        <HighlightedNumber
          number={item.number_value || item.display_number}
          category={primaryCategory}
          className="number-card__number"
        />
      </button>

      <div className="number-card__identity-row relative z-10 mt-2 flex min-h-9 items-center justify-between gap-2 border-y py-1.5">
        <div className="min-w-0" aria-label="Automatic number category">
          {primaryCategory ? (
          <button
            type="button"
            title={primaryCategory.name}
            onClick={() => navigate(`/shop?category=${encodeURIComponent(primaryCategory.slug)}`)}
            className="number-card__category max-w-full rounded-full border px-2.5 py-1 text-[10px] font-black"
          >
            <span className="block truncate">{primaryCategory.name}</span>
          </button>
          ) : (
            <span className="number-card__collection block truncate text-[10px] font-black uppercase tracking-wide">VIP Collection</span>
          )}
        </div>
        {isPrebook ? <span className="number-card__verified flex shrink-0 items-center gap-1 text-[10px] font-black" title={`RTP on ${formatRtpDate(item.rtp_available_at)}`}><CalendarClock className="h-3.5 w-3.5" />{formatRtpDate(item.rtp_available_at)}</span> : <span
          className="number-card__verified flex shrink-0 items-center gap-1 text-[10px] font-black"
          title="Verified and available on any operator"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Verified
        </span>}
      </div>

      <div className="relative z-10 mt-2.5 grid grid-cols-[52px_52px_minmax(0,1fr)] gap-2">
        <div className="number-card__metric rounded-xl border py-1.5 text-center">
          <div className="text-[9px] font-bold leading-none">Total</div>
          <div className="mt-1 text-sm font-black leading-none">{total}</div>
        </div>
        <div className="number-card__metric rounded-xl border py-1.5 text-center">
          <div className="text-[9px] font-bold leading-none">Sum</div>
          <div className="mt-1 text-sm font-black leading-none">{sum}</div>
        </div>
        <div className="number-card__price min-w-0 rounded-xl border px-3 py-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="number-card__mrp truncate text-[10px] font-semibold line-through">{formatINR(item.mrp)}</span>
            {discountPct > 0 && <span className="number-card__discount shrink-0 rounded-full px-1.5 py-1 text-[9px] font-black leading-none">{discountPct}% off</span>}
          </div>
          <div className="number-card__offer mt-1 flex min-w-0 items-center justify-end gap-0.5 text-lg font-black leading-none">
            <IndianRupee className="h-4 w-4 shrink-0" />
            <span className="truncate">{Number(item.offer_price).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className={`relative z-10 mt-auto grid gap-2 pt-2.5 ${isPrebook ? 'grid-cols-[1fr_auto]' : 'grid-cols-[1fr_auto_auto]'}`}>
        <button className="number-card__primary-action inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black disabled:opacity-50" onClick={buyNow} disabled={unavailable}>
          {!unavailable && (isPrebook ? <CalendarClock className="h-4 w-4" aria-hidden="true" /> : <Zap className="h-4 w-4" aria-hidden="true" />)}
          {unavailable ? 'Unavailable' : isPrebook ? 'Pre-book' : 'Buy Now'}
        </button>
        {!isPrebook && <button aria-label="add to cart" className="number-card__secondary-action grid h-11 w-11 place-items-center rounded-xl border disabled:opacity-50" onClick={addToCart} disabled={busy || unavailable}>
          <ShoppingCart className="h-[18px] w-[18px]" />
        </button>}
        <button
          onClick={() => toggleCompare(item.number_id)}
          aria-label="compare"
          aria-pressed={inCompare}
          className={cn('number-card__secondary-action grid h-11 w-11 place-items-center rounded-xl border', inCompare && 'is-active')}
        >
          <BarChart2 className="h-[18px] w-[18px]" />
        </button>
      </div>
    </motion.article>
  );
}
