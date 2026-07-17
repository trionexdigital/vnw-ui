import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { CarouselSlide } from '@/core/api/vnwAPI';
import {
  DEFAULT_CAROUSEL_CONTENT_X,
  DEFAULT_CAROUSEL_CONTENT_Y,
  normalizeCarouselPosition,
} from '@/core/lib/carouselImage';
import { motion, useReducedMotion } from '@/shared/motion/MotionPrimitives';

const carouselFrameClass = 'home-carousel__frame relative mx-auto h-[420px] w-full max-w-[1760px] overflow-hidden bg-muted sm:h-[460px] lg:h-[500px] xl:h-[560px]';

export function HomeCarousel({ slides, loading = false }: { slides: CarouselSlide[]; loading?: boolean }) {
  const reduceMotion = useReducedMotion();
  const usableSlides = useMemo(() => slides.filter((slide) => Boolean(slide.image)), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualPause, setManualPause] = useState(false);
  const [interacting, setInteracting] = useState(false);

  useEffect(() => {
    if (activeIndex >= usableSlides.length) setActiveIndex(0);
  }, [activeIndex, usableSlides.length]);

  useEffect(() => {
    if (reduceMotion || manualPause || interacting || usableSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % usableSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [interacting, manualPause, reduceMotion, usableSlides.length]);

  if (loading) {
    return (
      <section className="bg-background" aria-label="Loading homepage carousel">
        <div className={`${carouselFrameClass} animate-pulse bg-muted`} />
      </section>
    );
  }

  if (usableSlides.length === 0) return null;

  const show = (index: number) => {
    const count = usableSlides.length;
    setActiveIndex(((index % count) + count) % count);
  };

  const slide = usableSlides[activeIndex];
  const contentX = normalizeCarouselPosition(slide.content_x, DEFAULT_CAROUSEL_CONTENT_X);
  const contentY = normalizeCarouselPosition(slide.content_y, DEFAULT_CAROUSEL_CONTENT_Y);
  const hasCopy = Boolean(slide.eyebrow || slide.title || slide.subtitle || (slide.cta_text && slide.cta_link));
  const isInternalLink = slide.cta_link?.startsWith('/');
  const ctaClass = 'inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-400/70 bg-amber-500 px-4 py-2 text-sm font-black text-stone-950 shadow-[0_12px_28px_-16px_rgba(120,70,5,.9)] transition hover:-translate-y-0.5 hover:bg-amber-400';

  const cta = slide.cta_text && slide.cta_link ? (
    isInternalLink ? (
      <Link to={slide.cta_link} className={ctaClass}>
        {slide.cta_text}<ArrowRight className="h-4 w-4" />
      </Link>
    ) : (
      <a href={slide.cta_link} target="_blank" rel="noreferrer" className={ctaClass}>
        {slide.cta_text}<ArrowRight className="h-4 w-4" />
      </a>
    )
  ) : null;

  return (
    <section
      className="home-carousel relative overflow-hidden bg-background"
      aria-label="Featured promotions"
      aria-roledescription="carousel"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteracting(false);
      }}
    >
      <div className="pointer-events-none absolute inset-x-[8%] top-1/2 h-2/3 -translate-y-1/2 rounded-full bg-amber-200/20 blur-3xl" aria-hidden="true" />
      <div className={carouselFrameClass}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.banner_id}
            className="absolute inset-0 touch-pan-y"
            initial={reduceMotion ? false : { opacity: 0, scale: 1.012 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.46, ease: [0.16, 1, 0.3, 1] }}
            drag={!reduceMotion && usableSlides.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragStart={() => setInteracting(true)}
            onDragEnd={(_event, info) => {
              setInteracting(false);
              if (info.offset.x < -60) show(activeIndex + 1);
              if (info.offset.x > 60) show(activeIndex - 1);
            }}
          >
            <img
              src={slide.image}
              alt={slide.title || slide.eyebrow || `VIP Number World promotion ${activeIndex + 1}`}
              className="absolute inset-0 h-full w-full select-none object-cover"
              draggable={false}
              loading={activeIndex === 0 ? 'eager' : 'lazy'}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/30 via-transparent to-stone-950/10" aria-hidden="true" />

            {hasCopy && (
              <div
                className="home-carousel__copy absolute z-10"
                style={{
                  '--carousel-content-x': `${contentX}%`,
                  '--carousel-content-y': `${contentY}%`,
                } as CSSProperties}
              >
                <div className="rounded-[1.35rem] border border-border bg-card/90 p-4 text-foreground shadow-xl backdrop-blur-xl sm:p-5 lg:p-6">
                  {slide.eyebrow && <p className="mb-2 truncate text-[10px] font-black uppercase tracking-[0.18em] text-primary sm:text-xs">{slide.eyebrow}</p>}
                  {slide.title && <h2 className="line-clamp-3 font-serif text-2xl font-bold leading-[1.05] sm:text-3xl lg:text-[2.65rem]">{slide.title}</h2>}
                  {slide.subtitle && <p className="mt-2 line-clamp-3 max-w-xl text-sm font-semibold leading-5 text-muted-foreground sm:text-base sm:leading-6">{slide.subtitle}</p>}
                  {cta && <div className="pointer-events-auto mt-4">{cta}</div>}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {usableSlides.length > 1 && (
          <>
            <button type="button" onClick={() => show(activeIndex - 1)} aria-label="Show previous promotion" className="absolute left-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 text-foreground shadow-lg backdrop-blur transition hover:scale-105 hover:bg-accent sm:left-4 sm:h-12 sm:w-12"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => show(activeIndex + 1)} aria-label="Show next promotion" className="absolute right-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 text-foreground shadow-lg backdrop-blur transition hover:scale-105 hover:bg-accent sm:right-4 sm:h-12 sm:w-12"><ChevronRight className="h-5 w-5" /></button>

            <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-white/55 bg-stone-950/55 p-1.5 pl-3 text-xs font-black text-white shadow-lg backdrop-blur-md sm:right-5 sm:top-5">
              <span aria-live="polite">{activeIndex + 1} / {usableSlides.length}</span>
              <button type="button" onClick={() => setManualPause((current) => !current)} aria-label={manualPause ? 'Resume carousel autoplay' : 'Pause carousel autoplay'} className="grid h-8 w-8 place-items-center rounded-full text-white transition hover:bg-white/15">
                {manualPause ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
            </div>

            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/50 bg-stone-950/45 px-3 py-2 shadow-lg backdrop-blur-md sm:bottom-5" aria-label={`Slide ${activeIndex + 1} of ${usableSlides.length}`}>
              {usableSlides.map((item, index) => (
                <button
                  key={item.banner_id}
                  type="button"
                  onClick={() => show(index)}
                  aria-label={`Show promotion ${index + 1}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-7 bg-amber-300' : 'w-2 bg-white/65 hover:bg-white'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default HomeCarousel;
