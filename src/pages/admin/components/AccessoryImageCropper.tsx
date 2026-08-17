import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper, { type Area } from 'react-easy-crop';
import { Check, Crop, X } from 'lucide-react';

const OUTPUT_SIZE = 1200;

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This image could not be opened.'));
    image.src = source;
  });
}

export async function createSquareProductImage(file: File, source: string, crop: Area) {
  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image cropping is not supported in this browser.');
  canvas.width = OUTPUT_SIZE; canvas.height = OUTPUT_SIZE;
  context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('The cropped image could not be created.')), 'image/jpeg', .92));
  const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').slice(0, 120) || 'product';
  return new File([blob], `${baseName}-square.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

export default function AccessoryImageCropper({ files, onCancel, onComplete }: { files: File[]; onCancel: () => void; onComplete: (files: File[]) => void | Promise<void> }) {
  const [index, setIndex] = useState(0);
  const [source, setSource] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);
  const [processed, setProcessed] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = files[index];

  useEffect(() => {
    if (!current) return;
    const url = URL.createObjectURL(current); setSource(url); setCrop({ x: 0, y: 0 }); setZoom(1); setPixelCrop(null); setError('');
    return () => URL.revokeObjectURL(url);
  }, [current]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);
  }, [busy, onCancel]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => setPixelCrop(pixels), []);
  const confirm = async () => {
    if (!current || !source || !pixelCrop) return;
    setBusy(true); setError('');
    try {
      const nextFile = await createSquareProductImage(current, source, pixelCrop);
      const next = [...processed, nextFile];
      if (index === files.length - 1) await onComplete(next);
      else { setProcessed(next); setIndex((value) => value + 1); setBusy(false); }
    } catch (reason: any) { setError(reason?.message || 'Could not crop this image.'); setBusy(false); }
  };

  if (!files.length || !current) return null;
  return createPortal(<div className="fixed inset-0 z-[80] grid place-items-center p-3 sm:p-6" data-testid="accessory-crop-dialog">
    <button type="button" aria-label="Cancel image cropping" className="absolute inset-0 bg-[var(--vnw-overlay)] backdrop-blur-md" onClick={() => !busy && onCancel()} />
    <section role="dialog" aria-modal="true" aria-labelledby="accessory-crop-title" className="relative w-full max-w-3xl overflow-hidden rounded-[1.6rem] border border-primary/20 bg-card shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div><div className="flex items-center gap-2 text-primary"><Crop className="h-5 w-5"/><span className="text-xs font-black uppercase tracking-[.16em]">Fixed product frame</span></div><h2 id="accessory-crop-title" className="mt-1 text-xl font-black text-foreground">Crop image {index + 1} of {files.length}</h2><p className="mt-1 max-w-xl text-xs text-muted-foreground">Position the product inside the square. Every image is saved at 1200 × 1200 for consistent cards and galleries.</p></div>
        <button type="button" onClick={onCancel} disabled={busy} aria-label="Close crop dialog" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="h-5 w-5"/></button>
      </header>
      <div className="p-4 sm:p-5">
        <div className="relative mx-auto aspect-square w-full max-w-[470px] overflow-hidden rounded-2xl bg-[#17130f]"><Cropper image={source} crop={crop} zoom={zoom} aspect={1} cropShape="rect" showGrid onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete}/></div>
        <div className="mx-auto mt-4 max-w-[470px]"><div className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate font-bold text-foreground">{current.name}</span><span className="shrink-0 text-muted-foreground">Square 1:1</span></div><label className="mt-3 flex items-center gap-3 text-xs font-bold text-muted-foreground">Zoom<input aria-label="Image zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-full accent-primary"/></label>{error&&<p role="alert" className="mt-3 rounded-xl bg-destructive/10 p-3 text-xs font-bold text-destructive">{error}</p>}</div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-4"><span className="text-xs font-semibold text-muted-foreground">{index + 1} / {files.length} · Drag to reposition</span><div className="flex gap-2"><button type="button" onClick={onCancel} disabled={busy} className="btn-gold-outline min-h-11">Cancel</button><button type="button" onClick={confirm} disabled={busy||!pixelCrop} className="btn-gold min-h-11"><Check className="h-4 w-4"/>{busy?'Preparing…':index===files.length-1?'Crop and upload':'Use crop & continue'}</button></div></footer>
    </section>
  </div>, document.body);
}
