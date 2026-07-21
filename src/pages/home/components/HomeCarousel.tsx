import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import type { CarouselDevice, PublishedCarouselSlide } from '@/core/carousel/types';
import { carouselAPI } from '@/core/api/vnwAPI';
import CarouselArtboard, { collectCarouselAssetIds } from '@/shared/components/carousel/CarouselArtboard';
import { AnimatePresence } from 'framer-motion';
import { motion, useReducedMotion } from '@/shared/motion/MotionPrimitives';

function useMobileArtboard() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile;
}

function useSlideResources(slide: PublishedCarouselSlide | undefined, device: CarouselDevice) {
  const [assetUrls, setAssetUrls] = useState<Map<number, string>>(new Map());
  const [previewUrl, setPreviewUrl] = useState('');
  useEffect(() => {
    if (!slide) { setAssetUrls(new Map()); setPreviewUrl(''); return; }
    let cancelled = false;
    const urls: string[] = [];
    const document = device === 'mobile' ? slide.published_mobile : slide.published_desktop;
    const previewId = device === 'mobile' ? slide.published_mobile_preview_id : slide.published_desktop_preview_id;
    Promise.all([
      Promise.all(collectCarouselAssetIds(document).map(async (assetId) => {
        const blob = await carouselAPI.assetBlob(assetId); const url = URL.createObjectURL(blob); urls.push(url); return [assetId, url] as const;
      })),
      carouselAPI.previewBlob(previewId).then((blob) => { const url = URL.createObjectURL(blob); urls.push(url); return url; }),
    ]).then(([assets, preview]) => {
      if (cancelled) return;
      setAssetUrls(new Map(assets)); setPreviewUrl(preview);
    }).catch(() => { if (!cancelled) { setAssetUrls(new Map()); setPreviewUrl(''); } });
    return () => { cancelled = true; urls.forEach((url) => URL.revokeObjectURL?.(url)); };
  }, [device, slide]);
  return { assetUrls, previewUrl };
}

const transitionVariants = {
  fade: { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } },
  slide: { enter: { opacity: 0, x: 80 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -80 } },
  zoom: { enter: { opacity: 0, scale: 0.94 }, center: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.03 } },
  flip: { enter: { opacity: 0, rotateY: 7 }, center: { opacity: 1, rotateY: 0 }, exit: { opacity: 0, rotateY: -7 } },
};

export function HomeCarousel({ slides, loading = false }: { slides: PublishedCarouselSlide[]; loading?: boolean }) {
  const reduceMotion = useReducedMotion();
  const mobile = useMobileArtboard();
  const device: CarouselDevice = mobile ? 'mobile' : 'desktop';
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualPause, setManualPause] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [inView, setInView] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const usableSlides = useMemo(() => slides.filter((slide) => slide.published_desktop && slide.published_mobile), [slides]);
  const slide = usableSlides[activeIndex];
  const { assetUrls, previewUrl } = useSlideResources(slide, device);

  useEffect(() => { if (activeIndex >= usableSlides.length) setActiveIndex(0); }, [activeIndex, usableSlides.length]);
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(node); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (reduceMotion || manualPause || interacting || !inView || usableSlides.length <= 1 || !slide) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % usableSlides.length), Math.max(3, Number(slide.autoplay_seconds || 6)) * 1000);
    return () => window.clearInterval(timer);
  }, [inView, interacting, manualPause, reduceMotion, slide, usableSlides.length]);

  if (loading) return <section aria-label="Loading homepage carousel" className="bg-background px-3 py-6 sm:px-6"><div className="mx-auto aspect-video max-w-7xl animate-pulse rounded-[2rem] bg-muted" /></section>;
  if (!usableSlides.length || !slide) return null;

  const show = (index: number) => setActiveIndex(((index % usableSlides.length) + usableSlides.length) % usableSlides.length);
  const document = device === 'mobile' ? slide.published_mobile : slide.published_desktop;
  const transition = transitionVariants[slide.transition_style] || transitionVariants.fade;

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Featured VIP number stories"
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === 'ArrowLeft') show(activeIndex - 1); if (event.key === 'ArrowRight') show(activeIndex + 1); if (event.key === ' ') { event.preventDefault(); setManualPause((value) => !value); } }}
      onPointerEnter={() => setInteracting(true)}
      onPointerLeave={() => setInteracting(false)}
      onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => { if (touchStart == null) return; const delta = event.changedTouches[0]?.clientX - touchStart; if (Math.abs(delta) > 45) show(activeIndex + (delta < 0 ? 1 : -1)); setTouchStart(null); }}
      className="home-carousel relative overflow-hidden bg-background px-3 py-7 outline-none sm:px-6 sm:py-10 lg:px-8"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
      <div className={`relative mx-auto ${mobile ? 'max-w-[430px]' : 'max-w-7xl'}`}>
        <div className="mb-3 flex items-center justify-between px-2 sm:mb-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-primary"><Sparkles className="h-4 w-4" />Featured stories</div>
          <button onClick={() => setManualPause((value) => !value)} className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card/90 px-3 text-xs font-bold text-foreground shadow-sm backdrop-blur hover:bg-accent" aria-label={manualPause ? 'Play carousel' : 'Pause carousel'}>{manualPause ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}{manualPause ? 'Play' : 'Pause'}</button>
        </div>

        <div className="group relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card p-1.5 shadow-[0_24px_80px_rgba(30,18,5,.18)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_34px_100px_rgba(30,18,5,.24)] sm:rounded-[2.25rem] sm:p-2.5">
          <div className="absolute inset-8 rounded-full bg-primary/15 blur-3xl transition-opacity group-hover:opacity-80" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${slide.carousel_id}-${device}`}
              variants={transition}
              initial={reduceMotion ? 'center' : 'enter'}
              animate="center"
              exit={reduceMotion ? 'center' : 'exit'}
              transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[1.35rem] bg-black sm:rounded-[1.8rem]"
              style={{ aspectRatio: `${document.artboard.width}/${document.artboard.height}` }}
              aria-roledescription="slide"
              aria-label={`${activeIndex + 1} of ${usableSlides.length}: ${slide.name}`}
            >
              <CarouselArtboard document={document} assetUrls={assetUrls} previewUrl={previewUrl} active={inView && !manualPause && !interacting} reducedMotion={Boolean(reduceMotion)} />
            </motion.div>
          </AnimatePresence>

          {usableSlides.length > 1 && <>
            <button onClick={() => show(activeIndex - 1)} className="absolute left-4 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/45 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black/65 sm:left-6 sm:h-12 sm:w-12" aria-label="Previous slide"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => show(activeIndex + 1)} className="absolute right-4 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/45 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black/65 sm:right-6 sm:h-12 sm:w-12" aria-label="Next slide"><ChevronRight className="h-5 w-5" /></button>
          </>}
        </div>

        {usableSlides.length > 1 && <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Choose a carousel slide">{usableSlides.map((item, index) => <button key={item.carousel_id} onClick={() => show(index)} role="tab" aria-selected={index === activeIndex} aria-label={`Show slide ${index + 1}: ${item.name}`} className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-primary' : 'w-2.5 bg-muted-foreground/35 hover:bg-muted-foreground/60'}`} />)}</div>}
        <div className="sr-only" aria-live="polite">Slide {activeIndex + 1} of {usableSlides.length}: {slide.name}</div>
      </div>
    </section>
  );
}

export default HomeCarousel;
