import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown, ArrowUp, Copy, Eye, EyeOff, GripVertical, Image as ImageIcon,
  Monitor, Pencil, Plus, RefreshCw, Smartphone, Sparkles, Trash2,
} from 'lucide-react';
import { adminCarouselAPI } from '@/core/api/vnwAPI';
import type { CarouselProjectSummary } from '@/core/carousel/types';

function PreviewImage({ assetId, label }: { assetId?: number | null; label: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!assetId) { setUrl(''); return; }
    let current = ''; let cancelled = false;
    adminCarouselAPI.assetBlob(assetId).then((blob) => {
      if (cancelled) return;
      current = URL.createObjectURL(blob); setUrl(current);
    }).catch(() => setUrl(''));
    return () => { cancelled = true; if (current) URL.revokeObjectURL(current); };
  }, [assetId]);
  return (
    <div className="relative grid min-h-24 flex-1 place-items-center overflow-hidden rounded-xl border border-border bg-muted/45">
      {url ? <img src={url} alt={label} className="h-full w-full object-contain" /> : <div className="flex flex-col items-center gap-2 text-xs font-semibold text-muted-foreground"><ImageIcon className="h-5 w-5" />Preview after save</div>}
      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/65 px-2 py-1 text-[10px] font-bold text-white">{label}</span>
    </div>
  );
}
export default function AdminBanners() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CarouselProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState<number | null>(null);

  const load = async () => {
    setLoading(true); setError('');
    try { setItems(await adminCarouselAPI.list()); }
    catch (reason: any) { setError(reason?.message || 'Could not load carousel projects.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const perform = async (id: number, action: () => Promise<unknown>) => {
    setBusy(id); setError('');
    try { await action(); await load(); }
    catch (reason: any) { setError(reason?.message || 'The carousel action failed.'); }
    finally { setBusy(null); }
  };

  const publish = async (item: CarouselProjectSummary) => {
    const response = await adminCarouselAPI.publishRaw(item.carousel_id, item.draft_revision);
    if (response?.status !== 1) throw new Error(response?.info || 'Publish failed. Open the editor and generate both previews first.');
  };

  const move = async (sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;
    const next = [...items];
    const from = next.findIndex((item) => item.carousel_id === sourceId);
    const to = next.findIndex((item) => item.carousel_id === targetId);
    if (from < 0 || to < 0) return;
    const [removed] = next.splice(from, 1); next.splice(to, 0, removed);
    setItems(next); setDragging(null);
    try { await adminCarouselAPI.reorder(next.map((item) => item.carousel_id)); }
    catch (reason: any) { setError(reason?.message || 'Could not save the new order.'); await load(); }
  };

  const moveBy = async (index: number, delta: number) => {
    const target = index + delta; if (target < 0 || target >= items.length) return;
    const next = [...items]; [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try { await adminCarouselAPI.reorder(next.map((item) => item.carousel_id)); }
    catch (reason: any) { setError(reason?.message || 'Could not save the new order.'); await load(); }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-primary">Homepage presentation</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">Carousel Studio</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Build independent desktop and mobile stories, preview the real storefront card, and publish without exposing unfinished autosaves.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground hover:bg-accent"><RefreshCw className="h-4 w-4" />Refresh</button>
          <button onClick={() => navigate('/admin/carousel/new')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110"><Plus className="h-4 w-4" />New carousel</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-semibold text-destructive">{error}</div>}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2"><div className="h-80 animate-pulse rounded-3xl bg-muted" /><div className="h-80 animate-pulse rounded-3xl bg-muted" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-black text-foreground">Your new carousel is empty</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Legacy banner records were intentionally left alone. Start with one of six new templates or a blank Fabric artboard.</p>
          <button onClick={() => navigate('/admin/carousel/new')} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground"><Plus className="h-4 w-4" />Create first carousel</button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((item, index) => {
            const published = Boolean(item.is_published);
            const current = Number(item.published_revision) === Number(item.draft_revision);
            return (
              <article
                key={item.carousel_id}
                draggable
                onDragStart={() => setDragging(item.carousel_id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dragging && void move(dragging, item.carousel_id)}
                className={`rounded-3xl border bg-card p-4 shadow-sm transition ${dragging === item.carousel_id ? 'scale-[.98] border-primary opacity-60' : 'border-border hover:-translate-y-0.5 hover:shadow-lg'}`}
              >
                <div className="mb-4 flex items-start gap-3">
                  <button className="mt-1 cursor-grab text-muted-foreground active:cursor-grabbing" aria-label="Drag to reorder"><GripVertical className="h-5 w-5" /></button>
                  <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-black text-foreground">{item.name}</h2><div className="mt-1 flex flex-wrap items-center gap-2 text-xs"><span className={`rounded-full px-2 py-1 font-bold ${published ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>{published ? 'Published' : 'Draft'}</span>{published && !current && <span className="rounded-full bg-amber-500/12 px-2 py-1 font-bold text-amber-700 dark:text-amber-300">Unpublished changes</span>}<span className="text-muted-foreground">Revision {item.draft_revision}</span></div></div>
                  <div className="flex gap-1"><button disabled={index === 0} onClick={() => void moveBy(index, -1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-accent disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button disabled={index === items.length - 1} onClick={() => void moveBy(index, 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-accent disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button></div>
                </div>
                <div className="mb-4 flex h-44 gap-3">
                  <PreviewImage assetId={item.draft_desktop_preview_id || item.published_desktop_preview_id} label="Desktop" />
                  <div className="w-24"><PreviewImage assetId={item.draft_mobile_preview_id || item.published_mobile_preview_id} label="Mobile" /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => navigate(`/admin/carousel/${item.carousel_id}/edit`)} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground"><Pencil className="h-4 w-4" />Edit</button>
                  <button disabled={busy === item.carousel_id} onClick={() => void perform(item.carousel_id, () => adminCarouselAPI.duplicate(item.carousel_id))} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-bold hover:bg-accent"><Copy className="h-4 w-4" />Duplicate</button>
                  <button disabled={busy === item.carousel_id} onClick={() => void perform(item.carousel_id, () => published ? adminCarouselAPI.unpublish(item.carousel_id) : publish(item))} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-bold hover:bg-accent">{published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{published ? 'Unpublish' : 'Publish'}</button>
                  <button disabled={busy === item.carousel_id} onClick={() => { if (window.confirm(`Delete “${item.name}” and all its stored assets?`)) void perform(item.carousel_id, () => adminCarouselAPI.delete(item.carousel_id)); }} className="grid h-10 w-10 place-items-center rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
