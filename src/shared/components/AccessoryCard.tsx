import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, PackageCheck, ShoppingCart, Truck } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { accessoryImageUrl, cartAPI, type AccessoryImage, type AccessoryProduct } from '@/core/api/vnwAPI';
import { formatINR } from '@/core/lib/format';
import { localService } from '@/core/services/local';
import { useStore } from '@/shared/store/useStore';
import { useToast } from '@/shared/hooks/use-toast';

type Props = { product: AccessoryProduct; showcase?: boolean };

export default function AccessoryCard({ product, showcase = false }: Props) {
  const navigate = useNavigate();
  const { refreshCounts } = useStore();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const images = useMemo<AccessoryImage[]>(() => {
    const ordered = [...(product.images || [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
    if (ordered.length) return ordered;
    return product.primary_image_id ? [{ image_id: product.primary_image_id, accessory_id: product.accessory_id, sort_order: 0, is_primary: true }] : [];
  }, [product.accessory_id, product.images, product.primary_image_id]);
  const hasCarousel = showcase && images.length > 1;
  const activeImage = images[activeIndex] || images[0];

  useEffect(() => { setActiveIndex(0); }, [product.accessory_id, images.length]);
  useEffect(() => {
    if (!hasCarousel || paused || reduceMotion) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % images.length), 3400);
    return () => window.clearInterval(timer);
  }, [hasCarousel, images.length, paused, reduceMotion]);

  const moveImage = (direction: number) => setActiveIndex((index) => (index + direction + images.length) % images.length);
  const add = async () => {
    if (!localService.getToken()) return navigate(`/login?next=${encodeURIComponent('/accessories/' + product.slug)}`);
    try { await cartAPI.addAccessory(product.accessory_id); await refreshCounts(); toast({ title: 'Added to cart' }); }
    catch (e: any) { toast({ title: 'Could not add product', description: e.message, variant: 'destructive' }); }
  };

  return (
    <motion.article
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-border/90 bg-card shadow-[0_12px_34px_-28px_rgba(71,39,8,.55)] transition-[border-color,box-shadow] duration-300 focus-within:border-primary/60 focus-within:shadow-xl hover:border-primary/50 hover:shadow-[0_24px_46px_-30px_rgba(71,39,8,.55)]"
      whileHover={reduceMotion ? undefined : { y: -5 }}
      whileTap={reduceMotion ? undefined : { scale: 0.995 }}
      transition={{ type: 'spring', stiffness: 280, damping: 25, mass: 0.75 }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}
    >
      <div className="relative h-48 overflow-hidden bg-[radial-gradient(circle_at_50%_35%,hsl(var(--card)),hsl(var(--muted)))] sm:h-52">
        <Link to={`/accessories/${product.slug}`} className="absolute inset-0 block overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary" aria-label="Open product gallery">
          {activeImage ? (
            <AnimatePresence initial={false} mode="popLayout">
              <motion.img
                key={activeImage.image_id}
                src={accessoryImageUrl(activeImage.image_id)}
                alt={activeImage.alt_text || `${product.name} image ${activeIndex + 1}`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain p-3.5 transition-transform duration-500 group-hover:scale-[1.025]"
                initial={reduceMotion ? false : { opacity: 0, x: 18, scale: 1.035 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -18, scale: 0.985 }}
                transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
              />
            </AnimatePresence>
          ) : <span className="grid h-full place-items-center"><PackageCheck className="h-16 w-16 text-primary/40" /></span>}
        </Link>

        {hasCarousel && <>
          <button type="button" onClick={() => moveImage(-1)} aria-label={`Previous image of ${product.name}`} className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-background/90 text-foreground opacity-100 shadow-lg backdrop-blur transition sm:opacity-0 sm:group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => moveImage(1)} aria-label={`Next image of ${product.name}`} className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-background/90 text-foreground opacity-100 shadow-lg backdrop-blur transition sm:opacity-0 sm:group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ChevronRight className="h-5 w-5" /></button>
          <div className="absolute inset-x-3 bottom-2 z-10 flex min-h-6 items-center justify-center gap-1 rounded-full bg-background/85 px-2 shadow-sm backdrop-blur">
            {images.map((image, index) => <button key={image.image_id} type="button" onClick={() => setActiveIndex(index)} aria-label={`Show image ${index + 1} of ${product.name}`} aria-current={index === activeIndex ? 'true' : undefined} className="grid h-6 w-6 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className={`block h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/45'}`} /></button>)}
          </div>
        </>}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-center justify-between gap-2"><div className="min-w-0 truncate text-[10px] font-black uppercase tracking-[.12em] text-primary">{product.brand}{product.model ? ` · ${product.model}` : ''}</div><span className="shrink-0 rounded-full bg-success/10 px-2 py-1 text-[9px] font-black uppercase text-success">In stock</span></div>
        <Link to={`/accessories/${product.slug}`} className="mt-1.5 line-clamp-2 min-h-10 text-[15px] font-black leading-5 text-foreground transition-colors hover:text-primary focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{product.name}</Link>
        <div className="mt-2.5 flex flex-wrap items-baseline gap-1.5"><b className="text-xl text-foreground">{formatINR(product.offer_price)}</b>{product.mrp > product.offer_price && <><span className="text-[11px] text-muted-foreground line-through">{formatINR(product.mrp)}</span><span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-black text-success">{product.discount_pct}% off</span></>}</div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground"><Truck className="h-3.5 w-3.5 text-primary"/>Free delivery across India</div>
        <button onClick={add} className="btn-gold mt-3 min-h-11 w-full"><ShoppingCart className="h-4 w-4" /> Add to cart</button>
      </div>
    </motion.article>
  );
}
