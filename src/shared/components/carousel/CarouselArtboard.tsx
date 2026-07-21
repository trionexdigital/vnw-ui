import { useEffect, useMemo, useRef, useState } from 'react';
import { runningAnimations, StaticCanvas, util, type FabricObject } from 'fabric';
import type { CarouselDocument, CarouselFabricObject } from '@/core/carousel/types';

function withAssetUrls(document: CarouselDocument, assetUrls: Map<number, string>) {
  const json = structuredClone(document.fabric) as { objects: CarouselFabricObject[]; [key: string]: unknown };
  const visit = (objects: CarouselFabricObject[]) => objects.forEach((object) => {
    const id = Number(object.vnwAssetId || 0);
    if (id && assetUrls.has(id)) object.src = assetUrls.get(id);
    if (Array.isArray(object.objects)) visit(object.objects);
  });
  visit(json.objects);
  return json;
}

export function collectCarouselAssetIds(document: CarouselDocument) {
  const ids = new Set<number>();
  const visit = (objects: CarouselFabricObject[]) => objects.forEach((object) => {
    const id = Number(object.vnwAssetId || 0);
    if (id) ids.add(id);
    if (Array.isArray(object.objects)) visit(object.objects);
  });
  visit(document.fabric.objects);
  return Array.from(ids);
}

function easing(name: string) {
  const choices = util.ease as unknown as Record<string, (t: number, b: number, c: number, d: number) => number>;
  return choices[name] || choices.easeOutCubic;
}

function animateObject(canvas: StaticCanvas, object: FabricObject, activeRef: React.MutableRefObject<boolean>, runRef: React.MutableRefObject<number>, runId: number) {
  const meta = object as FabricObject & Record<string, any>;
  const entrance = String(meta.vnwEntrance || 'none');
  const loop = String(meta.vnwLoop || 'none');
  const duration = Math.max(150, Math.min(5000, Number(meta.vnwDuration) || 650));
  const delay = Math.max(0, Math.min(10000, Number(meta.vnwDelay) || 0));
  const final = meta.__vnwFinal || { opacity: Number(object.opacity ?? 1), left: Number(object.left || 0), top: Number(object.top || 0), scaleX: Number(object.scaleX || 1), scaleY: Number(object.scaleY || 1), angle: Number(object.angle || 0) };
  meta.__vnwFinal = final;
  const isActive = () => activeRef.current && runRef.current === runId;
  if (entrance === 'fade') object.set({ opacity: 0 });
  if (entrance === 'slide-up') object.set({ opacity: 0, top: final.top + 80 });
  if (entrance === 'slide-left') object.set({ opacity: 0, left: final.left + 100 });
  if (entrance === 'zoom') object.set({ opacity: 0, scaleX: final.scaleX * 0.72, scaleY: final.scaleY * 0.72 });
  if (entrance === 'bounce') object.set({ opacity: 0, top: final.top + 130 });

  const render = () => isActive() && canvas.requestRenderAll();
  const startLoop = () => {
    if (!isActive() || loop === 'none') return;
    const cycle = () => {
      if (!isActive()) return;
      const target: Record<string, number> = {};
      if (loop === 'float') target.top = final.top - 18;
      if (loop === 'pulse') { target.scaleX = final.scaleX * 1.04; target.scaleY = final.scaleY * 1.04; }
      if (loop === 'spin') target.angle = final.angle + 360;
      (object as any).animate(target, {
        duration: loop === 'spin' ? 7000 : 1800,
        easing: easing('easeInOutSine'), onChange: render,
        onComplete: () => {
          if (!isActive()) return;
          (object as any).animate(final, { duration: loop === 'spin' ? 0 : 1800, easing: easing('easeInOutSine'), onChange: render, onComplete: cycle });
        },
      });
    };
    cycle();
  };

  window.setTimeout(() => {
    if (!isActive()) return;
    if (entrance === 'none') { startLoop(); return; }
    (object as any).animate(final, { duration, easing: easing(String(meta.vnwEasing || 'easeOutCubic')), onChange: render, onComplete: startLoop });
  }, delay);
}

type Hotspot = { id: string; href: string; label: string; left: number; top: number; width: number; height: number };

function documentHotspots(document: CarouselDocument): Hotspot[] {
  const result: Hotspot[] = [];
  const visit = (objects: CarouselFabricObject[]) => objects.forEach((object) => {
    const href = String(object.vnwLink || '').trim();
    if (href) result.push({
      id: String(object.vnwId), href, label: String(object.vnwAriaLabel || 'Open carousel link'),
      left: Number(object.left || 0), top: Number(object.top || 0),
      width: Number(object.width || 0) * Number(object.scaleX || 1),
      height: Number(object.height || 0) * Number(object.scaleY || 1),
    });
    if (Array.isArray(object.objects)) visit(object.objects);
  });
  visit(document.fabric.objects);
  return result;
}

export async function renderCarouselPreviewBlob(document: CarouselDocument, assetUrls: Map<number, string>) {
  const element = window.document.createElement('canvas');
  const canvas = new StaticCanvas(element, { width: document.artboard.width, height: document.artboard.height, renderOnAddRemove: false });
  await canvas.loadFromJSON(withAssetUrls(document, assetUrls));
  canvas.requestRenderAll();
  const targetWidth = document.artboard.width > document.artboard.height ? 960 : 480;
  const dataUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.86, multiplier: targetWidth / document.artboard.width });
  canvas.dispose();
  return fetch(dataUrl).then((response) => response.blob());
}

export default function CarouselArtboard({
  document, assetUrls, previewUrl, active = true, reducedMotion = false, className = '', onReady,
}: {
  document: CarouselDocument;
  assetUrls: Map<number, string>;
  previewUrl?: string;
  active?: boolean;
  reducedMotion?: boolean;
  className?: string;
  onReady?: () => void;
}) {
  const canvasElement = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<StaticCanvas | null>(null);
  const activeRef = useRef(active);
  const animationRunRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const host = useRef<HTMLDivElement | null>(null);
  const hotspots = useMemo(() => documentHotspots(document), [document]);

  useEffect(() => {
    activeRef.current = active && visible && !reducedMotion;
    animationRunRef.current += 1;
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    runningAnimations.cancelByCanvas(canvas);
    canvas.getObjects().forEach((object: any) => { if (object.__vnwFinal) object.set(object.__vnwFinal); });
    canvas.requestRenderAll();
    if (!activeRef.current) return;
    const runId = animationRunRef.current;
    canvas.getObjects().forEach((object) => animateObject(canvas, object, activeRef, animationRunRef, runId));
  }, [active, ready, reducedMotion, visible]);

  useEffect(() => {
    const node = host.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion || !canvasElement.current) { setReady(false); return; }
    let cancelled = false;
    setReady(false);
    const canvas = new StaticCanvas(canvasElement.current, {
      width: document.artboard.width, height: document.artboard.height,
      renderOnAddRemove: false, selection: false,
    });
    // Fabric owns the bitmap resolution; CSS owns the responsive presentation.
    // Keeping these separate guarantees a complete, uniformly scaled artboard.
    canvasElement.current.style.setProperty('width', '100%', 'important');
    canvasElement.current.style.setProperty('height', '100%', 'important');
    canvasRef.current = canvas;
    canvas.loadFromJSON(withAssetUrls(document, assetUrls)).then(() => {
      if (cancelled) return;
      canvas.getObjects().forEach((object) => {
        object.set({ selectable: false, evented: false });
      });
      canvas.requestRenderAll();
      setReady(true);
      onReady?.();
    }).catch(() => setReady(false));
    return () => { cancelled = true; activeRef.current = false; animationRunRef.current += 1; runningAnimations.cancelByCanvas(canvas); canvas.dispose(); canvasRef.current = null; };
  }, [assetUrls, document, onReady, reducedMotion]);

  return (
    <div ref={host} data-carousel-artboard={`${document.artboard.width}x${document.artboard.height}`} className={`relative h-full w-full overflow-hidden ${className}`} style={{ aspectRatio: `${document.artboard.width}/${document.artboard.height}` }}>
      {previewUrl && <img src={previewUrl} alt="" className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${ready && !reducedMotion ? 'opacity-0' : 'opacity-100'}`} />}
      {!reducedMotion && (
        <canvas ref={canvasElement} className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`} />
      )}
      {hotspots.map((hotspot) => (
        <a
          key={hotspot.id}
          href={hotspot.href}
          target={hotspot.href.startsWith('/') ? undefined : '_blank'}
          rel={hotspot.href.startsWith('/') ? undefined : 'noreferrer'}
          aria-label={hotspot.label}
          className="absolute z-10 rounded-md outline-none focus-visible:ring-4 focus-visible:ring-white/80"
          style={{
            left: `${hotspot.left / document.artboard.width * 100}%`,
            top: `${hotspot.top / document.artboard.height * 100}%`,
            width: `${hotspot.width / document.artboard.width * 100}%`,
            height: `${hotspot.height / document.artboard.height * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
