import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, BarChart2, CalendarClock, Crown, Star, Zap, GitFork, Tag } from 'lucide-react';
import { useState } from 'react';
import { cartAPI, wishlistAPI, type NumberCatalogItem } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';
import { localService } from '@/core/services/local';
import { useToast } from '@/shared/hooks/use-toast';
import { formatINR, BADGE_META, digitTotal, numerologySum } from '@/core/lib/format';
import { cn } from '@/core/lib/utils';
import { getPrimaryCategory, type NumberCategoryMatch } from '@/core/categories/types';
import { normalizeNumberDigits } from '@/core/categories/highlight';
import HighlightedNumber from '@/shared/components/HighlightedNumber';
import { formatRtpDate, getNumberPurchaseMode, numberActionPath } from '@/core/lib/numberPurchaseMode';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import './NumberCard.css';

export type NumberItem = NumberCatalogItem;
interface NumberCardProps {
  item: NumberItem;
  onWishlistChange?: () => void;
  compact?: boolean;
  /** Search results opt in after the customer applies a search or filter. */
  highlightDigits?: boolean;
  groupingCategory?: string;
}

export default function NumberCard({ item, onWishlistChange, highlightDigits = false, compact = false, groupingCategory }: NumberCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCounts, compare, toggleCompare } = useStore();
  const [wished, setWished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const badge = BADGE_META[item.badge || 'NONE'] || BADGE_META.NONE;
  const inCompare = compare.includes(item.number_id);
  const compareLabel = inCompare ? 'Remove from compare' : 'Add to compare';
  const number = normalizeNumberDigits(item.number_value || item.display_number);
  const total = digitTotal(number);
  const rootSum = numerologySum(number);
  const purchaseMode = getNumberPurchaseMode(item);
  const unavailable = purchaseMode === 'UNAVAILABLE';
  const isPrebook = purchaseMode === 'PREBOOK';
  const isNonRtp = item.rtp_status === 'NON_RTP';
  const discountPct = item.discount_pct ?? (Number(item.mrp) > 0
    ? Math.round(((Number(item.mrp) - Number(item.offer_price)) / Number(item.mrp)) * 100) : 0);
  const primaryCategory = getPrimaryCategory(item);
  const displayCategory: NumberCategoryMatch | null = groupingCategory
    ? item.categories?.find((category) => category.slug === groupingCategory) || primaryCategory
    : primaryCategory;
  const titleLabel = String(item.title_label || '').trim();
  const displayTitle = titleLabel && titleLabel.toLowerCase() !== primaryCategory?.name.toLowerCase()
    ? titleLabel : 'VIP Number';
  const rtpDate = formatRtpDate(item.rtp_available_at);

  const requireAuth = (): boolean => {
    if (!localService.getToken()) { navigate('/login'); return false; }
    return true;
  };
  const addToCart = async () => {
    if (!requireAuth() || busy || unavailable || isPrebook) return;
    setBusy(true);
    try {
      await cartAPI.add(item.number_id);
      await refreshCounts();
      toast({ title: 'Added to cart', description: item.display_number });
    } catch (e: any) { toast({ title: 'Could not add', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const buyNow = () => { if (unavailable || !requireAuth()) return; navigate(numberActionPath(item)); };
  const toggleWish = async () => {
    if (!requireAuth() || wishBusy) return;
    setWishBusy(true);
    try {
      if (wished) { await wishlistAPI.remove(item.number_id); setWished(false); }
      else { await wishlistAPI.add(item.number_id); setWished(true); }
      await refreshCounts(); onWishlistChange?.();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setWishBusy(false); }
  };

  return (
    <article className={cn('reference-card', compact && 'reference-card--compact')} data-testid="number-card">
      <div className="reference-card__hero">
        <div className="reference-card__toolbar">
          <span className="reference-card__badge" data-badge={item.badge || 'NONE'}>
            <Star aria-hidden="true" fill="currentColor" />{badge.label || 'VIP Collection'}
          </span>
          <button type="button" onClick={() => navigate(`/number/${item.number_id}/similar`)}
            className="reference-card__similar" aria-label={`Find numbers similar to ${item.display_number}`}>
            <GitFork aria-hidden="true" /><span>Similar</span>
          </button>
          <button type="button" onClick={toggleWish} disabled={wishBusy} aria-busy={wishBusy}
            aria-label={wished ? 'remove from wishlist' : 'add to wishlist'} aria-pressed={wished}
            className={cn('reference-card__wish', wished && 'is-wished')}>
            <Heart aria-hidden="true" fill={wished ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="reference-card__title"><Crown aria-hidden="true" /><span>{displayTitle}</span></div>
        <button type="button" onClick={() => navigate(`/number/${item.number_id}`)}
          className="reference-card__number-link" aria-label={`View VIP number ${item.display_number}`}>
          <HighlightedNumber number={number} category={displayCategory && !highlightDigits ? { ...displayCategory, match_spans: [] } : displayCategory} appearance="reference" />
        </button>
        <div className="reference-card__identity">
          {primaryCategory ? (
            <button type="button" title={primaryCategory.name} className="reference-card__category"
              onClick={() => navigate(`/shop?category=${encodeURIComponent(primaryCategory.slug)}`)}>
              {primaryCategory.name}
            </button>
          ) : <span className="reference-card__category">VIP Collection</span>}
          {isNonRtp
            ? <span className="reference-card__readiness" title={`NON-RTP · Ready to port on ${rtpDate}`}><CalendarClock aria-hidden="true" />NON-RTP · Pre-book · {rtpDate}</span>
            : item.rtp_status === 'RTA'
              ? <span className="reference-card__readiness" title="Ready to activate within minutes"><Zap aria-hidden="true" />RTA · Ready to activate</span>
              : <span className="reference-card__readiness" title="Ready to begin the porting process"><CalendarClock aria-hidden="true" />RTP · Ready to port</span>}
        </div>
      </div>
      <dl className="reference-card__metrics">
        <div className="reference-card__metric"><dt>Total</dt><dd>{total}</dd></div>
        <div className="reference-card__metric"><dt>Root sum</dt><dd>{rootSum}</dd></div>
      </dl>
      <div className="reference-card__price" data-large-price={Math.max(Number(item.mrp), Number(item.offer_price)) >= 1000000 || undefined}>
        <div className="reference-card__price-cell reference-card__price-cell--mrp">
          <div className="reference-card__price-label">MRP</div><s className="reference-card__mrp">{formatINR(item.mrp)}</s>
        </div>
        <div className="reference-card__price-cell reference-card__price-cell--offer">
          <div className="reference-card__price-label">Offer price</div><div className="reference-card__offer">{formatINR(item.offer_price)}</div>
        </div>
        <div className="reference-card__price-cell reference-card__price-cell--discount">
          {discountPct > 0
            ? <span className="reference-card__discount"><Tag aria-hidden="true" />{discountPct}% OFF</span>
            : <span className="reference-card__best-price">Best price</span>}
        </div>
      </div>
      <div className={cn('reference-card__actions', isPrebook && 'reference-card__actions--prebook')}>
        <button type="button" className="reference-card__buy" onClick={buyNow} disabled={unavailable}>
          {!unavailable && (isPrebook ? <CalendarClock aria-hidden="true" /> : <Zap aria-hidden="true" />)}
          <span>{unavailable ? 'Unavailable' : isPrebook ? 'Pre-book' : 'Buy Now'}</span>
        </button>
        {!isPrebook && <button type="button" aria-label="add to cart" aria-busy={busy} className="reference-card__cart"
          onClick={addToCart} disabled={busy || unavailable}>
          <ShoppingCart aria-hidden="true" /><span>{busy ? 'Adding…' : 'Add to Cart'}</span>
        </button>}
        <TooltipProvider delayDuration={250}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={() => toggleCompare(item.number_id)} aria-label={compareLabel}
                aria-pressed={inCompare} className={cn('reference-card__compare', inCompare && 'is-active')}>
                <BarChart2 aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} collisionPadding={10} className="w-max max-w-40 px-2 py-1 text-center text-[10px] leading-tight shadow-lg">
              <span className="block font-bold leading-none">{compareLabel}</span>
              <span className="mt-1 block text-[9px] leading-tight text-muted-foreground">
                {inCompare ? 'Already in your comparison.' : 'Compare price, pattern & numerology.'}
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </article>
  );
}
