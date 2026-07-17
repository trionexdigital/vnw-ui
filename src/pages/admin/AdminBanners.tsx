import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import {
  ArrowRight,
  Check,
  Crop,
  Eye,
  EyeOff,
  ImagePlus,
  Move,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { adminAPI, type CarouselSlide } from '@/core/api/vnwAPI';
import {
  CAROUSEL_ASPECT,
  CAROUSEL_OUTPUT_HEIGHT,
  CAROUSEL_OUTPUT_WIDTH,
  DEFAULT_CAROUSEL_CONTENT_X,
  DEFAULT_CAROUSEL_CONTENT_Y,
  cropCarouselImage,
  normalizeCarouselPosition,
  prepareCarouselSource,
} from '@/core/lib/carouselImage';
import { useToast } from '@/shared/hooks/use-toast';
import { Loader, PageHeader } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';

interface CarouselForm {
  banner_id?: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  cta_text: string;
  cta_link: string;
  content_x: number;
  content_y: number;
  is_active: boolean;
  sort_order: number;
}

const emptyForm: CarouselForm = {
  eyebrow: '',
  title: '',
  subtitle: '',
  image: '',
  cta_text: '',
  cta_link: '',
  content_x: DEFAULT_CAROUSEL_CONTENT_X,
  content_y: DEFAULT_CAROUSEL_CONTENT_Y,
  is_active: true,
  sort_order: 0,
};

const fieldClass = 'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/10';

function toForm(item: CarouselSlide): CarouselForm {
  return {
    banner_id: item.banner_id,
    eyebrow: item.eyebrow || '',
    title: item.title || '',
    subtitle: item.subtitle || '',
    image: item.image || '',
    cta_text: item.cta_text || '',
    cta_link: item.cta_link || '',
    content_x: normalizeCarouselPosition(item.content_x, DEFAULT_CAROUSEL_CONTENT_X),
    content_y: normalizeCarouselPosition(item.content_y, DEFAULT_CAROUSEL_CONTENT_Y),
    is_active: Boolean(item.is_active),
    sort_order: Number(item.sort_order) || 0,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function SlideCompositionPreview({
  form,
  onPositionChange,
}: {
  form: CarouselForm;
  onPositionChange: (x: number, y: number) => void;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const moveCopy = (clientX: number, clientY: number) => {
    const preview = previewRef.current?.getBoundingClientRect();
    const copy = copyRef.current?.getBoundingClientRect();
    if (!preview || !copy) return;
    const halfCopyX = ((copy.width / 2 + 14) / preview.width) * 100;
    const halfCopyY = ((copy.height / 2 + 14) / preview.height) * 100;
    const x = clamp(((clientX - preview.left) / preview.width) * 100, halfCopyX, 100 - halfCopyX);
    const y = clamp(((clientY - preview.top) / preview.height) * 100, halfCopyY, 100 - halfCopyY);
    onPositionChange(Math.round(x), Math.round(y));
  };

  const nudgeCopy = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const amount = event.shiftKey ? 5 : 1;
    const next = { x: form.content_x, y: form.content_y };
    if (event.key === 'ArrowLeft') next.x -= amount;
    else if (event.key === 'ArrowRight') next.x += amount;
    else if (event.key === 'ArrowUp') next.y -= amount;
    else if (event.key === 'ArrowDown') next.y += amount;
    else return;
    event.preventDefault();
    onPositionChange(clamp(next.x, 15, 85), clamp(next.y, 15, 85));
  };

  return (
    <div ref={previewRef} className="relative h-[300px] overflow-hidden rounded-2xl border border-amber-200 bg-stone-900 shadow-inner sm:h-[340px] lg:h-[380px]">
      {form.image ? (
        <>
          <img src={form.image} alt="Carousel composition preview" className="absolute inset-0 h-full w-full select-none object-cover" draggable={false} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/30 via-transparent to-stone-950/10" />
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-stone-800 to-stone-950 text-sm font-bold text-white/60">Upload and crop an image to complete the preview</div>
      )}

      <div
        ref={copyRef}
        role="button"
        tabIndex={0}
        aria-label="Move slide text. Drag it or use the arrow keys."
        className={`absolute z-10 w-[min(29rem,48%)] -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-[1.2rem] border-2 bg-white/92 p-4 text-stone-950 shadow-[0_22px_55px_-24px_rgba(0,0,0,.8)] backdrop-blur-xl outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-400/30 ${dragging ? 'cursor-grabbing border-amber-400' : 'border-white/85'}`}
        style={{ left: `${form.content_x}%`, top: `${form.content_y}%` }}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          moveCopy(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => { if (dragging) moveCopy(event.clientX, event.clientY); }}
        onPointerUp={(event) => {
          setDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={nudgeCopy}
      >
        <span className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full border border-amber-300 bg-amber-100 text-amber-900 shadow-md" aria-hidden="true"><Move className="h-4 w-4" /></span>
        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-amber-800">{form.eyebrow || 'Optional title'}</p>
        <h3 className="mt-1 font-serif text-xl font-bold leading-tight sm:text-2xl">{form.title || 'Your slide heading'}</h3>
        <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-5 text-stone-700 sm:text-sm">{form.subtitle || 'Add a short supporting subheading that stays clear and easy to read.'}</p>
        <span className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-amber-400/70 bg-amber-500 px-3 text-xs font-black text-stone-950 shadow-sm">{form.cta_text || 'Button preview'}<ArrowRight className="h-3.5 w-3.5" /></span>
      </div>

      <div className="absolute bottom-3 left-3 rounded-full border border-white/30 bg-stone-950/60 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">Drag the text card · X {form.content_x}% · Y {form.content_y}%</div>
    </div>
  );
}

export default function AdminBanners() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CarouselForm>(emptyForm);
  const [cropSource, setCropSource] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.bannersList()
      .then((data) => setItems(data || []))
      .catch((error: any) => toast({ title: 'Carousel could not be loaded', description: error?.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof CarouselForm>(key: K, value: CarouselForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetCrop = () => {
    setCropSource('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
  };

  const closeEditor = () => {
    if (saving) return;
    setOpen(false);
    resetCrop();
  };

  const openEditor = (item?: CarouselSlide) => {
    setForm(item ? toForm(item) : { ...emptyForm, sort_order: items.length });
    resetCrop();
    setOpen(true);
  };

  const chooseImage = async (file?: File) => {
    if (!file) return;
    try {
      const source = await prepareCarouselSource(file);
      setCropSource(source);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
    } catch (error: any) {
      toast({ title: 'Image not accepted', description: error?.message, variant: 'destructive' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const applyCrop = async () => {
    if (!cropSource || !croppedArea) return;
    setSaving(true);
    try {
      const image = await cropCarouselImage(cropSource, croppedArea);
      set('image', image);
      resetCrop();
      toast({ title: 'Crop applied', description: `Image normalized to ${CAROUSEL_OUTPUT_WIDTH} × ${CAROUSEL_OUTPUT_HEIGHT}px.` });
    } catch (error: any) {
      toast({ title: 'Crop failed', description: error?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.image) {
      toast({ title: 'Add and crop an image first', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await adminAPI.bannerSave({ ...form, sort_order: Number(form.sort_order) || 0 });
      toast({ title: form.banner_id ? 'Carousel slide updated' : 'Carousel slide added' });
      setOpen(false);
      resetCrop();
      load();
    } catch (error: any) {
      toast({ title: 'Carousel slide could not be saved', description: error?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (bannerId: number) => {
    if (!confirm('Delete this carousel slide permanently?')) return;
    try {
      await adminAPI.bannerDelete(bannerId);
      toast({ title: 'Carousel slide deleted' });
      load();
    } catch (error: any) {
      toast({ title: 'Carousel slide could not be deleted', description: error?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Homepage carousel"
        subtitle="Upload, crop, order, publish, and maintain the promotional images shown directly below the home hero."
        action={(
          <button type="button" onClick={() => openEditor()} className="btn-gold inline-flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" /> Add slide
          </button>
        )}
      />

      <div className="mb-4 rounded-xl border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-warning">
        Every upload is cropped to a fixed <strong>16:5</strong> frame and exported at <strong>1600 × 500px</strong>. The homepage fills the entire responsive carousel with the image, without empty top or bottom bands.
      </div>

      {loading ? <Loader /> : items.length === 0 ? (
        <div className="vnw-card grid min-h-72 place-items-center p-8 text-center">
          <div>
            <ImagePlus className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-4 text-lg font-black text-foreground">No carousel slides yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Add the first cropped image to publish the section below the homepage hero.</p>
            <button type="button" onClick={() => openEditor()} className="btn-gold mt-5 inline-flex items-center gap-2 text-sm"><Plus className="h-4 w-4" /> Add first slide</button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <article key={item.banner_id} className="vnw-card overflow-hidden p-0">
              <div className="relative aspect-[16/5] overflow-hidden bg-muted">
                {item.image ? (
                  <img src={item.image} alt={item.title || 'Carousel slide preview'} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-sm font-bold text-muted-foreground">Image required</div>
                )}
                <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black shadow-sm ${item.is_active ? 'bg-emerald-600 text-white' : 'bg-stone-900/75 text-white'}`}>
                  {item.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {item.is_active ? 'Published' : 'Hidden'}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-stone-800 shadow-sm">Order {item.sort_order}</span>
              </div>
              <div className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-black text-foreground">{item.title || 'Image-only slide'}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.subtitle || 'No supporting copy'}</p>
                  {(item.cta_text || item.cta_link) && <p className="mt-2 truncate text-xs font-bold text-accent">{item.cta_text || 'Open'} → {item.cta_link || 'No link'}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => openEditor(item)} aria-label={`Edit ${item.title || 'carousel slide'}`} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-accent hover:text-accent"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(item.banner_id)} aria-label={`Delete ${item.title || 'carousel slide'}`} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={open} onClose={closeEditor} title={form.banner_id ? 'Edit carousel slide' : 'Add carousel slide'} extraWide>
        {cropSource ? (
          <div>
            <div className="relative h-[min(48vh,360px)] overflow-hidden rounded-xl bg-stone-950">
              <Cropper
                image={cropSource}
                crop={crop}
                zoom={zoom}
                aspect={CAROUSEL_ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, pixels) => setCroppedArea(pixels)}
                showGrid
              />
            </div>
            <label className="mt-4 block text-sm font-bold text-foreground">
              Zoom
              <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 w-full accent-accent" />
            </label>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Move and zoom the image until all important content stays inside the wide crop frame.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={resetCrop} disabled={saving} className="min-h-11 rounded-xl border border-border bg-card px-4 text-sm font-black text-foreground disabled:opacity-60">Cancel crop</button>
              <button type="button" onClick={applyCrop} disabled={!croppedArea || saving} className="btn-gold inline-flex min-h-11 items-center justify-center gap-2 disabled:opacity-60"><Check className="h-4 w-4" />{saving ? 'Applying…' : 'Use this crop'}</button>
            </div>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0])} />

            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-base font-black text-foreground">Live homepage preview</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Drag the text card anywhere inside the preview. You can also focus it and use the arrow keys for precise alignment. Phones automatically dock the card safely near the bottom.</p>
              </div>
              <span className="text-xs font-bold text-accent">Edge-to-edge image preview</span>
            </div>

            <SlideCompositionPreview
              form={form}
              onPositionChange={(x, y) => setForm((current) => ({ ...current, content_x: x, content_y: y }))}
            />

            {form.image ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => setCropSource(form.image)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-black text-foreground hover:border-accent"><Crop className="h-4 w-4" /> Adjust crop</button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-black text-foreground hover:border-accent"><Upload className="h-4 w-4" /> Replace image</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); chooseImage(event.dataTransfer.files?.[0]); }}
                className="grid min-h-52 w-full place-items-center rounded-xl border-2 border-dashed border-accent/50 bg-accent/5 p-6 text-center transition hover:border-accent hover:bg-accent/10"
              >
                <span>
                  <ImagePlus className="mx-auto h-9 w-9 text-accent" />
                  <strong className="mt-3 block text-sm text-foreground">Choose or drop a carousel image</strong>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">JPG, PNG, or WebP · at least 1200 × 375px · maximum 10 MB</span>
                </span>
              </button>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <label className="text-sm font-bold text-foreground sm:col-span-2 lg:col-span-2">Title / eyebrow <span className="font-normal text-muted-foreground">(optional)</span><input className={`${fieldClass} mt-1.5`} maxLength={96} placeholder="Exclusive collection" value={form.eyebrow} onChange={(event) => set('eyebrow', event.target.value)} /></label>
              <label className="text-sm font-bold text-foreground sm:col-span-2 lg:col-span-4">Heading <span className="font-normal text-muted-foreground">(recommended)</span><input className={`${fieldClass} mt-1.5`} maxLength={160} placeholder="Own a number people remember" value={form.title} onChange={(event) => set('title', event.target.value)} /></label>
              <label className="text-sm font-bold text-foreground sm:col-span-2 lg:col-span-6">Subheading <span className="font-normal text-muted-foreground">(optional)</span><input className={`${fieldClass} mt-1.5`} maxLength={255} placeholder="Add one clear sentence that supports the offer." value={form.subtitle} onChange={(event) => set('subtitle', event.target.value)} /></label>
              <label className="text-sm font-bold text-foreground lg:col-span-2">Button text <span className="font-normal text-muted-foreground">(optional)</span><input className={`${fieldClass} mt-1.5`} maxLength={64} placeholder="Explore Numbers" value={form.cta_text} onChange={(event) => set('cta_text', event.target.value)} /></label>
              <label className="text-sm font-bold text-foreground lg:col-span-2">Button link <span className="font-normal text-muted-foreground">(optional)</span><input className={`${fieldClass} mt-1.5`} maxLength={255} placeholder="/shop" value={form.cta_link} onChange={(event) => set('cta_link', event.target.value)} /></label>
              <label className="text-sm font-bold text-foreground lg:col-span-2">Display order<input type="number" min="0" max="9999" className={`${fieldClass} mt-1.5`} value={form.sort_order} onChange={(event) => set('sort_order', Number(event.target.value))} /></label>
              <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-border bg-muted/60 px-3 text-sm font-bold text-foreground sm:col-span-2 lg:col-span-6"><input type="checkbox" checked={form.is_active} onChange={(event) => set('is_active', event.target.checked)} className="h-4 w-4 accent-accent" /> Publish on homepage after saving</label>
            </div>

            <button disabled={saving || !form.image} className="btn-gold inline-flex min-h-11 w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
              <Check className="h-4 w-4" />{saving ? 'Saving…' : 'Save carousel slide'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
