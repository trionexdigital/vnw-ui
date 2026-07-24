import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlignCenter, AlignHorizontalDistributeCenter, AlignLeft, AlignRight, AlignVerticalDistributeCenter,
  ArrowDown, ArrowLeft, ArrowUp, Bold, BringToFront, Check, ChevronDown, Circle, Copy, Download,
  Eye, EyeOff, Group, ImagePlus, Layers, Link2, Lock, Maximize2, Monitor, MousePointer2,
  Italic, Palette, Pause, Pencil, Play, Plus, Redo2, RotateCcw, Save, SendToBack, Shapes, Smartphone,
  Sparkles, Square, Strikethrough, Trash2, Type, Underline, Undo2, Ungroup, Unlock, Upload,
  WandSparkles, ZoomIn, ZoomOut,
} from 'lucide-react';
import { adminCarouselAPI } from '@/core/api/vnwAPI';
import {
  CAROUSEL_ARTBOARDS, CAROUSEL_FONTS, copyDesktopDocumentToMobile, createBlankCarouselDocument,
  getCarouselDocumentIssues, normalizeCarouselDocument, serializeCarouselDocument,
  type CarouselAsset, type CarouselDevice, type CarouselDocument, type CarouselProject,
  type CarouselTransition,
} from '@/core/carousel/types';
import { CAROUSEL_TEMPLATES, createTemplateDocument } from '@/core/carousel/templates';
import CarouselArtboard, { renderCarouselPreviewBlob } from '@/shared/components/carousel/CarouselArtboard';
import { BrandLockup } from '@/shared/components/Logo';
import CarouselCanvas, { type CarouselCanvasHandle, type LayerSnapshot, type SelectionSnapshot } from './CarouselCanvas';

type SaveStatus = 'saved' | 'saving' | 'offline' | 'error' | 'conflict';
type Panel = 'design' | 'layers' | 'style' | 'animate';

const EMOJIS = ['✨', '👑', '🔥', '💎', '🎉', '❤️', '⭐', '🚀', '✅', '📱', '🎯', '💫', '🪄', '🏆', '💰', '⚡'];

const buttonClass = 'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#decfae] bg-[#fffdf7] px-2.5 text-xs font-semibold text-[#3f3426] shadow-sm transition hover:border-[#c88710] hover:bg-[#fff6dc] disabled:cursor-not-allowed disabled:opacity-40';
const iconButtonClass = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#decfae] bg-[#fffdf7] text-[#5f513e] shadow-sm transition hover:border-[#c88710] hover:bg-[#fff6dc] hover:text-[#251602] disabled:opacity-35';
const inputClass = 'h-8 w-full rounded-lg border border-[#decfae] bg-[#fffdf7] px-2.5 text-xs text-[#251f18] outline-none transition focus:border-[#d89b12] focus:ring-2 focus:ring-[#f5bd42]/20';
const selectedControlClass = '!border-[#d89b12] !bg-[#fff6dc] !text-[#845400]';
const primaryButtonClass = 'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#f5bd42] to-[#f59e0b] px-3 text-xs font-extrabold text-[#251602] shadow-sm transition hover:brightness-105 disabled:opacity-40';

async function imageDimensions(file: File) {
  const bitmap = await createImageBitmap(file);
  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dimensions;
}

function humanBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function TemplateChooser() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const create = async (templateId: string | null) => {
    setCreating(templateId || 'blank'); setError('');
    try {
      const definition = CAROUSEL_TEMPLATES.find((item) => item.id === templateId);
      const desktop = templateId ? createTemplateDocument(templateId, 'desktop') : createBlankCarouselDocument('desktop');
      const mobile = templateId ? createTemplateDocument(templateId, 'mobile') : createBlankCarouselDocument('mobile');
      const result = await adminCarouselAPI.create(definition?.name || 'Untitled carousel', desktop, mobile);
      navigate(`/admin/carousel/${result.carousel_id}/edit`, { replace: true });
    } catch (reason: any) { setError(reason?.message || 'Could not create the carousel.'); setCreating(null); }
  };
  return (
    <main className="min-h-screen bg-[#fbfaf7] px-5 py-5 text-[#251f18]" style={{ colorScheme: 'light' }} data-carousel-studio-theme="light">
      <div className="mx-auto max-w-6xl">
        <header className="carousel-studio-chrome mb-6 flex items-center justify-between gap-4 rounded-xl border border-[#eadfca] px-3 py-2">
          <button onClick={() => navigate('/admin/carousel')} className={buttonClass}><ArrowLeft className="h-4 w-4" /> Back</button>
          <BrandLockup className="dark:!bg-transparent dark:!p-0" logoClassName="h-9 w-9 sm:h-9 sm:w-9" sloganClassName="h-7 w-[116px] sm:h-7 sm:w-[116px]" />
          <div className="w-24" />
        </header>
        <div className="mb-5 max-w-2xl">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#a56800]">Carousel Studio</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Choose a starting point</h1>
          <p className="mt-2 text-sm text-[#667085]">Each template creates editable desktop and mobile artboards. Every layer can be changed later.</p>
        </div>
        {error && <div className="mb-4 rounded-lg border border-[#f5b7b1] bg-[#fff1f0] p-3 text-sm text-[#b42318]">{error}</div>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button onClick={() => void create(null)} disabled={Boolean(creating)} className="group aspect-video rounded-xl border border-dashed border-[#cbd1da] bg-[#fff] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#d89b12] hover:shadow-md">
            <Plus className="mb-5 h-8 w-8 text-[#b77905]" /><div className="text-lg font-black">Blank design</div><div className="mt-1 text-xs text-[#667085]">Build every detail from scratch.</div>
          </button>
          {CAROUSEL_TEMPLATES.map((template) => (
            <button key={template.id} onClick={() => void create(template.id)} disabled={Boolean(creating)} className="group overflow-hidden rounded-xl border border-[#dfe3e8] bg-[#fff] text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#c8ced8] hover:shadow-md">
              <div className="relative aspect-video p-5 text-[#fff]" style={{ background: `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1]})` }}>
                <div className="text-xs font-bold tracking-[.2em]" style={{ color: template.accent }}>VIP NUMBER WORLD</div>
                <div className="mt-6 max-w-[80%] text-xl font-black leading-none">{template.title}</div>
                <div className="absolute bottom-4 left-5 h-1.5 w-16 rounded-full" style={{ background: template.accent }} />
              </div>
              <div className="p-3.5"><div className="text-sm font-black">{template.name}</div><div className="mt-0.5 text-xs text-[#667085]">{template.description}</div></div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function CarouselEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = Number(id);
  const canvasRef = useRef<CarouselCanvasHandle | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const revisionRef = useRef(1);
  const savingRef = useRef<Promise<number | null> | null>(null);
  const documentsRef = useRef<Record<CarouselDevice, CarouselDocument>>({ desktop: createBlankCarouselDocument('desktop'), mobile: createBlankCarouselDocument('mobile') });
  const [project, setProject] = useState<CarouselProject | null>(null);
  const [documents, setDocuments] = useState(documentsRef.current);
  const [device, setDevice] = useState<CarouselDevice>('desktop');
  const [assets, setAssets] = useState<CarouselAsset[]>([]);
  const [assetUrls, setAssetUrls] = useState<Map<number, string>>(new Map());
  const [previewUrls, setPreviewUrls] = useState<Partial<Record<CarouselDevice, string>>>({});
  const [name, setName] = useState('Untitled carousel');
  const [transition, setTransition] = useState<CarouselTransition>('fade');
  const [autoplay, setAutoplay] = useState(6);
  const [previewIds, setPreviewIds] = useState<Partial<Record<CarouselDevice, number>>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState<Panel>('design');
  const [layers, setLayers] = useState<LayerSnapshot[]>([]);
  const [selection, setSelection] = useState<SelectionSnapshot | null>(null);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const [zoom, setZoom] = useState(0.42);
  const [drawing, setDrawing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    const urls: string[] = [];
    setLoading(true); setError('');
    adminCarouselAPI.get(projectId).then(async (data) => {
      const entries = await Promise.all((data.assets || []).map(async (asset) => {
        const blob = await adminCarouselAPI.assetBlob(asset.asset_id);
        const url = URL.createObjectURL(blob); urls.push(url);
        return [asset.asset_id, url] as const;
      }));
      if (cancelled) return;
      const desktop = normalizeCarouselDocument(data.draft_desktop, 'desktop');
      const mobile = normalizeCarouselDocument(data.draft_mobile, 'mobile');
      const nextDocuments = { desktop, mobile };
      documentsRef.current = nextDocuments; setDocuments(nextDocuments);
      setProject(data); setAssets(data.assets || []); setAssetUrls(new Map(entries)); setName(data.name);
      setTransition(data.transition_style || 'fade'); setAutoplay(Number(data.autoplay_seconds || 6));
      revisionRef.current = Number(data.draft_revision || 1);
      setPreviewIds({ desktop: data.draft_desktop_preview_id || undefined, mobile: data.draft_mobile_preview_id || undefined });
      const previewEntries = await Promise.all((['desktop', 'mobile'] as const).map(async (kind) => {
        const assetId = kind === 'desktop' ? data.draft_desktop_preview_id : data.draft_mobile_preview_id;
        if (!assetId) return [kind, undefined] as const;
        const blob = await adminCarouselAPI.assetBlob(assetId); const url = URL.createObjectURL(blob); urls.push(url);
        return [kind, url] as const;
      }));
      if (!cancelled) { setPreviewUrls(Object.fromEntries(previewEntries)); setReady(true); }
    }).catch((reason: any) => setError(reason?.message || 'Could not load this carousel.')).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; urls.forEach(URL.revokeObjectURL); };
  }, [projectId]);

  useEffect(() => { documentsRef.current = documents; }, [documents]);

  const snapshotDocuments = useCallback(() => {
    const current = canvasRef.current?.exportDocument();
    const next = current ? { ...documentsRef.current, [device]: current } : documentsRef.current;
    documentsRef.current = next; setDocuments(next);
    return next;
  }, [device]);

  const saveDraft = useCallback(async (withPreviews = false): Promise<number | null> => {
    if (!projectId || !ready) return null;
    if (savingRef.current) await savingRef.current;
    const operation = (async () => {
      setSaveStatus('saving'); setError('');
      const nextDocuments = snapshotDocuments();
      let nextPreviewIds = { ...previewIds };
      try {
        if (withPreviews) {
          for (const kind of ['desktop', 'mobile'] as const) {
            const blob = await renderCarouselPreviewBlob(nextDocuments[kind], assetUrls);
            const size = CAROUSEL_ARTBOARDS[kind];
            const uploaded = await adminCarouselAPI.uploadAsset(projectId, blob, `preview-${kind}`, size.width, size.height, `carousel-${projectId}-${kind}.jpg`);
            nextPreviewIds[kind] = uploaded.asset_id;
            const oldUrl = previewUrls[kind]; if (oldUrl) URL.revokeObjectURL(oldUrl);
            setPreviewUrls((current) => ({ ...current, [kind]: URL.createObjectURL(blob) }));
          }
          setPreviewIds(nextPreviewIds);
        }
        const response = await adminCarouselAPI.saveDraftRaw({
          carousel_id: projectId, revision: revisionRef.current, name,
          desktop: serializeCarouselDocument(nextDocuments.desktop), mobile: serializeCarouselDocument(nextDocuments.mobile),
          desktop_preview_id: nextPreviewIds.desktop || null, mobile_preview_id: nextPreviewIds.mobile || null,
          transition_style: transition, autoplay_seconds: autoplay,
        });
        if (response?.status === -409) { setSaveStatus('conflict'); return null; }
        if (response?.status !== 1) throw new Error(response?.info || 'Draft save failed.');
        revisionRef.current = Number(response.data.revision); setSaveStatus('saved');
        return revisionRef.current;
      } catch (reason: any) {
        setSaveStatus(navigator.onLine ? 'error' : 'offline'); setError(reason?.message || 'Could not save the draft.'); return null;
      }
    })();
    savingRef.current = operation;
    const result = await operation;
    savingRef.current = null;
    return result;
  }, [assetUrls, autoplay, name, previewIds, previewUrls, projectId, ready, snapshotDocuments, transition]);

  useEffect(() => {
    if (!ready) return;
    setSaveStatus((current) => current === 'conflict' ? current : 'saving');
    const timer = window.setTimeout(() => { void saveDraft(false); }, 1400);
    return () => window.clearTimeout(timer);
  }, [documents, name, transition, autoplay, ready]); // saveDraft intentionally omitted to prevent timer churn

  useEffect(() => {
    const online = () => { if (saveStatus === 'offline') void saveDraft(false); };
    window.addEventListener('online', online);
    return () => window.removeEventListener('online', online);
  }, [saveDraft, saveStatus]);

  const switchDevice = (next: CarouselDevice) => {
    if (next === device) return;
    snapshotDocuments(); setSelection(null); setLayers([]); setDevice(next);
  };

  const copyToMobile = () => {
    const next = { ...snapshotDocuments(), mobile: copyDesktopDocumentToMobile(documentsRef.current.desktop) };
    documentsRef.current = next; setDocuments(next); setDevice('mobile');
  };

  const uploadImage = async (file: File) => {
    try {
      if (file.size > 12 * 1024 * 1024) throw new Error('The image must be 12 MB or smaller.');
      const total = assets.filter((asset) => asset.purpose === 'source' || asset.purpose === 'sticker').reduce((sum, asset) => sum + asset.byte_size, 0);
      if (total + file.size > 12 * 1024 * 1024) throw new Error('This upload would exceed the project’s 12 MB source-asset limit.');
      const dimensions = await imageDimensions(file);
      const asset = await adminCarouselAPI.uploadAsset(projectId, file, 'source', dimensions.width, dimensions.height);
      const url = URL.createObjectURL(file);
      setAssets((current) => current.some((item) => item.asset_id === asset.asset_id) ? current : [...current, asset]);
      setAssetUrls((current) => new Map(current).set(asset.asset_id, url));
      await canvasRef.current?.addImage(url, asset);
    } catch (reason: any) { setError(reason?.message || 'Image upload failed.'); }
  };

  const publish = async () => {
    setPublishing(true); setError('');
    const current = snapshotDocuments();
    const issues = [...getCarouselDocumentIssues(current.desktop, 'desktop'), ...getCarouselDocumentIssues(current.mobile, 'mobile')];
    if (issues.length) { setError(issues.join(' ')); setPublishing(false); return; }
    const revision = await saveDraft(true);
    if (!revision) { setPublishing(false); return; }
    const response = await adminCarouselAPI.publishRaw(projectId, revision);
    if (response?.status === 1) { setProject((current) => current ? { ...current, is_published: 1, published_revision: revision } : current); setSaveStatus('saved'); }
    else if (response?.status === -409) setSaveStatus('conflict');
    else setError(response?.info || 'Could not publish this carousel.');
    setPublishing(false);
  };

  const updateSelection = (key: string, value: unknown) => canvasRef.current?.updateSelection({ [key]: value });
  const updateSelectedProperties = (properties: Record<string, unknown>) => canvasRef.current?.updateSelection(properties);

  if (!id) return <TemplateChooser />;
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#fbfaf7] text-[#251f18]" style={{ colorScheme: 'light' }} data-carousel-studio-theme="light"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#eadfca] border-t-[#d89b12]" /><p className="mt-3 text-sm font-semibold">Opening Carousel Studio…</p></div></div>;
  if (!project || error && !ready) return <div className="grid min-h-screen place-items-center bg-[#fbfaf7] p-6 text-[#251f18]" style={{ colorScheme: 'light' }} data-carousel-studio-theme="light"><div className="max-w-lg rounded-xl border border-[#f3b6b1] bg-[#fffdf7] p-5 text-center shadow-lg"><p className="text-sm text-[#b42318]">{error || 'Carousel not found.'}</p><button className={`${buttonClass} mt-4`} onClick={() => navigate('/admin/carousel')}>Back to manager</button></div></div>;

  const statusLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'offline' ? 'Offline' : saveStatus === 'conflict' ? 'Conflict — reload required' : 'Save error';
  const activeDocument = documents[device];

  return (
    <div className="flex h-screen min-w-[900px] flex-col overflow-hidden bg-[#fbfaf7] text-[#251f18]" style={{ colorScheme: 'light' }} data-carousel-studio-theme="light">
      <header className="carousel-studio-chrome z-40 flex h-12 shrink-0 items-center gap-2 border-b border-[#eadfca] bg-[#fffdf7] px-3 shadow-sm">
        <button onClick={() => navigate('/admin/carousel')} className={iconButtonClass} title="Back to carousel manager" aria-label="Back to carousel manager"><ArrowLeft className="h-4 w-4" /></button>
        <BrandLockup className="dark:!bg-transparent dark:!p-0" logoClassName="h-8 w-8 sm:h-8 sm:w-8" sloganClassName="h-6 w-[105px] sm:h-6 sm:w-[105px]" />
        <div className="h-6 w-px bg-[#e3e6eb]" />
        <input value={name} onChange={(event) => setName(event.target.value)} className="min-w-[120px] max-w-xs flex-1 rounded-md bg-transparent px-1 text-sm font-bold outline-none focus:bg-[#f6f7f9]" aria-label="Carousel name" />
        <div className={`ml-auto flex shrink-0 items-center gap-1.5 text-[11px] font-bold ${saveStatus === 'saved' ? 'text-[#15803d]' : saveStatus === 'conflict' || saveStatus === 'error' ? 'text-[#b42318]' : 'text-[#9a6700]'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{statusLabel}</div>
        <button onClick={() => void saveDraft(true)} className={buttonClass}><Save className="h-4 w-4" /> Save</button>
        <button onClick={() => setPreviewMode((value) => !value)} className={`${buttonClass} ${previewMode ? selectedControlClass : ''}`}><Play className="h-4 w-4" /> Preview</button>
        <button onClick={() => void publish()} disabled={publishing || saveStatus === 'conflict'} className={primaryButtonClass}><Sparkles className="h-4 w-4" />{publishing ? 'Publishing…' : project.is_published ? 'Update live' : 'Publish'}</button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[54px] shrink-0 flex-col items-center gap-1 border-r border-[#eadfca] bg-[#fffdf7] py-2">
          {[['design', WandSparkles, 'Design'], ['layers', Layers, 'Layers'], ['style', Palette, 'Style'], ['animate', Play, 'Animate']].map(([value, Icon, label]) => (
            <button key={String(value)} onClick={() => setPanel(value as Panel)} aria-pressed={panel === value} className={`flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[9px] font-bold transition ${panel === value ? 'bg-[#fff1c7] text-[#845400]' : 'text-[#667085] hover:bg-[#f2f4f7] hover:text-[#101828]'}`}><Icon className="h-4 w-4" />{String(label)}</button>
          ))}
          <div className="my-1 h-px w-8 bg-[#e3e6eb]" />
          <button onClick={() => { setDrawing((value) => { canvasRef.current?.setDrawing(!value); return !value; }); }} aria-pressed={drawing} className={`flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[9px] font-bold transition ${drawing ? 'bg-[#fff1c7] text-[#845400]' : 'text-[#667085] hover:bg-[#fff6dc]'}`}><Pencil className="h-4 w-4" />Draw</button>
        </aside>

        <aside className="w-[252px] shrink-0 overflow-y-auto border-r border-[#eadfca] bg-[#fbf8f1] p-3">
          {panel === 'design' && (
            <div className="space-y-3">
              <PanelTitle title="Add" subtitle="Click an item, then edit it on canvas." />
              <div className="grid grid-cols-3 gap-1.5">
                <ToolButton icon={Type} label="Text" onClick={() => canvasRef.current?.addText()} />
                <ToolButton icon={ImagePlus} label="Image" onClick={() => fileRef.current?.click()} />
                <ToolButton icon={Square} label="Button" onClick={() => canvasRef.current?.addButton()} />
              </div>
              <div>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#667085]">Text presets</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button className={buttonClass} onClick={() => canvasRef.current?.addText('Heading', { fontSize: device === 'desktop' ? 104 : 128, fontWeight: '800', lineHeight: 0.95 })}>Heading</button>
                  <button className={buttonClass} onClick={() => canvasRef.current?.addText('Subheading', { fontSize: device === 'desktop' ? 62 : 78, fontWeight: '600', lineHeight: 1.05 })}>Subtitle</button>
                  <button className={buttonClass} onClick={() => canvasRef.current?.addText('Body text', { fontSize: device === 'desktop' ? 34 : 44, fontWeight: '400', lineHeight: 1.25 })}>Body</button>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.target.value = ''; }} />
              <div>
                <button className={`${buttonClass} w-full justify-between`} onClick={() => setEmojiOpen((value) => !value)}>Emoji <ChevronDown className="h-4 w-4" /></button>
                {emojiOpen && <div className="mt-1.5 grid grid-cols-8 gap-0.5 rounded-lg border border-[#e1e4e8] bg-[#fff] p-1.5">{EMOJIS.map((emoji) => <button key={emoji} onClick={() => canvasRef.current?.addEmoji(emoji)} className="grid h-7 place-items-center rounded-md text-base hover:bg-[#f2f4f7]" title={`Add ${emoji}`}>{emoji}</button>)}</div>}
              </div>
              <div>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#667085]">Shapes</div>
                <div className="grid grid-cols-4 gap-1.5">{(['rectangle', 'circle', 'triangle', 'line'] as const).map((shape) => <button key={shape} onClick={() => canvasRef.current?.addShape(shape)} className={`${iconButtonClass} w-full`} title={`Add ${shape}`} aria-label={`Add ${shape}`}>{shape === 'circle' ? <Circle className="h-4 w-4" /> : shape === 'triangle' ? <Shapes className="h-4 w-4" /> : <Square className="h-4 w-4" />}</button>)}</div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Media · {humanBytes(assets.filter((a) => ['source', 'sticker'].includes(a.purpose)).reduce((sum, a) => sum + a.byte_size, 0))} / 12 MB</span></div>
                {assets.some((asset) => ['source', 'sticker'].includes(asset.purpose)) ? <div className="grid grid-cols-4 gap-1.5">{assets.filter((asset) => ['source', 'sticker'].includes(asset.purpose)).map((asset) => <button key={asset.asset_id} onClick={() => { const url = assetUrls.get(asset.asset_id); if (url) void canvasRef.current?.addImage(url, asset); }} className="group relative aspect-square overflow-hidden rounded-md border border-[#e1e4e8] bg-[#fff]"><img src={assetUrls.get(asset.asset_id)} alt={asset.original_name} className="h-full w-full object-contain" /><span className="absolute inset-x-0 bottom-0 truncate bg-[rgba(16,24,40,.78)] p-0.5 text-[8px] text-[#fff]">{asset.original_name}</span></button>)}</div> : <button onClick={() => fileRef.current?.click()} className="w-full rounded-lg border border-dashed border-[#cbd1da] bg-[#fff] p-3 text-xs text-[#667085] hover:border-[#d89b12]">Upload your first image</button>}
              </div>
            </div>
          )}

          {panel === 'layers' && (
            <div className="space-y-3">
              <PanelTitle title="Layers" subtitle="Select, lock, hide, and reorder." />
              <div className="flex gap-1.5"><button onClick={() => canvasRef.current?.groupSelection()} className={iconButtonClass} title="Group selected layers" aria-label="Group selected layers"><Group className="h-4 w-4" /></button><button onClick={() => canvasRef.current?.ungroupSelection()} className={iconButtonClass} title="Ungroup selected layer" aria-label="Ungroup selected layer"><Ungroup className="h-4 w-4" /></button><button onClick={() => void canvasRef.current?.duplicateSelection()} className={iconButtonClass} title="Duplicate selected layer" aria-label="Duplicate selected layer"><Copy className="h-4 w-4" /></button><button onClick={() => canvasRef.current?.deleteSelection()} className={`${iconButtonClass} !text-[#b42318]`} title="Delete selected layer" aria-label="Delete selected layer"><Trash2 className="h-4 w-4" /></button></div>
              {layers.length ? <div className="space-y-1">{layers.map((layer) => <div key={layer.id} className={`flex h-10 items-center gap-1 rounded-lg border px-1.5 ${selection?.id === layer.id ? 'border-[#d89b12] bg-[#fff6dc]' : 'border-[#e1e4e8] bg-[#fff]'}`}><button onClick={() => canvasRef.current?.selectLayer(layer.id)} className="min-w-0 flex-1 truncate text-left text-xs font-semibold" title={layer.name}>{layer.name}</button><LayerButton onClick={() => canvasRef.current?.toggleLayerVisible(layer.id)} label={layer.visible ? 'Hide layer' : 'Show layer'}>{layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</LayerButton><LayerButton onClick={() => canvasRef.current?.toggleLayerLock(layer.id)} label={layer.locked ? 'Unlock layer' : 'Lock layer'}>{layer.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}</LayerButton><LayerButton onClick={() => canvasRef.current?.nudgeLayer(layer.id, 'up')} label="Move layer forward"><ArrowUp className="h-3.5 w-3.5" /></LayerButton><LayerButton onClick={() => canvasRef.current?.nudgeLayer(layer.id, 'down')} label="Move layer backward"><ArrowDown className="h-3.5 w-3.5" /></LayerButton></div>)}</div> : <div className="rounded-lg border border-dashed border-[#cbd1da] bg-[#fff] p-4 text-center text-xs text-[#667085]">Add an item to create your first layer.</div>}
            </div>
          )}

          {panel === 'style' && (
            <div className="space-y-3">
              <PanelTitle title="Style" subtitle={selection ? `Editing ${selection.type}` : 'Select a layer first.'} />
              {!selection ? <EmptySelection /> : <>
                {selection.isText && <div className="space-y-2.5 rounded-lg border border-[#e1e4e8] bg-[#fff] p-2.5">
                  <div><div className="text-xs font-extrabold">Typography</div><div className="text-[10px] text-[#667085]">Double-click text on the canvas to type there.</div></div>
                  <Field label="Text"><textarea value={selection.text || ''} onChange={(e) => updateSelection('text', e.target.value)} rows={2} className="min-h-[54px] w-full resize-y rounded-lg border border-[#d9dde5] bg-[#fff] px-2.5 py-2 text-xs text-[#101828] outline-none focus:border-[#d89b12]" /></Field>
                  <div className="grid grid-cols-3 gap-1.5" aria-label="Text presets">
                    <button className={buttonClass} onClick={() => updateSelectedProperties({ fontSize: device === 'desktop' ? 104 : 128, fontWeight: '800', lineHeight: 0.95 })}>Title</button>
                    <button className={buttonClass} onClick={() => updateSelectedProperties({ fontSize: device === 'desktop' ? 62 : 78, fontWeight: '600', lineHeight: 1.05 })}>Subtitle</button>
                    <button className={buttonClass} onClick={() => updateSelectedProperties({ fontSize: device === 'desktop' ? 34 : 44, fontWeight: '400', lineHeight: 1.25 })}>Body</button>
                  </div>
                  <Field label="Font family"><select value={selection.fontFamily || 'Inter'} onChange={(e) => updateSelection('fontFamily', e.target.value)} className={inputClass}>{CAROUSEL_FONTS.map((font) => <option key={font} style={{ fontFamily: font }}>{font}</option>)}</select></Field>
                  <div className="grid grid-cols-2 gap-1.5"><Field label="Size"><input type="number" min="6" max="500" value={selection.fontSize || 48} onChange={(e) => updateSelection('fontSize', Math.max(6, Math.min(500, Number(e.target.value) || 6)))} className={inputClass} /></Field><Field label="Weight"><select value={String(selection.fontWeight || '400')} onChange={(e) => updateSelection('fontWeight', e.target.value)} className={inputClass}>{[['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold'], ['800', 'Extra bold'], ['900', 'Black']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field></div>
                  <div className="flex gap-1.5" aria-label="Font styles"><button onClick={() => updateSelection('fontWeight', Number(selection.fontWeight || 400) >= 600 ? '400' : '700')} className={`${iconButtonClass} ${Number(selection.fontWeight || 400) >= 600 ? selectedControlClass : ''}`} title="Bold" aria-label="Bold" aria-pressed={Number(selection.fontWeight || 400) >= 600}><Bold className="h-4 w-4" /></button><button onClick={() => updateSelection('fontStyle', selection.fontStyle === 'italic' ? 'normal' : 'italic')} className={`${iconButtonClass} ${selection.fontStyle === 'italic' ? selectedControlClass : ''}`} title="Italic" aria-label="Italic" aria-pressed={selection.fontStyle === 'italic'}><Italic className="h-4 w-4" /></button><button onClick={() => updateSelection('underline', !selection.underline)} className={`${iconButtonClass} ${selection.underline ? selectedControlClass : ''}`} title="Underline" aria-label="Underline" aria-pressed={Boolean(selection.underline)}><Underline className="h-4 w-4" /></button><button onClick={() => updateSelection('linethrough', !selection.linethrough)} className={`${iconButtonClass} ${selection.linethrough ? selectedControlClass : ''}`} title="Strikethrough" aria-label="Strikethrough" aria-pressed={Boolean(selection.linethrough)}><Strikethrough className="h-4 w-4" /></button></div>
                  <div className="flex gap-1.5" aria-label="Text alignment"><button onClick={() => updateSelection('textAlign', 'left')} className={`${iconButtonClass} ${selection.textAlign === 'left' ? selectedControlClass : ''}`} title="Align text left" aria-label="Align text left" aria-pressed={selection.textAlign === 'left'}><AlignLeft className="h-4 w-4" /></button><button onClick={() => updateSelection('textAlign', 'center')} className={`${iconButtonClass} ${selection.textAlign === 'center' ? selectedControlClass : ''}`} title="Center text" aria-label="Center text" aria-pressed={selection.textAlign === 'center'}><AlignCenter className="h-4 w-4" /></button><button onClick={() => updateSelection('textAlign', 'right')} className={`${iconButtonClass} ${selection.textAlign === 'right' ? selectedControlClass : ''}`} title="Align text right" aria-label="Align text right" aria-pressed={selection.textAlign === 'right'}><AlignRight className="h-4 w-4" /></button></div>
                  <div className="grid grid-cols-2 gap-1.5"><Field label="Letter spacing"><input type="number" min="-200" max="1000" step="10" value={selection.charSpacing ?? 0} onChange={(e) => updateSelection('charSpacing', Math.max(-200, Math.min(1000, Number(e.target.value) || 0)))} className={inputClass} /></Field><Field label="Line height"><input type="number" min="0.6" max="3" step="0.05" value={selection.lineHeight ?? 1.16} onChange={(e) => updateSelection('lineHeight', Math.max(0.6, Math.min(3, Number(e.target.value) || 1)))} className={inputClass} /></Field></div>
                  <Field label="Text highlight"><div className="flex gap-1.5"><input type="color" value={selection.textBackgroundColor || '#ffffff'} onChange={(e) => updateSelection('textBackgroundColor', e.target.value)} className="h-8 min-w-0 flex-1 cursor-pointer rounded-lg border border-[#d9dde5] bg-[#fff] p-1" /><button className={buttonClass} onClick={() => updateSelection('textBackgroundColor', '')}>Clear</button></div></Field>
                </div>}
                <div className="space-y-2.5 rounded-lg border border-[#e1e4e8] bg-[#fff] p-2.5">
                  <div className="text-xs font-extrabold">Appearance</div>
                  <div className="grid grid-cols-2 gap-1.5"><Field label="Fill"><input type="color" value={selection.fill || '#ffffff'} onChange={(e) => updateSelection('fill', e.target.value)} className="h-8 w-full cursor-pointer rounded-lg border border-[#d9dde5] bg-[#fff] p-1" /></Field><Field label="Border"><input type="color" value={selection.stroke || '#ffffff'} onChange={(e) => updateSelection('stroke', e.target.value)} className="h-8 w-full cursor-pointer rounded-lg border border-[#d9dde5] bg-[#fff] p-1" /></Field></div>
                  <Field label={`Opacity ${Math.round((selection.opacity ?? 1) * 100)}%`}><input type="range" min="0" max="1" step="0.05" value={selection.opacity ?? 1} onChange={(e) => updateSelection('opacity', Number(e.target.value))} className="w-full accent-[#d89b12]" /></Field>
                  <Field label={`Border width ${selection.strokeWidth || 0}`}><input type="range" min="0" max="30" value={selection.strokeWidth || 0} onChange={(e) => updateSelection('strokeWidth', Number(e.target.value))} className="w-full accent-[#d89b12]" /></Field>
                  <Field label="Gradient"><div className="grid grid-cols-[1fr_1fr_auto] gap-1.5"><input id="gradient-a" type="color" defaultValue="#f5bd42" className="h-8 w-full cursor-pointer rounded-lg border border-[#d9dde5] bg-[#fff] p-1" /><input id="gradient-b" type="color" defaultValue="#a16207" className="h-8 w-full cursor-pointer rounded-lg border border-[#d9dde5] bg-[#fff] p-1" /><button className={iconButtonClass} title="Apply gradient" aria-label="Apply gradient" onClick={() => canvasRef.current?.applyGradient((document.getElementById('gradient-a') as HTMLInputElement).value, (document.getElementById('gradient-b') as HTMLInputElement).value)}><Check className="h-4 w-4" /></button></div></Field>
                </div>
                {selection.isImage && <div className="space-y-2.5 rounded-lg border border-[#e1e4e8] bg-[#fff] p-2.5"><div className="text-xs font-extrabold">Image</div><Field label="Filter"><select onChange={(e) => canvasRef.current?.applyFilter(e.target.value as any)} className={inputClass}><option value="none">Original</option><option value="grayscale">Grayscale</option><option value="sepia">Sepia</option><option value="bright">Bright</option><option value="contrast">Contrast</option></select></Field><Field label="Mask"><select onChange={(e) => canvasRef.current?.applyMask(e.target.value as any)} className={inputClass}><option value="none">None</option><option value="circle">Circle</option><option value="rounded">Rounded</option></select></Field><Field label="Crop X"><input type="range" min="0" max="500" value={selection.cropX || 0} onChange={(e) => updateSelection('cropX', Number(e.target.value))} className="w-full accent-[#d89b12]" /></Field><Field label="Crop Y"><input type="range" min="0" max="500" value={selection.cropY || 0} onChange={(e) => updateSelection('cropY', Number(e.target.value))} className="w-full accent-[#d89b12]" /></Field></div>}
                <div className="space-y-2.5 rounded-lg border border-[#e1e4e8] bg-[#fff] p-2.5"><div className="text-xs font-extrabold">Interaction</div><Field label="Link"><input value={selection.link || ''} onChange={(e) => updateSelection('link', e.target.value)} placeholder="/shop or https://example.com" className={inputClass} /></Field><Field label="Accessibility label"><input value={selection.ariaLabel || ''} onChange={(e) => updateSelection('ariaLabel', e.target.value)} placeholder="Describe this linked item" className={inputClass} /></Field></div>
              </>}
            </div>
          )}

          {panel === 'animate' && (
            <div className="space-y-3"><PanelTitle title="Animation" subtitle="Add focused, lightweight motion." />{!selection ? <EmptySelection /> : <div className="space-y-2.5 rounded-lg border border-[#e1e4e8] bg-[#fff] p-2.5"><Field label="Entrance"><select value={selection.entrance || 'none'} onChange={(e) => updateSelection('entrance', e.target.value)} className={inputClass}>{['none', 'fade', 'slide-up', 'slide-left', 'zoom', 'bounce'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Loop"><select value={selection.loop || 'none'} onChange={(e) => updateSelection('loop', e.target.value)} className={inputClass}>{['none', 'float', 'pulse', 'spin'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label={`Duration ${selection.duration || 650} ms`}><input type="range" min="150" max="5000" step="50" value={selection.duration || 650} onChange={(e) => updateSelection('duration', Number(e.target.value))} className="w-full accent-[#d89b12]" /></Field><Field label={`Delay ${selection.delay || 0} ms`}><input type="range" min="0" max="5000" step="50" value={selection.delay || 0} onChange={(e) => updateSelection('delay', Number(e.target.value))} className="w-full accent-[#d89b12]" /></Field><button onClick={() => setPreviewMode(true)} className={`${buttonClass} w-full`}><Play className="h-4 w-4" /> Preview motion</button></div>}</div>
          )}
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col bg-[#e9ecf1]">
          <div className="carousel-studio-chrome flex h-11 shrink-0 items-center justify-between border-b border-[#eadfca] bg-[#fffdf7] px-3">
            <div className="flex gap-1.5"><button onClick={() => switchDevice('desktop')} className={`${buttonClass} ${device === 'desktop' ? selectedControlClass : ''}`} aria-pressed={device === 'desktop'}><Monitor className="h-4 w-4" /> Desktop <span className="text-[9px] font-medium text-[#667085]">1600×900</span></button><button onClick={() => switchDevice('mobile')} className={`${buttonClass} ${device === 'mobile' ? selectedControlClass : ''}`} aria-pressed={device === 'mobile'}><Smartphone className="h-4 w-4" /> Mobile <span className="text-[9px] font-medium text-[#667085]">1080×1920</span></button><button onClick={copyToMobile} className={buttonClass} title="Fit the desktop design onto the mobile artboard without cropping"><Copy className="h-4 w-4" /> Fit to mobile</button></div>
            <div className="flex gap-1"><button disabled={!history.canUndo} onClick={() => canvasRef.current?.undo()} className={iconButtonClass} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 className="h-4 w-4" /></button><button disabled={!history.canRedo} onClick={() => canvasRef.current?.redo()} className={iconButtonClass} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 className="h-4 w-4" /></button><button onClick={() => canvasRef.current?.reset()} className={iconButtonClass} title="Reset this artboard" aria-label="Reset this artboard"><RotateCcw className="h-4 w-4" /></button></div>
          </div>

          {error && <div className="absolute left-1/2 top-12 z-40 max-w-xl -translate-x-1/2 rounded-lg border border-[#f3b6b1] bg-[#fff1f0] px-3 py-2 text-xs text-[#b42318] shadow-xl"><button onClick={() => setError('')} className="float-right ml-3 font-bold" aria-label="Dismiss error">×</button>{error}</div>}

          {previewMode ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-[radial-gradient(circle_at_top,#fff9e8,#edf0f4_58%)] p-5">
              <div className="mx-auto mb-3 flex items-center gap-2"><span className="rounded-full bg-[#e8f7ed] px-2.5 py-1 text-[10px] font-bold text-[#16733b]">Homepage preview</span><select value={transition} onChange={(e) => setTransition(e.target.value as CarouselTransition)} className={`${inputClass} w-28`} aria-label="Slide transition"><option value="fade">Fade</option><option value="slide">Slide</option><option value="zoom">Zoom</option><option value="flip">Flip</option></select><button onClick={() => setPreviewMode(false)} className={buttonClass}>Back to edit</button></div>
              <div className={`mx-auto w-full overflow-hidden rounded-2xl border border-[#d6dae1] bg-[#fff] p-1.5 shadow-xl ${device === 'desktop' ? 'max-w-5xl' : 'max-w-[360px]'}`}><CarouselArtboard document={activeDocument} assetUrls={assetUrls} previewUrl={previewUrls[device]} active /></div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_center,#f8f9fb,#e4e7ec_70%)] p-5">
              <CarouselCanvas key={`${projectId}-${device}`} ref={canvasRef} device={device} initialDocument={activeDocument} assetUrls={assetUrls} zoom={zoom} onChange={(document) => setDocuments((current) => ({ ...current, [device]: document }))} onLayersChange={setLayers} onSelectionChange={(next) => { setSelection(next); if (next && panel === 'design') setPanel('style'); }} onHistoryChange={setHistory} />
            </div>
          )}

          <div className="carousel-studio-chrome flex h-9 shrink-0 items-center justify-between border-t border-[#eadfca] bg-[#fffdf7] px-3">
            <div className="flex gap-1"><AlignTool icon={AlignLeft} onClick={() => canvasRef.current?.align('left')} label="Align left" /><AlignTool icon={AlignCenter} onClick={() => canvasRef.current?.align('center')} label="Center" /><AlignTool icon={AlignRight} onClick={() => canvasRef.current?.align('right')} label="Align right" /><AlignTool icon={AlignHorizontalDistributeCenter} onClick={() => canvasRef.current?.distribute('horizontal')} label="Distribute horizontal" /><AlignTool icon={AlignVerticalDistributeCenter} onClick={() => canvasRef.current?.distribute('vertical')} label="Distribute vertical" /></div>
            <div className="flex items-center gap-1.5"><ZoomOut className="h-3.5 w-3.5 text-[#667085]" /><input type="range" min="0.18" max="0.8" step="0.02" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-28 accent-[#d89b12]" aria-label="Canvas zoom" /><ZoomIn className="h-3.5 w-3.5 text-[#667085]" /><span className="w-10 text-right text-[10px] font-bold text-[#667085]">{Math.round(zoom * 100)}%</span></div>
          </div>
        </main>
      </div>
    </div>
  );
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div><h2 className="text-base font-black leading-tight">{title}</h2><p className="mt-0.5 text-[11px] leading-4 text-[#667085]">{subtitle}</p></div>; }
function ToolButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) { return <button onClick={onClick} className="flex h-14 flex-col items-center justify-center gap-1 rounded-lg border border-[#dfe3e8] bg-[#fff] text-[10px] font-bold text-[#344054] shadow-sm transition hover:border-[#d89b12] hover:bg-[#fff9e8]"><Icon className="h-4 w-4 text-[#a56800]" />{label}</button>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-[#667085]">{label}</span>{children}</label>; }
function EmptySelection() { return <div className="rounded-lg border border-dashed border-[#cbd1da] bg-[#fff] p-4 text-center text-xs text-[#667085]"><MousePointer2 className="mx-auto mb-2 h-6 w-6" />Select a layer on the artboard.</div>; }
function AlignTool({ icon: Icon, onClick, label }: { icon: any; onClick: () => void; label: string }) { return <button onClick={onClick} title={label} aria-label={label} className="grid h-7 w-7 place-items-center rounded-md text-[#667085] hover:bg-[#f2f4f7] hover:text-[#101828]"><Icon className="h-3.5 w-3.5" /></button>; }
function LayerButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) { return <button onClick={onClick} title={label} aria-label={label} className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[#667085] hover:bg-[#eceff3] hover:text-[#101828]">{children}</button>; }
