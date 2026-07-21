import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActiveSelection,
  Canvas,
  Circle,
  FabricImage,
  FabricObject,
  Gradient,
  Group,
  PencilBrush,
  Rect,
  Shadow,
  Textbox,
  Triangle,
  filters,
} from 'fabric';
import {
  CAROUSEL_ARTBOARDS,
  createCarouselObjectId,
  normalizeCarouselDocument,
  serializeCarouselDocument,
  type CarouselAsset,
  type CarouselDevice,
  type CarouselDocument,
  type EntranceAnimation,
  type LoopAnimation,
} from '@/core/carousel/types';

const CUSTOM_PROPERTIES = ['vnwId', 'vnwAssetId', 'vnwLink', 'vnwAriaLabel', 'vnwEntrance', 'vnwLoop', 'vnwDuration', 'vnwDelay', 'vnwEasing'];
(FabricObject as any).customProperties = CUSTOM_PROPERTIES;

export type LayerSnapshot = {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
};

export type SelectionSnapshot = {
  id?: string;
  type?: string;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  underline?: boolean;
  linethrough?: boolean;
  charSpacing?: number;
  lineHeight?: number;
  textBackgroundColor?: string;
  textAlign?: string;
  link?: string;
  ariaLabel?: string;
  entrance?: EntranceAnimation;
  loop?: LoopAnimation;
  duration?: number;
  delay?: number;
  cropX?: number;
  cropY?: number;
  isImage?: boolean;
  isText?: boolean;
};

export type CarouselTextStyle = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  underline?: boolean;
  linethrough?: boolean;
  charSpacing?: number;
  lineHeight?: number;
  textAlign?: string;
  fill?: string;
  textBackgroundColor?: string;
  width?: number;
};

export interface CarouselCanvasHandle {
  addText: (text?: string, style?: CarouselTextStyle) => void;
  addEmoji: (emoji: string) => void;
  addShape: (shape: 'rectangle' | 'circle' | 'triangle' | 'line') => void;
  addButton: () => void;
  addImage: (url: string, asset: CarouselAsset) => Promise<void>;
  deleteSelection: () => void;
  duplicateSelection: () => Promise<void>;
  groupSelection: () => void;
  ungroupSelection: () => void;
  setDrawing: (enabled: boolean) => void;
  updateSelection: (properties: Record<string, unknown>) => void;
  applyGradient: (from: string, to: string) => void;
  applyFilter: (filter: 'none' | 'grayscale' | 'sepia' | 'bright' | 'contrast') => void;
  applyMask: (mask: 'none' | 'circle' | 'rounded') => void;
  align: (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distribute: (direction: 'horizontal' | 'vertical') => void;
  nudgeLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  selectLayer: (id: string) => void;
  toggleLayerVisible: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  setZoom: (zoom: number) => void;
  exportDocument: () => CarouselDocument;
}

function objectName(object: any, index: number) {
  if (object.type === 'Textbox' || object.type === 'IText' || object.type === 'Text') return String(object.text || 'Text').slice(0, 28);
  if (object.type === 'Image') return `Image ${index + 1}`;
  if (object.type === 'Group') return `Group ${index + 1}`;
  if (object.type === 'Path') return `Drawing ${index + 1}`;
  return `${object.type || 'Layer'} ${index + 1}`;
}

function hydrateDocument(document: CarouselDocument, assetUrls: Map<number, string>) {
  const json = structuredClone(document.fabric) as any;
  const visit = (objects: any[]) => objects.forEach((object) => {
    const assetId = Number(object.vnwAssetId || 0);
    if (assetId && assetUrls.has(assetId)) object.src = assetUrls.get(assetId);
    if (Array.isArray(object.objects)) visit(object.objects);
  });
  visit(json.objects || []);
  return json;
}

const CarouselCanvas = forwardRef<CarouselCanvasHandle, {
  device: CarouselDevice;
  initialDocument: CarouselDocument;
  assetUrls: Map<number, string>;
  zoom: number;
  onChange: (document: CarouselDocument) => void;
  onLayersChange: (layers: LayerSnapshot[]) => void;
  onSelectionChange: (selection: SelectionSnapshot | null) => void;
  onHistoryChange: (state: { canUndo: boolean; canRedo: boolean }) => void;
}>(({ device, initialDocument, assetUrls, zoom, onChange, onLayersChange, onSelectionChange, onHistoryChange }, ref) => {
  const elementRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const loadingRef = useRef(false);
  const initialRef = useRef(normalizeCarouselDocument(initialDocument, device));
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const callbacksRef = useRef({ onChange, onLayersChange, onSelectionChange, onHistoryChange });
  const [guides, setGuides] = useState({ x: false, y: false });

  callbacksRef.current = { onChange, onLayersChange, onSelectionChange, onHistoryChange };

  const currentDocument = () => {
    const canvas = canvasRef.current;
    const size = CAROUSEL_ARTBOARDS[device];
    const fabric = canvas ? canvas.toJSON() as any : initialRef.current.fabric;
    return serializeCarouselDocument({
      version: 1,
      artboard: { ...size },
      fabric,
      settings: { background: String((fabric as any).background || initialRef.current.settings.background || '#120d0a') },
    });
  };

  const emitSelection = () => {
    const object = canvasRef.current?.getActiveObject() as any;
    if (!object) { callbacksRef.current.onSelectionChange(null); return; }
    callbacksRef.current.onSelectionChange({
      id: object.vnwId, type: object.type, text: typeof object.text === 'string' ? object.text : undefined,
      fill: typeof object.fill === 'string' ? object.fill : undefined,
      stroke: typeof object.stroke === 'string' ? object.stroke : undefined, strokeWidth: Number(object.strokeWidth || 0),
      opacity: Number(object.opacity ?? 1), fontFamily: object.fontFamily, fontSize: object.fontSize,
      fontWeight: object.fontWeight, fontStyle: object.fontStyle, underline: Boolean(object.underline),
      linethrough: Boolean(object.linethrough), charSpacing: Number(object.charSpacing ?? 0),
      lineHeight: Number(object.lineHeight ?? 1.16),
      textBackgroundColor: typeof object.textBackgroundColor === 'string' ? object.textBackgroundColor : undefined,
      textAlign: object.textAlign, link: object.vnwLink || '', ariaLabel: object.vnwAriaLabel || '',
      entrance: object.vnwEntrance || 'none', loop: object.vnwLoop || 'none', duration: Number(object.vnwDuration || 650), delay: Number(object.vnwDelay || 0),
      cropX: Number(object.cropX || 0), cropY: Number(object.cropY || 0), isImage: object.type === 'Image',
      isText: ['Textbox', 'IText', 'Text'].includes(object.type),
    });
  };

  const emitLayers = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    callbacksRef.current.onLayersChange(canvas.getObjects().map((object: any, index) => ({
      id: String(object.vnwId || ''), name: objectName(object, index), type: object.type,
      visible: object.visible !== false, locked: object.selectable === false && object.evented === false,
    })).reverse());
  };

  const updateHistoryState = () => callbacksRef.current.onHistoryChange({
    canUndo: historyIndexRef.current > 0,
    canRedo: historyIndexRef.current >= 0 && historyIndexRef.current < historyRef.current.length - 1,
  });

  const record = () => {
    if (loadingRef.current || !canvasRef.current) return;
    const json = JSON.stringify(currentDocument());
    if (historyRef.current[historyIndexRef.current] === json) return;
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    if (historyRef.current.length > 60) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
    callbacksRef.current.onChange(JSON.parse(json));
    emitLayers(); emitSelection(); updateHistoryState();
  };

  const loadHistory = async (index: number) => {
    const canvas = canvasRef.current;
    const json = historyRef.current[index];
    if (!canvas || !json) return;
    loadingRef.current = true;
    const document = JSON.parse(json) as CarouselDocument;
    await canvas.loadFromJSON(hydrateDocument(document, assetUrls));
    canvas.requestRenderAll();
    historyIndexRef.current = index;
    loadingRef.current = false;
    callbacksRef.current.onChange(document);
    emitLayers(); emitSelection(); updateHistoryState();
  };

  useEffect(() => {
    if (!elementRef.current) return;
    const size = CAROUSEL_ARTBOARDS[device];
    const canvas = new Canvas(elementRef.current, {
      width: size.width, height: size.height, preserveObjectStacking: true,
      selection: true, backgroundColor: initialRef.current.settings.background,
    });
    canvasRef.current = canvas;
    loadingRef.current = true;
    canvas.loadFromJSON(hydrateDocument(initialRef.current, assetUrls)).then(() => {
      canvas.requestRenderAll();
      loadingRef.current = false;
      const initial = JSON.stringify(currentDocument());
      historyRef.current = [initial]; historyIndexRef.current = 0;
      emitLayers(); updateHistoryState();
    });

    const changed = () => record();
    canvas.on('object:modified', changed);
    canvas.on('object:added', changed);
    canvas.on('object:removed', changed);
    canvas.on('path:created', changed);
    canvas.on('text:changed', changed);
    canvas.on('selection:created', emitSelection);
    canvas.on('selection:updated', emitSelection);
    canvas.on('selection:cleared', emitSelection);
    canvas.on('object:moving', ({ target }) => {
      if (!target) return;
      const center = target.getCenterPoint();
      const snap = 12;
      let x = false; let y = false;
      if (Math.abs(center.x - size.width / 2) < snap) { target.set({ left: Number(target.left || 0) + size.width / 2 - center.x }); x = true; }
      if (Math.abs(center.y - size.height / 2) < snap) { target.set({ top: Number(target.top || 0) + size.height / 2 - center.y }); y = true; }
      setGuides({ x, y });
    });
    canvas.on('mouse:up', () => setGuides({ x: false, y: false }));

    const keyboard = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (event.target as HTMLElement)?.isContentEditable) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? loadHistory(historyIndexRef.current + 1) : loadHistory(historyIndexRef.current - 1); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') { event.preventDefault(); void api.duplicateSelection(); return; }
      const object = canvas.getActiveObject();
      if (!object) return;
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); api.deleteSelection(); return; }
      const step = event.shiftKey ? 10 : 1;
      if (event.key === 'ArrowLeft') object.set({ left: Number(object.left || 0) - step });
      else if (event.key === 'ArrowRight') object.set({ left: Number(object.left || 0) + step });
      else if (event.key === 'ArrowUp') object.set({ top: Number(object.top || 0) - step });
      else if (event.key === 'ArrowDown') object.set({ top: Number(object.top || 0) + step });
      else return;
      event.preventDefault(); object.setCoords(); canvas.requestRenderAll(); record();
    };
    window.addEventListener('keydown', keyboard);
    return () => { window.removeEventListener('keydown', keyboard); canvas.dispose(); canvasRef.current = null; };
    // Canvas is intentionally recreated when switching device via the parent's key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const size = CAROUSEL_ARTBOARDS[device];
    canvasRef.current?.setDimensions({ width: Math.round(size.width * zoom), height: Math.round(size.height * zoom) }, { cssOnly: true });
  }, [device, zoom]);

  const add = (object: FabricObject) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    (object as any).vnwId = createCarouselObjectId(object.type?.toLowerCase() || 'layer');
    (object as any).vnwEntrance = 'none'; (object as any).vnwLoop = 'none';
    canvas.add(object); canvas.setActiveObject(object); canvas.requestRenderAll(); record();
  };

  const api: CarouselCanvasHandle = {
    addText: (text = 'Add your message', style = {}) => add(new Textbox(text, {
      left: 160,
      top: 160,
      width: device === 'desktop' ? 720 : 760,
      fontFamily: 'Inter',
      fontSize: device === 'desktop' ? 76 : 92,
      fontWeight: '700',
      fill: '#ffffff',
      lineHeight: 1.05,
      ...style,
    })),
    addEmoji: (emoji) => add(new Textbox(emoji, { left: 220, top: 220, width: 240, fontSize: device === 'desktop' ? 130 : 180, fill: '#ffffff' })),
    addShape: (shape) => {
      const common = { left: 220, top: 220, fill: '#f5bd42', stroke: '#ffffff', strokeWidth: 0 };
      if (shape === 'circle') add(new Circle({ ...common, radius: 140 }));
      else if (shape === 'triangle') add(new Triangle({ ...common, width: 300, height: 260 }));
      else if (shape === 'line') add(new Rect({ ...common, width: 420, height: 14, rx: 7, ry: 7 }));
      else add(new Rect({ ...common, width: 420, height: 240, rx: 34, ry: 34 }));
    },
    addButton: () => {
      const rect = new Rect({ width: 430, height: 105, rx: 50, ry: 50, fill: '#f5bd42', shadow: new Shadow({ color: 'rgba(0,0,0,.3)', blur: 24, offsetY: 12 }) });
      const text = new Textbox('Explore numbers →', { left: 52, top: 32, width: 340, fontFamily: 'Inter', fontSize: 30, fontWeight: '700', fill: '#1a1108', textAlign: 'center' });
      const group = new Group([rect, text], { left: 220, top: 630 });
      (group as any).vnwLink = '/shop'; (group as any).vnwAriaLabel = 'Explore VIP numbers';
      add(group);
    },
    addImage: async (url, asset) => {
      const image = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      const maxWidth = CAROUSEL_ARTBOARDS[device].width * 0.62;
      const maxHeight = CAROUSEL_ARTBOARDS[device].height * 0.62;
      const scale = Math.min(maxWidth / Number(image.width || 1), maxHeight / Number(image.height || 1), 1);
      image.set({ left: 180, top: 180, scaleX: scale, scaleY: scale });
      (image as any).vnwAssetId = asset.asset_id;
      add(image);
    },
    deleteSelection: () => {
      const canvas = canvasRef.current; const active = canvas?.getActiveObjects() || [];
      if (!canvas || !active.length) return;
      active.filter((object: any) => object.selectable !== false || object.evented !== false).forEach((object) => canvas.remove(object));
      canvas.discardActiveObject(); canvas.requestRenderAll(); record();
    },
    duplicateSelection: async () => {
      const canvas = canvasRef.current; const active = canvas?.getActiveObject();
      if (!canvas || !active) return;
      const clone = await active.clone(CUSTOM_PROPERTIES) as FabricObject;
      clone.set({ left: Number(active.left || 0) + 36, top: Number(active.top || 0) + 36 });
      (clone as any).vnwId = createCarouselObjectId('layer');
      canvas.add(clone); canvas.setActiveObject(clone); canvas.requestRenderAll(); record();
    },
    groupSelection: () => {
      const canvas = canvasRef.current; const active = canvas?.getActiveObject();
      if (!canvas || !(active instanceof ActiveSelection)) return;
      const objects = active.getObjects(); canvas.discardActiveObject(); canvas.remove(...objects);
      const group = new Group(objects); (group as any).vnwId = createCarouselObjectId('group');
      canvas.add(group); canvas.setActiveObject(group); canvas.requestRenderAll(); record();
    },
    ungroupSelection: () => {
      const canvas = canvasRef.current; const active = canvas?.getActiveObject();
      if (!canvas || !(active instanceof Group)) return;
      const objects = active.removeAll(); canvas.remove(active); canvas.add(...objects);
      canvas.setActiveObject(new ActiveSelection(objects, { canvas })); canvas.requestRenderAll(); record();
    },
    setDrawing: (enabled) => {
      const canvas = canvasRef.current; if (!canvas) return;
      canvas.isDrawingMode = enabled;
      if (enabled) { canvas.freeDrawingBrush = new PencilBrush(canvas); canvas.freeDrawingBrush.color = '#f5bd42'; canvas.freeDrawingBrush.width = 10; }
    },
    updateSelection: (properties) => {
      const canvas = canvasRef.current; const active = canvas?.getActiveObject() as any;
      if (!canvas || !active) return;
      const mapped = { ...properties } as any;
      if ('link' in mapped) { mapped.vnwLink = mapped.link; delete mapped.link; }
      if ('ariaLabel' in mapped) { mapped.vnwAriaLabel = mapped.ariaLabel; delete mapped.ariaLabel; }
      if ('entrance' in mapped) { mapped.vnwEntrance = mapped.entrance; delete mapped.entrance; }
      if ('loop' in mapped) { mapped.vnwLoop = mapped.loop; delete mapped.loop; }
      if ('duration' in mapped) { mapped.vnwDuration = Number(mapped.duration); delete mapped.duration; }
      if ('delay' in mapped) { mapped.vnwDelay = Number(mapped.delay); delete mapped.delay; }
      const refresh = () => {
        if (active instanceof Textbox) active.initDimensions();
        active.setCoords();
        canvas.requestRenderAll();
        emitSelection();
        record();
      };
      active.set(mapped);
      refresh();

      const changesFontMetrics = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle']
        .some((property) => Object.prototype.hasOwnProperty.call(mapped, property));
      if (changesFontMetrics && active instanceof Textbox && typeof document !== 'undefined' && document.fonts) {
        const family = String(active.fontFamily || 'Inter').replace(/["\\]/g, '');
        const font = `${String(active.fontStyle || 'normal')} ${String(active.fontWeight || '400')} ${Number(active.fontSize || 16)}px "${family}"`;
        void document.fonts.load(font).then(refresh).catch(() => undefined);
      }
    },
    applyGradient: (from, to) => {
      const active = canvasRef.current?.getActiveObject(); if (!active) return;
      active.set('fill', new Gradient({ type: 'linear', gradientUnits: 'percentage', coords: { x1: 0, y1: 0, x2: 1, y2: 1 }, colorStops: [{ offset: 0, color: from }, { offset: 1, color: to }] }));
      canvasRef.current?.requestRenderAll(); record();
    },
    applyFilter: (filter) => {
      const image = canvasRef.current?.getActiveObject(); if (!(image instanceof FabricImage)) return;
      image.filters = filter === 'none' ? [] : filter === 'grayscale' ? [new filters.Grayscale()] : filter === 'sepia' ? [new filters.Sepia()] : filter === 'bright' ? [new filters.Brightness({ brightness: 0.18 })] : [new filters.Contrast({ contrast: 0.2 })];
      image.applyFilters(); canvasRef.current?.requestRenderAll(); record();
    },
    applyMask: (mask) => {
      const image = canvasRef.current?.getActiveObject(); if (!(image instanceof FabricImage)) return;
      if (mask === 'none') image.set({ clipPath: undefined });
      else if (mask === 'circle') image.set({ clipPath: new Circle({ radius: Math.min(Number(image.width), Number(image.height)) / 2, originX: 'center', originY: 'center' }) });
      else image.set({ clipPath: new Rect({ width: Number(image.width), height: Number(image.height), rx: 80, ry: 80, originX: 'center', originY: 'center' }) });
      canvasRef.current?.requestRenderAll(); record();
    },
    align: (mode) => {
      const canvas = canvasRef.current; const active = canvas?.getActiveObject(); if (!canvas || !active) return;
      const size = CAROUSEL_ARTBOARDS[device]; const bounds = active.getBoundingRect();
      if (mode === 'left') active.set({ left: Number(active.left || 0) - bounds.left });
      if (mode === 'right') active.set({ left: Number(active.left || 0) + size.width - (bounds.left + bounds.width) });
      if (mode === 'center') active.set({ left: Number(active.left || 0) + size.width / 2 - (bounds.left + bounds.width / 2) });
      if (mode === 'top') active.set({ top: Number(active.top || 0) - bounds.top });
      if (mode === 'bottom') active.set({ top: Number(active.top || 0) + size.height - (bounds.top + bounds.height) });
      if (mode === 'middle') active.set({ top: Number(active.top || 0) + size.height / 2 - (bounds.top + bounds.height / 2) });
      active.setCoords(); canvas.requestRenderAll(); record();
    },
    distribute: (direction) => {
      const canvas = canvasRef.current; const active = canvas?.getActiveObject(); if (!canvas || !(active instanceof ActiveSelection)) return;
      const objects = active.getObjects().sort((a, b) => direction === 'horizontal' ? Number(a.left) - Number(b.left) : Number(a.top) - Number(b.top));
      if (objects.length < 3) return;
      const first = Number(direction === 'horizontal' ? objects[0].left : objects[0].top);
      const last = Number(direction === 'horizontal' ? objects.at(-1)?.left : objects.at(-1)?.top);
      objects.slice(1, -1).forEach((object, index) => object.set(direction === 'horizontal' ? { left: first + (last - first) * (index + 1) / (objects.length - 1) } : { top: first + (last - first) * (index + 1) / (objects.length - 1) }));
      canvas.requestRenderAll(); record();
    },
    nudgeLayer: (id, direction) => {
      const canvas = canvasRef.current; const object = canvas?.getObjects().find((item: any) => item.vnwId === id); if (!canvas || !object) return;
      if (direction === 'up') canvas.bringObjectForward(object); else if (direction === 'down') canvas.sendObjectBackwards(object);
      else canvas.moveObjectTo(object, direction === 'top' ? canvas.getObjects().length - 1 : 0);
      canvas.requestRenderAll(); record();
    },
    selectLayer: (id) => { const canvas = canvasRef.current; const object = canvas?.getObjects().find((item: any) => item.vnwId === id); if (canvas && object) { canvas.setActiveObject(object); canvas.requestRenderAll(); emitSelection(); } },
    toggleLayerVisible: (id) => { const canvas = canvasRef.current; const object = canvas?.getObjects().find((item: any) => item.vnwId === id); if (canvas && object) { object.set({ visible: object.visible === false }); canvas.requestRenderAll(); emitLayers(); record(); } },
    toggleLayerLock: (id) => { const canvas = canvasRef.current; const object: any = canvas?.getObjects().find((item: any) => item.vnwId === id); if (canvas && object) { const locked = object.selectable === false && object.evented === false; object.set({ selectable: locked, evented: locked, lockMovementX: !locked, lockMovementY: !locked, lockScalingX: !locked, lockScalingY: !locked, lockRotation: !locked }); canvas.requestRenderAll(); emitLayers(); record(); } },
    undo: () => { if (historyIndexRef.current > 0) void loadHistory(historyIndexRef.current - 1); },
    redo: () => { if (historyIndexRef.current < historyRef.current.length - 1) void loadHistory(historyIndexRef.current + 1); },
    reset: () => { void (async () => { const canvas = canvasRef.current; if (!canvas) return; loadingRef.current = true; await canvas.loadFromJSON(hydrateDocument(initialRef.current, assetUrls)); loadingRef.current = false; canvas.requestRenderAll(); record(); })(); },
    setZoom: () => undefined,
    exportDocument: currentDocument,
  };

  useImperativeHandle(ref, () => api);

  return (
    <div className="relative mx-auto bg-[#fff] shadow-[0_16px_46px_rgba(16,24,40,.2)] ring-1 ring-[rgba(16,24,40,.08)]" style={{ width: CAROUSEL_ARTBOARDS[device].width * zoom, height: CAROUSEL_ARTBOARDS[device].height * zoom }}>
      <canvas ref={elementRef} />
      {guides.x && <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-px bg-fuchsia-500" />}
      {guides.y && <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-px bg-fuchsia-500" />}
    </div>
  );
});

CarouselCanvas.displayName = 'CarouselCanvas';
export default CarouselCanvas;
