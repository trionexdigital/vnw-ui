import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { CarouselSlide } from '@/core/api/vnwAPI';
import { motion, useReducedMotion } from '@/shared/motion/MotionPrimitives';

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
    }, 6000);
    return () => window.clearInterval(timer);
  }, [interacting, manualPause, reduceMotion, usableSlides.length]);

  if (loading) {
    return (
      <section className="bg-stone-50 px-4 py-5 sm:px-6 lg:px-8" aria-label="Loading homepage carousel">
        <div className="mx-auto aspect-[16/5] w-full max-w-[1700px] animate-pulse rounded-2xl bg-stone-200" />
      </section>
    );
  }

  if (usableSlides.length === 0) return null;

  const show = (index: number) => {
    const count = usableSlides.length;
    setActiveIndex(((index % count) + count) % count);
  };
  const slide = usableSlides[activeIndex];
  const hasCopy = Boolean(slide.title || slide.subtitle || (slide.cta_text && slide.cta_link));
  const isInternalLink = slide.cta_link?.startsWith('/');

  const cta = slide.cta_text && slide.cta_link ? (
    isInternalLink ? (
      <Link to={slide.cta_link} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-stone-950 shadow-lg transition hover:-translate-y-0.5">
        {slide.cta_text}<ArrowRight className="h-4 w-4" />
      </Link>
    ) : (
      <a href={slide.cta_link} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-stone-950 shadow-lg transition hover:-translate-y-0.5">
        {slide.cta_text}<ArrowRight className="h-4 w-4" />
      </a>
    )
  ) : null;

  return (
    <section
      className="bg-stone-50 px-4 py-5 sm:px-6 lg:px-8"
      aria-label="Featured promotions"
      aria-roledescription="carousel"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteracting(false);
      }}
    >
      <div className="relative mx-auto aspect-[16/5] w-full max-w-[1700px] overflow-hidden rounded-2xl border border-amber-200 bg-stone-200 shadow-[0_18px_50px_-30px_rgba(80,48,12,.38)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.banner_id}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
            drag={!reduceMotion && usableSlides.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_event, info) => {
              if (info.offset.x < -60) show(activeIndex + 1);
              if (info.offset.x > 60) show(activeIndex - 1);
            }}
          >
            <img
              src={slide.image}
              alt={slide.title || `VIP Number World promotion ${activeIndex + 1}`}
              className="h-full w-full select-none object-cover"
              draggable={false}
              loading={activeIndex === 0 ? 'eager' : 'lazy'}
            />
            {hasCopy && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-r from-stone-950/72 via-stone-950/22 to-transparent p-4 sm:p-6 lg:p-8">
                <div className="max-w-xl text-white">
                  {slide.title && <h2 className="font-serif text-xl font-bold leading-tight sm:text-3xl lg:text-4xl">{slide.title}</h2>}
                  {slide.subtitle && <p className="mt-2 max-w-lg text-xs font-semibold leading-5 text-white/90 sm:text-base sm:leading-6">{slide.subtitle}</p>}
                  {cta && <div className="mt-3 hidden sm:block">{cta}</div>}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {usableSlides.length > 1 && (
          <>
            <button type="button" onClick={() => show(activeIndex - 1)} aria-label="Show previous promotion" className="absolute left-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/90 text-stone-900 shadow-lg transition hover:bg-white sm:left-4"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => show(activeIndex + 1)} aria-label="Show next promotion" className="absolute right-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/90 text-stone-900 shadow-lg transition hover:bg-white sm:right-4"><ChevronRight className="h-5 w-5" /></button>
            <div className="absolute bottom-2 right-2 z-20 flex items-center gap-2 rounded-full border border-white/70 bg-stone-950/55 px-2 py-1.5 backdrop-blur sm:bottom-4 sm:right-4">
              <button type="button" onClick={() => setManualPause((current) => !current)} aria-label={manualPause ? 'Resume carousel autoplay' : 'Pause carousel autoplay'} className="grid h-8 w-8 place-items-center rounded-full text-white transition hover:bg-white/15">
                {manualPause ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <div className="flex gap-1.5" aria-label={`Slide ${activeIndex + 1} of ${usableSlides.length}`}>
                {usableSlides.map((item, index) => (
                  <button
                    key={item.banner_id}
                    type="button"
                    onClick={() => show(index)}
                    aria-label={`Show promotion ${index + 1}`}
                    aria-current={index === activeIndex ? 'true' : undefined}
                    className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-amber-300' : 'w-2 bg-white/70 hover:bg-white'}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default HomeCarousel;
