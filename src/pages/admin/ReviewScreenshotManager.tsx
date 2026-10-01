import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Trash2, Upload } from 'lucide-react';
import { reviewScreenshotsAPI, type ReviewScreenshot } from '@/core/api/vnwAPI';
import { useToast } from '@/shared/hooks/use-toast';

export default function ReviewScreenshotManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<ReviewScreenshot[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('Google review screenshot');
  const [busy, setBusy] = useState(false);
  const load = () => reviewScreenshotsAPI.adminList().then(setItems).catch((error) => toast({ title: 'Could not load review screenshots', description: error.message, variant: 'destructive' }));
  useEffect(() => { void load(); }, []);
  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file); const width = bitmap.width; const height = bitmap.height; bitmap.close();
      if (width / height < 1.2 || width / height > 2.5) throw new Error('Choose a landscape image (roughly 16:10).');
      await reviewScreenshotsAPI.upload(file, alt, width, height); setFile(null); await load(); toast({ title: 'Review screenshot added' });
    } catch (error: any) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const move = async (index: number, delta: number) => {
    const target = index + delta; if (target < 0 || target >= items.length) return;
    const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; setItems(next);
    try { await reviewScreenshotsAPI.reorder(next.map((item) => item.screenshot_id)); }
    catch (error: any) { toast({ title: 'Could not reorder', description: error.message, variant: 'destructive' }); await load(); }
  };
  const toggle = async (item: ReviewScreenshot) => { try { await reviewScreenshotsAPI.save(item.screenshot_id, item.alt_text, !item.is_active); await load(); } catch (error: any) { toast({ title: 'Could not update screenshot', description: error.message, variant: 'destructive' }); } };
  const remove = async (item: ReviewScreenshot) => { if (!window.confirm('Delete this review screenshot?')) return; try { await reviewScreenshotsAPI.remove(item.screenshot_id); await load(); } catch (error: any) { toast({ title: 'Could not delete screenshot', description: error.message, variant: 'destructive' }); } };
  return <section className="mb-5 rounded-2xl border border-border bg-card p-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-black">Google review screenshots</h2><p className="text-xs text-muted-foreground">Landscape images appear in the scrolling home-page review section.</p></div><div className="flex flex-wrap items-center gap-2"><input aria-label="Review screenshot description" value={alt} onChange={(event) => setAlt(event.target.value)} className="h-9 rounded-lg border border-border px-2 text-sm" /><input aria-label="Review screenshot image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} className="max-w-48 text-xs" /><button disabled={!file || busy} onClick={() => void upload()} className="btn-gold text-sm"><Upload className="h-4 w-4" /> Upload</button></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((item, index) => <article key={item.screenshot_id} className="overflow-hidden rounded-xl border border-border">{item.is_active ? <img src={reviewScreenshotsAPI.imageUrl(item.screenshot_id)} alt={item.alt_text} className="aspect-[16/10] w-full object-cover" /> : <div className="flex aspect-[16/10] items-center justify-center bg-muted px-3 text-center text-xs text-muted-foreground">Hidden from the home page</div>}<div className="flex items-center justify-between gap-1 p-2 text-xs"><span className="truncate font-bold">{item.alt_text}</span><div className="flex gap-1"><button title={item.is_active ? 'Hide from home' : 'Show on home'} onClick={() => void toggle(item)} className="rounded border border-border px-2">{item.is_active ? 'Live' : 'Hidden'}</button><button title="Move earlier" aria-label="Move earlier" disabled={index === 0} onClick={() => void move(index, -1)}><ArrowUp className="h-4 w-4" /></button><button title="Move later" aria-label="Move later" disabled={index === items.length - 1} onClick={() => void move(index, 1)}><ArrowDown className="h-4 w-4" /></button><button title="Delete" aria-label="Delete review screenshot" onClick={() => void remove(item)}><Trash2 className="h-4 w-4" /></button></div></div></article>)}</div></section>;
}
