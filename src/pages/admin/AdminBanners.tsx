import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import {
  Check,
  Crop,
  Eye,
  EyeOff,
  ImagePlus,
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
  cropCarouselImage,
  prepareCarouselSource,
} from '@/core/lib/carouselImage';
import { useToast } from '@/shared/hooks/use-toast';
import { Loader, PageHeader } from '@/shared/components/ui-bits';
import Modal from '@/shared/components/Modal';

interface CarouselForm {
  banner_id?: number;
  title: string;
  subtitle: string;
  image: string;
  cta_text: string;
  cta_link: string;
  is_active: boolean;
  sort_order: number;
}

const emptyForm: CarouselForm = {
  title: '',
  subtitle: '',
  image: '',
  cta_text: '',
  cta_link: '',
  is_active: true,
  sort_order: 0,
};

const fieldClass = 'h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-700 focus:ring-4 focus:ring-amber-700/10';

function toForm(item: CarouselSlide): CarouselForm {
  return {
    banner_id: item.banner_id,
    title: item.title || '',
    subtitle: item.subtitle || '',
    image: item.image || '',
    cta_text: item.cta_text || '',
    cta_link: item.cta_link || '',
    is_active: Boolean(item.is_active),
    sort_order: Number(item.sort_order) || 0,
  };
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

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Every upload is cropped to a fixed <strong>16:5</strong> frame and exported at <strong>1600 × 500px</strong>, keeping the homepage carousel sharp and consistently aligned.
      </div>

      {loading ? <Loader /> : items.length === 0 ? (
        <div className="vnw-card grid min-h-72 place-items-center p-8 text-center">
          <div>
            <ImagePlus className="mx-auto h-10 w-10 text-amber-700" />
            <h2 className="mt-4 text-lg font-black text-stone-950">No carousel slides yet</h2>
            <p className="mt-2 text-sm text-stone-600">Add the first cropped image to publish the section below the homepage hero.</p>
            <button type="button" onClick={() => openEditor()} className="btn-gold mt-5 inline-flex items-center gap-2 text-sm"><Plus className="h-4 w-4" /> Add first slide</button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <article key={item.banner_id} className="vnw-card overflow-hidden p-0">
              <div className="relative aspect-[16/5] overflow-hidden bg-stone-100">
                {item.image ? (
                  <img src={item.image} alt={item.title || 'Carousel slide preview'} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-sm font-bold text-stone-500">Image required</div>
                )}
                <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black shadow-sm ${item.is_active ? 'bg-emerald-600 text-white' : 'bg-stone-900/75 text-white'}`}>
                  {item.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {item.is_active ? 'Published' : 'Hidden'}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-stone-800 shadow-sm">Order {item.sort_order}</span>
              </div>
              <div className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-black text-stone-950">{item.title || 'Image-only slide'}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-600">{item.subtitle || 'No supporting copy'}</p>
                  {(item.cta_text || item.cta_link) && <p className="mt-2 truncate text-xs font-bold text-amber-800">{item.cta_text || 'Open'} → {item.cta_link || 'No link'}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => openEditor(item)} aria-label={`Edit ${item.title || 'carousel slide'}`} className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-700 transition hover:border-amber-600 hover:text-amber-800"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(item.banner_id)} aria-label={`Delete ${item.title || 'carousel slide'}`} className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-700 transition hover:border-rose-500 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={open} onClose={closeEditor} title={form.banner_id ? 'Edit carousel slide' : 'Add carousel slide'} wide>
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
            <label className="mt-4 block text-sm font-bold text-stone-800">
              Zoom
              <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 w-full accent-amber-700" />
            </label>
            <p className="mt-2 text-xs leading-5 text-stone-600">Move and zoom the image until all important content stays inside the wide crop frame.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={resetCrop} disabled={saving} className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm font-black text-stone-800 disabled:opacity-60">Cancel crop</button>
              <button type="button" onClick={applyCrop} disabled={!croppedArea || saving} className="btn-gold inline-flex min-h-11 items-center justify-center gap-2 disabled:opacity-60"><Check className="h-4 w-4" />{saving ? 'Applying…' : 'Use this crop'}</button>
            </div>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0])} />

            {form.image ? (
              <div>
                <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                  <img src={form.image} alt="Cropped carousel preview" className="aspect-[16/5] w-full object-cover" />
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => setCropSource(form.image)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-black text-stone-800"><Crop className="h-4 w-4" /> Adjust crop</button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-black text-stone-800"><Upload className="h-4 w-4" /> Replace image</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); chooseImage(event.dataTransfer.files?.[0]); }}
                className="grid min-h-52 w-full place-items-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-6 text-center transition hover:border-amber-600 hover:bg-amber-50"
              >
                <span>
                  <ImagePlus className="mx-auto h-9 w-9 text-amber-700" />
                  <strong className="mt-3 block text-sm text-stone-950">Choose or drop a carousel image</strong>
                  <span className="mt-1 block text-xs leading-5 text-stone-600">JPG, PNG, or WebP · at least 1200 × 375px · maximum 10 MB</span>
                </span>
              </button>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold text-stone-800 sm:col-span-2">Title <span className="font-normal text-stone-500">(optional overlay and image description)</span><input className={`${fieldClass} mt-1.5`} maxLength={160} value={form.title} onChange={(event) => set('title', event.target.value)} /></label>
              <label className="text-sm font-bold text-stone-800 sm:col-span-2">Subtitle <span className="font-normal text-stone-500">(optional)</span><input className={`${fieldClass} mt-1.5`} maxLength={255} value={form.subtitle} onChange={(event) => set('subtitle', event.target.value)} /></label>
              <label className="text-sm font-bold text-stone-800">Button text <span className="font-normal text-stone-500">(optional)</span><input className={`${fieldClass} mt-1.5`} maxLength={64} placeholder="Explore Numbers" value={form.cta_text} onChange={(event) => set('cta_text', event.target.value)} /></label>
              <label className="text-sm font-bold text-stone-800">Button link <span className="font-normal text-stone-500">(optional)</span><input className={`${fieldClass} mt-1.5`} maxLength={255} placeholder="/shop" value={form.cta_link} onChange={(event) => set('cta_link', event.target.value)} /></label>
              <label className="text-sm font-bold text-stone-800">Display order<input type="number" min="0" max="9999" className={`${fieldClass} mt-1.5`} value={form.sort_order} onChange={(event) => set('sort_order', Number(event.target.value))} /></label>
              <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-bold text-stone-800"><input type="checkbox" checked={form.is_active} onChange={(event) => set('is_active', event.target.checked)} className="h-4 w-4 accent-amber-700" /> Publish on homepage</label>
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
