import { useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Crop, X, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';

export async function cropUpload(file: File, area: Area, width: number, height: number) {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d'); if (!context) throw new Error('Image processing is unavailable.');
    context.drawImage(bitmap, area.x, area.y, area.width, area.height, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not crop image.')), 'image/jpeg', .85));
    return new File([blob], 'carousel-cropped.jpg', { type: 'image/jpeg' });
  } finally { bitmap.close(); }
}

export default function ImageCropDialog({ file, width, height, label, onCancel, onApply }: { file: File; width: number; height: number; label: string; onCancel: () => void; onApply: (file: File) => void }) {
  const [url, setUrl] = useState(''); const [crop, setCrop] = useState({ x: 0, y: 0 }); const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
  const apply = async () => { if (!area) return; setBusy(true); try { onApply(await cropUpload(file, area, width, height)); } catch (e: any) { setError(e.message); setBusy(false); } };
  return <Dialog open onOpenChange={open => { if (!open && !busy) onCancel(); }}><DialogContent className="max-w-xl p-4 [&>button:last-child]:hidden">
    <div className="flex items-center justify-between"><DialogTitle className="flex items-center gap-2 text-base"><Crop className="h-4 w-4 text-primary" />Fit {label} image</DialogTitle><button aria-label="Cancel crop" disabled={busy} onClick={onCancel}><X className="h-4 w-4" /></button></div>
    <DialogDescription className="text-xs">Drag to position your image. Adjust zoom to fill the {width} × {height} frame.</DialogDescription>
    <div className="relative h-[min(360px,48svh)] overflow-hidden rounded-xl bg-muted">{url && <Cropper image={url} crop={crop} zoom={zoom} aspect={width / height} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, pixels) => setArea(pixels)} />}</div>
    <label className="flex items-center gap-3 text-xs"><ZoomIn className="h-4 w-4" />Zoom<input aria-label="Crop zoom" className="flex-1 accent-primary" type="range" min={1} max={3} step={.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    <div className="flex justify-end gap-2"><button disabled={busy} onClick={onCancel} className="btn-gold-outline min-h-9 text-xs">Cancel</button><button disabled={!area || busy} onClick={() => void apply()} className="btn-gold min-h-9 text-xs">{busy ? 'Cropping…' : 'Use this crop'}</button></div>
  </DialogContent></Dialog>;
}
