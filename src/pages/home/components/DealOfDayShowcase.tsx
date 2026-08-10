import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Crown,
  Pause,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tags,
} from 'lucide-react';
import { AnimatePresence, useInView } from 'framer-motion';
import { motion, useReducedMotion } from '@/shared/motion/MotionPrimitives';
import { formatINR } from '@/core/lib/format';
import { getPrimaryCategory } from '@/core/categories/types';
import type { DealOfDayItem } from '@/core/api/vnwAPI';
import { cn } from '@/core/lib/utils';
import { formatRtpDate, getNumberPurchaseMode, numberActionPath } from '@/core/lib/numberPurchaseMode';

type CardPosition = 'previous' | 'active' | 'next';

interface VisibleDeal {
  item: DealOfDayItem;
  position: CardPosition;
}

const CARD_TRANSITION = {
  duration: 0.74,
  ease: [0.22, 1, 0.36, 1] as const,
};
const RING_TRANSITION = CARD_TRANSITION;
const CARD_EXIT_VARIANTS = {
  exit: (direction: number) => ({
    x: direction > 0 ? '-56%' : '56%',
    y: '7%',
    z: -300,
    scale: 0.76,
    rotateX: -3,
    rotateY: direction > 0 ? 48 : -48,
    rotateZ: direction > 0 ? -2.5 : 2.5,
    opacity: 0,
  }),
};

const defaultDescription = 'Highly desirable • Easy to remember';

function dealLabel(item: DealOfDayItem) {
  return item.hero_label || item.title_label || getPrimaryCategory(item)?.name || 'Signature VIP Number';
}

function dealCategory(item: DealOfDayItem) {
  return getPrimaryCategory(item) || { slug: 'unique-numbers', name: 'Unique Numbers' };
}

function dealDescription(item: DealOfDayItem) {
  return item.hero_description || item.description || defaultDescription;
}

function dealNumber(item: DealOfDayItem) {
  return String(item.display_number || item.number_value || '').trim() || 'VIP Number';
}

function positionMotion(position: CardPosition, count: number, reducedMotion = false) {
  if (position === 'active') {
    return {
      x: '0%',
      y: reducedMotion ? '0%' : '0%',
      z: reducedMotion ? 0 : 64,
      scale: 1,
      rotateX: reducedMotion ? 0 : -0.5,
      rotateY: 0,
      rotateZ: 0,
      opacity: 1,
    };
  }
  const sideOffset = count === 2 ? 28 : 34;
  const sign = position === 'previous' ? -1 : 1;
  return {
    x: `${sign * sideOffset}%`,
    y: reducedMotion ? '0%' : count === 2 ? '0.5%' : '2.5%',
    z: reducedMotion ? 0 : count === 2 ? -92 : -168,
    scale: reducedMotion ? 1 : count === 2 ? 0.9 : 0.86,
    rotateX: reducedMotion ? 0 : -1.5,
    rotateY: reducedMotion ? 0 : sign * -29,
    rotateZ: reducedMotion ? 0 : sign * 1.35,
    opacity: count === 2 ? 0.86 : 0.72,
  };
}

function entryMotion(direction: number) {
  return {
    x: direction > 0 ? '56%' : '-56%',
    y: '7%',
    z: -300,
    scale: 0.76,
    rotateX: -3,
    rotateY: direction > 0 ? -48 : 48,
    rotateZ: direction > 0 ? 2.5 : -2.5,
    opacity: 0,
  };
}

function DealCard({
  deal,
  position,
  count,
  reducedMotion,
  direction,
}: {
  deal: DealOfDayItem;
  position: CardPosition;
  count: number;
  reducedMotion: boolean;
  direction: number;
}) {
  const active = position === 'active';
  const category = dealCategory(deal);
  const label = dealLabel(deal);
  const prebook = getNumberPurchaseMode(deal) === 'PREBOOK';
  const showSeparateLabel = label.trim().toLocaleLowerCase() !== category.name.trim().toLocaleLowerCase();
  return (
    <motion.div
      className={cn(
        'deal-card-motion absolute inset-0 flex items-center justify-center',
        active ? 'z-30' : 'z-20',
      )}
      custom={direction}
      variants={reducedMotion ? undefined : CARD_EXIT_VARIANTS}
      initial={reducedMotion ? false : entryMotion(direction)}
      animate={positionMotion(position, count, reducedMotion)}
      exit={reducedMotion ? { opacity: 0 } : 'exit'}
      transition={reducedMotion ? { duration: 0.14 } : {
        ...CARD_TRANSITION,
        opacity: { duration: 0.26 },
      }}
      style={{ pointerEvents: active ? 'auto' : 'none' }}
      data-position={position}
      data-depth={active ? 'front' : 'rear'}
    >
      <article
        className={cn('deal-hero-card relative flex flex-col', active ? 'is-active' : 'is-side')}
        aria-hidden={!active}
      >
        {active && (
          <div className="deal-hero-card__ribbon">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Today&apos;s Lucky Pick
          </div>
        )}

        <div className="deal-hero-card__content">
          <div className="deal-hero-card__identity">
            <span className="deal-hero-card__crown-medallion" aria-hidden="true">
              <Crown className="deal-hero-card__crown" />
            </span>
            <div className="deal-hero-card__identity-copy">
              <div className="deal-hero-card__category">
                <span><Tags aria-hidden="true" /> VIP Category</span>
                <strong>{category.name}</strong>
              </div>
              {showSeparateLabel && <p className="deal-hero-card__label">{label}</p>}
            </div>
          </div>

          <div className="deal-hero-card__number-panel">
            <Link
              to={`/number/${deal.number_id}`}
              className="deal-hero-card__number focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              tabIndex={active ? 0 : -1}
            >
              {dealNumber(deal)}
            </Link>
            <div className="deal-hero-card__ornament" aria-hidden="true"><span /></div>
          </div>
          <p className="deal-hero-card__description">{dealDescription(deal)}</p>

          <div className="deal-hero-card__port">
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            {prebook ? `Ready ${formatRtpDate(deal.rtp_available_at)}` : 'Ready to Port'}
          </div>

          <div className="deal-hero-card__purchase">
            <div>
              <span>Lucky Pick price</span>
              <strong>{formatINR(deal.offer_price)}</strong>
              {deal.mrp > deal.offer_price && <del>{formatINR(deal.mrp)}</del>}
            </div>
            <Link
              to={numberActionPath(deal)}
              className="deal-hero-card__book focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              tabIndex={active ? 0 : -1}
            >
              {prebook ? 'Pre-book' : 'Buy Now'}
              <span><ArrowRight className="h-4 w-4" /></span>
            </Link>
          </div>
        </div>

        <div className="deal-hero-card__trust">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>Verified</span><i /> <span>Secure</span><i /> <span>Trusted</span>
        </div>
      </article>
    </motion.div>
  );
}

export default function DealOfDayShowcase({
  deals,
  loading = false,
  error = false,
}: {
  deals: DealOfDayItem[];
  loading?: boolean;
  error?: boolean;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { amount: 0.22 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [baseRotation, setBaseRotation] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex >= deals.length) setActiveIndex(0);
  }, [activeIndex, deals.length]);

  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const move = useCallback((step: number) => {
    if (deals.length <= 1) return;
    const normalizedDirection = step < 0 ? -1 : 1;
    setDirection(normalizedDirection);
    setActiveIndex((current) => ((current + step) % deals.length + deals.length) % deals.length);
    if (!reducedMotion) setBaseRotation((current) => current + normalizedDirection * 60);
  }, [deals.length, reducedMotion]);

  const show = useCallback((index: number) => {
    if (index === activeIndex || index < 0 || index >= deals.length) return;
    const forwardDistance = (index - activeIndex + deals.length) % deals.length;
    const backwardDistance = (activeIndex - index + deals.length) % deals.length;
    const nextDirection = forwardDistance <= backwardDistance ? 1 : -1;
    setDirection(nextDirection);
    setActiveIndex(index);
    if (!reducedMotion) setBaseRotation((current) => current + nextDirection * 60);
  }, [activeIndex, deals.length, reducedMotion]);

  useEffect(() => {
    if (
      reducedMotion
      || deals.length <= 1
      || interacting
      || rotationPaused
      || focusPaused
      || !inView
      || !pageVisible
      || loading
    ) return;
    const timer = window.setTimeout(() => move(1), 6000);
    return () => window.clearTimeout(timer);
  }, [
    activeIndex,
    deals.length,
    focusPaused,
    inView,
    interacting,
    loading,
    move,
    pageVisible,
    reducedMotion,
    rotationPaused,
  ]);

  const visibleDeals = useMemo<VisibleDeal[]>(() => {
    if (!deals.length) return [];
    if (deals.length === 1) return [{ item: deals[0], position: 'active' }];
    if (deals.length === 2) {
      return [
        { item: deals[activeIndex], position: 'active' },
        { item: deals[(activeIndex + 1) % deals.length], position: 'next' },
      ];
    }
    return [
      { item: deals[(activeIndex - 1 + deals.length) % deals.length], position: 'previous' },
      { item: deals[activeIndex], position: 'active' },
      { item: deals[(activeIndex + 1) % deals.length], position: 'next' },
    ];
  }, [activeIndex, deals]);

  return (
    <div
      className="deal-showcase"
      role="region"
      aria-roledescription="carousel"
      aria-label="Lucky Pick of the Day VIP numbers"
      onFocusCapture={(event) => {
        if ((event.target as HTMLElement).matches(':focus-visible')) setFocusPaused(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      }}
    >
      <div className="deal-showcase__heading">
        <p className="deal-showcase__marketplace">
          <span aria-hidden="true" />
          India&apos;s Premium VIP Number Marketplace
          <span aria-hidden="true" />
        </p>
        <h1 id="home-hero-title"><span aria-hidden="true" />Lucky Pick of the Day<span aria-hidden="true" /></h1>
        <p>Exclusive numbers. Exceptional value.</p>
      </div>

      <div
        ref={stageRef}
        className="deal-showcase__stage"
        tabIndex={0}
        onTouchStart={(event) => {
          setInteracting(true);
          setTouchStart(event.touches[0]?.clientX ?? null);
        }}
        onTouchEnd={(event) => {
          if (touchStart != null) {
            const distance = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
            if (Math.abs(distance) >= 42) move(distance < 0 ? 1 : -1);
          }
          setTouchStart(null);
          setInteracting(false);
        }}
        onTouchCancel={() => {
          setTouchStart(null);
          setInteracting(false);
        }}
      >
        <div className="deal-showcase__glow" aria-hidden="true" />
        <div className="deal-showcase__base" aria-hidden="true">
          <motion.div
            className="deal-showcase__base-ring deal-showcase__base-ring--outer"
            animate={{ rotate: reducedMotion ? 0 : -baseRotation * 0.35 }}
            transition={reducedMotion ? { duration: 0 } : RING_TRANSITION}
          />
          <motion.div
            className="deal-showcase__base-ring deal-showcase__base-ring--inner"
            animate={{ rotate: reducedMotion ? 0 : baseRotation }}
            transition={reducedMotion ? { duration: 0 } : RING_TRANSITION}
            data-rotation={baseRotation}
          />
        </div>

        {loading ? (
          <div className="deal-showcase__loading" role="status" aria-label="Loading Lucky Pick of the Day">
            <div className="deal-showcase__skeleton" />
          </div>
        ) : visibleDeals.length ? (
          <AnimatePresence initial={false} custom={direction}>
            {visibleDeals.map(({ item, position }) => (
              <DealCard
                key={item.number_id}
                deal={item}
                position={position}
                count={deals.length}
                reducedMotion={reducedMotion}
                direction={direction}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="deal-showcase__empty" role="status">
            <Sparkles className="h-8 w-8 text-primary" />
            <strong>{error ? 'Lucky Picks are refreshing' : 'New premium Lucky Picks are coming soon'}</strong>
            <span>Explore the live catalog while our next exclusive selection is prepared.</span>
            <Link to="/shop">Explore Numbers <ArrowRight className="h-4 w-4" /></Link>
          </div>
        )}

        {deals.length > 1 && !loading && (
          <>
            <button type="button" className="deal-showcase__arrow deal-showcase__arrow--left" onClick={() => move(-1)} aria-label="Previous Lucky Pick">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button type="button" className="deal-showcase__arrow deal-showcase__arrow--right" onClick={() => move(1)} aria-label="Next Lucky Pick">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {deals.length > 1 && !loading && (
        <div className="deal-showcase__dots" role="group" aria-label="Lucky Pick carousel controls">
          {!reducedMotion && (
            <button
              type="button"
              className="deal-showcase__rotation-control"
              aria-label={rotationPaused ? 'Start automatic Lucky Pick rotation' : 'Pause automatic Lucky Pick rotation'}
              aria-pressed={rotationPaused}
              onClick={() => setRotationPaused((paused) => !paused)}
            >
              {rotationPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </button>
          )}
          <span className="deal-showcase__dots-divider" aria-hidden="true" />
          {deals.map((deal, index) => (
            <button
              key={deal.number_id}
              type="button"
              aria-current={index === activeIndex ? 'true' : undefined}
              aria-label={`Show Lucky Pick ${index + 1}: ${dealNumber(deal)}`}
              onClick={() => show(index)}
              className={cn('deal-showcase__dot', index === activeIndex && 'is-active')}
            />
          ))}
        </div>
      )}
      {deals.length > 0 && (
        <p
          className="sr-only"
          aria-live={rotationPaused || focusPaused || reducedMotion ? 'polite' : 'off'}
          aria-atomic="true"
        >
          Lucky Pick {activeIndex + 1} of {deals.length}: {deals[activeIndex] ? dealNumber(deals[activeIndex]) : ''}
        </p>
      )}
    </div>
  );
}
