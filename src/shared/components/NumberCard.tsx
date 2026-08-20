import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, BarChart2, CalendarClock, Crown, Star, IndianRupee, Zap, GitCompareArrows } from 'lucide-react';
import { useState, type PointerEvent } from 'react';
import { cartAPI, wishlistAPI, type NumberCatalogItem } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { useToast } from '@/shared/hooks/use-toast';
import { formatINR, BADGE_META, digitTotal, numerologySum } from '@/core/lib/format';
import { cn } from '@/core/lib/utils';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { getPrimaryCategory } from '@/core/categories/types';
import HighlightedNumber from '@/shared/components/HighlightedNumber';
import { formatRtpDate, getNumberPurchaseMode, numberActionPath } from '@/core/lib/numberPurchaseMode';

export type NumberItem = NumberCatalogItem;

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
      className="number-card-shell group relative flex h-full min-h-[218px] w-full flex-col overflow-hidden rounded-[1.2rem] p-2"
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
      <span className="number-card__corner number-card__corner--left" aria-hidden="true" />
      <span className="number-card__corner number-card__corner--right" aria-hidden="true" />

      <div className="relative z-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1">
        {badge.label
          ? <span className={cn('number-card__badge inline-flex min-h-6 items-center gap-1 rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-[.08em]', badge.className)}><Star className="h-2.5 w-2.5" fill="currentColor" />{badge.label}</span>
          : <span className="number-card__badge number-card__badge--default inline-flex min-h-6 items-center gap-1 rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-[.08em]"><Star className="h-2.5 w-2.5" fill="currentColor" />VIP Collection</span>}
        <button
          type="button"
          onClick={() => navigate(`/number/${item.number_id}/similar`)}
          className="number-card__similar mx-auto inline-flex min-h-6 min-w-0 items-center gap-1 rounded-md border px-1.5 text-[8px] font-black"
          aria-label={`Find numbers similar to ${item.display_number}`}
        >
          <GitCompareArrows className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Similar Numbers</span>
        </button>
        <button
          onClick={toggleWish}
          aria-label={wished ? 'remove from wishlist' : 'add to wishlist'}
          aria-pressed={wished}
          className={cn('number-card__icon-button grid h-8 w-8 shrink-0 place-items-center rounded-lg', wished && 'is-wished')}
        >
          <Heart className="h-4 w-4" fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="number-card__title-row relative z-10 flex min-w-0 items-center justify-center">
        <div className="number-card__eyebrow flex min-w-0 items-center justify-center gap-1 text-[9px] font-black uppercase tracking-[.08em]">
          <Crown className="number-card__crown h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 truncate">{displayTitle}</span>
        </div>
      </div>

      <button onClick={() => navigate(`/number/${item.number_id}`)} className="number-card__number-link relative z-10 w-full rounded-lg px-0.5 text-center focus-visible:outline-none" aria-label={`View VIP number ${item.display_number}`}>
        <HighlightedNumber
          number={item.number_value || item.display_number}
          category={primaryCategory}
          className="number-card__number"
        />
      </button>

      <div className="number-card__ornament relative z-10 mt-1 flex items-center gap-2" aria-hidden="true"><span /><i>◇</i><span /></div>

      <div className="number-card__identity-row relative z-10 flex min-h-5 items-center justify-between gap-1">
        <div className="min-w-0 flex-1" aria-label="Automatic number category">
          {primaryCategory ? (
          <button
            type="button"
            title={primaryCategory.name}
            onClick={() => navigate(`/shop?category=${encodeURIComponent(primaryCategory.slug)}`)}
            className="number-card__category mx-auto block max-w-full rounded-full border px-2 py-0 text-[8px] font-black"
          >
            <span className="block truncate">{primaryCategory.name}</span>
          </button>
          ) : (
            <span className="number-card__collection block truncate text-[9px] font-black uppercase tracking-wide">VIP Collection</span>
          )}
        </div>
        {isPrebook ? <span className="number-card__verified flex shrink-0 items-center gap-1 text-[9px] font-black" title={`RTP on ${formatRtpDate(item.rtp_available_at)}`}><CalendarClock className="h-3 w-3" />{formatRtpDate(item.rtp_available_at)}</span> : null}
      </div>

      <div className="number-card__commerce relative z-10 mt-0.5">
      <div className="number-card__metrics grid grid-cols-2 gap-1">
        <div className="number-card__metric rounded-md border py-0.5 text-center">
          <div className="text-[8px] font-bold leading-none">Total</div>
          <div className="mt-0.5 text-xs font-black leading-none">{total}</div>
        </div>
        <div className="number-card__metric rounded-md border py-0.5 text-center">
          <div className="text-[8px] font-bold leading-none">Sum</div>
          <div className="mt-0.5 text-xs font-black leading-none">{sum}</div>
        </div>
      </div>

      <div className="number-card__price mt-0.5 grid min-w-0 grid-cols-[.85fr_1.2fr_.8fr] items-stretch overflow-hidden rounded-md border">
        <div className="number-card__price-cell min-w-0 px-1 py-0.5 text-center">
          <div className="text-[7px] font-black uppercase tracking-wide">MRP Price</div>
          <span className="number-card__mrp block whitespace-nowrap text-[9px] font-bold line-through">{formatINR(item.mrp)}</span>
        </div>
        <div className="number-card__price-cell number-card__price-cell--offer min-w-0 px-1 py-0.5 text-center">
          <div className="text-[7px] font-black uppercase tracking-wide">Offer Price</div>
          <div className="number-card__offer flex min-w-0 items-center justify-center gap-0.5 text-xs font-black leading-none">
            <IndianRupee className="h-3 w-3 shrink-0" />
            <span className="whitespace-nowrap">{Number(item.offer_price).toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="number-card__price-cell grid place-items-center px-1 py-0.5">
          {discountPct > 0 ? <span className="number-card__discount rounded border px-1 py-0.5 text-[7px] font-black leading-none">✦ {discountPct}% OFF</span> : <span className="text-[7px] font-bold text-muted-foreground">Best price</span>}
        </div>
      </div>
      </div>

      <div className={`relative z-10 mt-auto grid gap-1 pt-1 ${isPrebook ? 'grid-cols-[1fr_auto]' : 'grid-cols-[1fr_1fr_auto]'}`}>
        <button className="number-card__primary-action inline-flex min-h-8 items-center justify-center gap-1 rounded-lg px-1.5 text-[10px] font-black disabled:opacity-50" onClick={buyNow} disabled={unavailable}>
          {!unavailable && (isPrebook ? <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> : <Zap className="h-3.5 w-3.5" aria-hidden="true" />)}
          {unavailable ? 'Unavailable' : isPrebook ? 'Pre-book' : 'Buy Now'}
        </button>
        {!isPrebook && <button aria-label="add to cart" className="number-card__secondary-action inline-flex h-8 items-center justify-center gap-1 rounded-lg border px-1 text-[9px] font-black disabled:opacity-50" onClick={addToCart} disabled={busy || unavailable}>
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Add to Cart</span>
        </button>}
        <button
          onClick={() => toggleCompare(item.number_id)}
          aria-label="compare"
          aria-pressed={inCompare}
          className={cn('number-card__secondary-action grid h-8 w-8 place-items-center rounded-lg border', inCompare && 'is-active')}
        >
          <BarChart2 className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  );
}
