import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { reviewScreenshotsAPI, type ReviewScreenshot } from '@/core/api/vnwAPI';

export default function ReviewScreenshots() {
  const [items, setItems] = useState<ReviewScreenshot[]>([]);
  const rail = useRef<HTMLDivElement>(null);
  useEffect(() => { reviewScreenshotsAPI.list().then(setItems).catch(() => setItems([])); }, []);
  if (!items.length) return null;
  const move = (direction: number) => rail.current?.scrollBy({ left: direction * (rail.current.clientWidth * .8), behavior: 'smooth' });
  return <section className="bg-background px-4 py-5 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-black sm:text-2xl">Reviews from our customers</h2><div className="flex gap-2"><button aria-label="Scroll reviews left" onClick={() => move(-1)} className="grid h-9 w-9 place-items-center rounded-lg border border-border"><ChevronLeft className="h-4 w-4" /></button><button aria-label="Scroll reviews right" onClick={() => move(1)} className="grid h-9 w-9 place-items-center rounded-lg border border-border"><ChevronRight className="h-4 w-4" /></button></div></div><div ref={rail} role="region" aria-label="Customer review screenshots" tabIndex={0} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{items.map((item) => <div key={item.screenshot_id} className="w-[88vw] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card sm:w-[calc(25%_-_9px)] xl:w-[calc(20%_-_9.6px)]"><img src={reviewScreenshotsAPI.imageUrl(item.screenshot_id)} alt={item.alt_text} className="aspect-[16/10] w-full object-cover" loading="lazy" /></div>)}</div></div></section>;
}
