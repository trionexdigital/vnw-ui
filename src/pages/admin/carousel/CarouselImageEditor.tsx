import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, Crop } from 'lucide-react';
import ImageCropDialog from '@/shared/components/ImageCropDialog';
import { adminCarouselAPI } from '@/core/api/vnwAPI';
import { createBlankCarouselDocument, type CarouselProject } from '@/core/carousel/types';

const sizes = { desktop: { width: 1200, height: 420 }, mobile: { width: 640, height: 800 } };
type Device = keyof typeof sizes;

export default function CarouselImageEditor() {
  const { id } = useParams(); const navigate = useNavigate();
  const [project, setProject] = useState<CarouselProject | null>(null);
  const [name, setName] = useState('New carousel');
  const objectUrls = useRef<string[]>([]);
  useEffect(() => () => objectUrls.current.forEach(URL.revokeObjectURL), []);
  const [files, setFiles] = useState<Partial<Record<Device, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<Device, string>>>({});
  const [cropping, setCropping] = useState<{ device: Device; file: File } | null>(null);
  const [sources, setSources] = useState<Partial<Record<Device, File>>>({});
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (!id) return;
    let active = true; const urls: string[] = [];
    adminCarouselAPI.get(Number(id)).then(async (data) => {
      const next: Partial<Record<Device, string>> = {};
      for (const device of ['desktop', 'mobile'] as const) {
        const assetId = device === 'desktop' ? data.draft_desktop_preview_id : data.draft_mobile_preview_id;
        if (assetId) { const url = URL.createObjectURL(await adminCarouselAPI.assetBlob(assetId)); urls.push(url); next[device] = url; }
      }
      if (active) { setProject(data); setName(data.name); setPreviews(next); }
    }).catch((reason) => { if (active) setError(reason.message || 'Could not open carousel.'); });
    return () => { active = false; urls.forEach(URL.revokeObjectURL); };
  }, [id]);
  const choose = (device: Device, file?: File) => { if (!file) return; setSources(current => ({ ...current, [device]: file })); setCropping({ device, file }); };
  const applyCrop = (file: File) => {
    if (!cropping) return;
    const device = cropping.device;
    setFiles(current => ({ ...current, [device]: file }));
    setPreviews(current => { if (current[device]) URL.revokeObjectURL(current[device]); const url = URL.createObjectURL(file); objectUrls.current.push(url); return { ...current, [device]: url }; });
    setCropping(null);
  };
  const save = async () => {
    setBusy(true); setError('');
    try {
      if (!project && (!files.desktop || !files.mobile)) throw new Error('Add both images before creating a carousel.');
      let current = project;
      if (!current) {
        const created = await adminCarouselAPI.create(name.trim() || 'New carousel', createBlankCarouselDocument('desktop'), createBlankCarouselDocument('mobile'));
        current = await adminCarouselAPI.get(created.carousel_id);
        setProject(current);
      }
      const previewIds = { desktop: current.draft_desktop_preview_id, mobile: current.draft_mobile_preview_id };
      for (const device of ['desktop', 'mobile'] as const) {
        if (!files[device]) continue;
        const resized = files[device]!;
        const asset = await adminCarouselAPI.uploadAsset(current.carousel_id, resized, `preview-${device}`, sizes[device].width, sizes[device].height);
        previewIds[device] = asset.asset_id;
      }
      if (!previewIds.desktop || !previewIds.mobile) throw new Error('Add one desktop image and one mobile image.');
      const saved = await adminCarouselAPI.saveDraftRaw({ carousel_id: current.carousel_id, revision: current.draft_revision, name: name.trim() || 'New carousel', desktop: current.draft_desktop || createBlankCarouselDocument('desktop'), mobile: current.draft_mobile || createBlankCarouselDocument('mobile'), desktop_preview_id: previewIds.desktop, mobile_preview_id: previewIds.mobile, transition_style: current.transition_style || 'fade', autoplay_seconds: current.autoplay_seconds || 6 });
      if (saved.status !== 1) throw new Error(saved.info || 'Could not save carousel.');
      setProject({ ...current, draft_revision: saved.data.revision, draft_desktop_preview_id: previewIds.desktop, draft_mobile_preview_id: previewIds.mobile });
      const published = await adminCarouselAPI.publishRaw(current.carousel_id, saved.data.revision);
      if (published.status !== 1) throw new Error(published.info || 'Could not publish carousel.');
      navigate('/admin/carousel');
    } catch (reason: any) { setError(reason.message || 'Could not save carousel.'); }
    finally { setBusy(false); }
  };
  return <section aria-label="Carousel image editor" className="mx-auto max-w-5xl space-y-3">
    <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
      <label className="grid gap-1 text-xs font-bold">Carousel name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} className="h-9 rounded-lg border border-border bg-background px-3 text-sm" /></label>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-4">{(['desktop', 'mobile'] as const).map((device) => <div key={device} className="grid min-w-0 content-start gap-2 rounded-xl border border-border p-2 sm:p-3">
        <span className="flex items-center gap-1 text-xs font-bold"><ImagePlus className="h-4 w-4 shrink-0 text-primary" />{device === 'desktop' ? 'Desktop · landscape' : 'Mobile · portrait'}</span>
        <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg bg-muted sm:h-48"><div className={device === 'desktop' ? 'aspect-[20/7] w-full overflow-hidden' : 'aspect-[4/5] h-full overflow-hidden'}>{previews[device] ? <img src={previews[device]} alt={`${device} carousel preview`} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center bg-background text-xs text-muted-foreground">{sizes[device].width} × {sizes[device].height}</span>}</div></div>
        <input aria-label={`${device} image`} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { choose(device, event.target.files?.[0]); event.target.value = ''; }} className="w-full min-w-0 text-[10px] file:mr-1 file:rounded-md file:border-0 file:bg-primary/10 file:p-1 file:text-primary sm:text-xs" />
        {sources[device] && <button type="button" onClick={() => setCropping({ device, file: sources[device]! })} className="flex items-center justify-center gap-1 text-xs font-bold text-primary"><Crop className="h-3 w-3" />Adjust crop</button>}
      </div>)}</div>
      <p className="mt-2 text-[11px] text-muted-foreground">One image per device. Uploads are cropped and optimized for the selected format.</p>
      {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
      <div className="mt-3 flex justify-end"><button disabled={busy} onClick={() => void save()} className="btn-gold min-h-9 px-4 text-xs">{busy ? 'Publishing…' : 'Save and publish'}</button></div>
    </div>
    {cropping && <ImageCropDialog key={`${cropping.device}-${cropping.file.name}`} file={cropping.file} {...sizes[cropping.device]} label={cropping.device} onCancel={() => setCropping(null)} onApply={applyCrop} />}
  </section>;
}
