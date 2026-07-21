export type CarouselDevice = 'desktop' | 'mobile';
export type CarouselTransition = 'fade' | 'slide' | 'zoom' | 'flip';
export type EntranceAnimation = 'none' | 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'bounce';
export type LoopAnimation = 'none' | 'float' | 'pulse' | 'spin';

export const CAROUSEL_ARTBOARDS = {
  desktop: { width: 1600, height: 900 },
  mobile: { width: 1080, height: 1920 },
} as const;

export const CAROUSEL_FONTS = [
  'Inter',
  'Playfair Display',
  'Arial',
  'Arial Black',
  'Helvetica',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Segoe UI',
  'Georgia',
  'Garamond',
  'Times New Roman',
  'Courier New',
  'Lucida Console',
  'Impact',
] as const;

export interface CarouselFabricObject {
  type?: string;
  vnwId?: string;
  vnwAssetId?: number;
  vnwLink?: string;
  vnwAriaLabel?: string;
  vnwEntrance?: EntranceAnimation;
  vnwLoop?: LoopAnimation;
  vnwDuration?: number;
  vnwDelay?: number;
  vnwEasing?: string;
  objects?: CarouselFabricObject[];
  [key: string]: unknown;
}

export interface CarouselDocument {
  version: 1;
  artboard: { width: number; height: number };
  fabric: {
    version?: string;
    objects: CarouselFabricObject[];
    background?: string;
    [key: string]: unknown;
  };
  settings: { background: string };
}

export interface CarouselAsset {
  asset_id: number;
  purpose: 'source' | 'sticker' | 'preview-desktop' | 'preview-mobile';
  original_name: string;
  mime_type: string;
  byte_size: number;
  width: number;
  height: number;
  created_at?: string;
}

export interface CarouselProjectSummary {
  carousel_id: number;
  name: string;
  sort_order: number;
  is_published: number | boolean;
  draft_revision: number;
  published_revision?: number | null;
  draft_desktop_preview_id?: number | null;
  draft_mobile_preview_id?: number | null;
  published_desktop_preview_id?: number | null;
  published_mobile_preview_id?: number | null;
  transition_style: CarouselTransition;
  autoplay_seconds: number;
  updated_at: string;
  published_at?: string | null;
}

export interface CarouselProject extends CarouselProjectSummary {
  draft_desktop: CarouselDocument;
  draft_mobile: CarouselDocument;
  published_desktop?: CarouselDocument | null;
  published_mobile?: CarouselDocument | null;
  assets: CarouselAsset[];
}

export interface PublishedCarouselSlide {
  carousel_id: number;
  name: string;
  sort_order: number;
  published_revision: number;
  published_desktop: CarouselDocument;
  published_mobile: CarouselDocument;
  published_desktop_preview_id: number;
  published_mobile_preview_id: number;
  transition_style: CarouselTransition;
  autoplay_seconds: number;
  published_at: string;
}

let idCounter = 0;
export function createCarouselObjectId(prefix = 'layer') {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export function createBlankCarouselDocument(device: CarouselDevice, background = '#120d0a'): CarouselDocument {
  const { width, height } = CAROUSEL_ARTBOARDS[device];
  return {
    version: 1,
    artboard: { width, height },
    fabric: {
      version: '6',
      background,
      objects: [{
        type: 'Rect', vnwId: createCarouselObjectId('background'), left: 0, top: 0,
        width, height, fill: background, selectable: false, evented: false,
      }],
    },
    settings: { background },
  };
}

export function isAllowedCarouselLink(value: string) {
  const link = value.trim();
  return !link || (link.startsWith('/') && !link.startsWith('//')) || /^https?:\/\//i.test(link);
}

function visitObjects(objects: CarouselFabricObject[], visit: (object: CarouselFabricObject) => void) {
  objects.forEach((object) => {
    visit(object);
    if (Array.isArray(object.objects)) visitObjects(object.objects, visit);
  });
}

export function normalizeCarouselDocument(value: unknown, device: CarouselDevice): CarouselDocument {
  const expected = CAROUSEL_ARTBOARDS[device];
  const parsed = typeof value === 'string' ? JSON.parse(value) : structuredClone(value || {});
  if (!parsed || Number(parsed.version) !== 1 || !Array.isArray(parsed.fabric?.objects)) {
    return createBlankCarouselDocument(device);
  }
  parsed.artboard = { ...expected };
  parsed.settings = { background: parsed.settings?.background || parsed.fabric.background || '#120d0a' };
  const used = new Set<string>();
  visitObjects(parsed.fabric.objects, (object) => {
    let id = String(object.vnwId || '').trim();
    if (!id || used.has(id)) id = createCarouselObjectId('layer');
    object.vnwId = id;
    used.add(id);
    if (!isAllowedCarouselLink(String(object.vnwLink || ''))) object.vnwLink = '';
  });
  return parsed as CarouselDocument;
}

export function copyDesktopDocumentToMobile(desktop: CarouselDocument): CarouselDocument {
  const source = normalizeCarouselDocument(desktop, 'desktop');
  const target = CAROUSEL_ARTBOARDS.mobile;
  const scale = Math.min(target.width / source.artboard.width, target.height / source.artboard.height);
  const offsetX = (target.width - source.artboard.width * scale) / 2;
  const offsetY = (target.height - source.artboard.height * scale) / 2;
  const objects = structuredClone(source.fabric.objects);
  objects.forEach((object, index) => {
    if (index === 0 && object.selectable === false && Number(object.width) === source.artboard.width && Number(object.height) === source.artboard.height) {
      Object.assign(object, { left: 0, top: 0, width: target.width, height: target.height, scaleX: 1, scaleY: 1, vnwId: createCarouselObjectId('background') });
      return;
    }
    object.left = Number(object.left || 0) * scale + offsetX;
    object.top = Number(object.top || 0) * scale + offsetY;
    object.scaleX = Number(object.scaleX || 1) * scale;
    object.scaleY = Number(object.scaleY || 1) * scale;
    object.vnwId = createCarouselObjectId('layer');
  });
  return {
    version: 1,
    artboard: { ...target },
    fabric: { ...source.fabric, objects },
    settings: { ...source.settings },
  };
}

export function getCarouselDocumentIssues(document: CarouselDocument, device: CarouselDevice) {
  const issues: string[] = [];
  const expected = CAROUSEL_ARTBOARDS[device];
  if (document.artboard.width !== expected.width || document.artboard.height !== expected.height) issues.push(`Artboard must be ${expected.width}×${expected.height}.`);
  const ids = new Set<string>();
  let uploadedLayerCount = 0;
  visitObjects(document.fabric.objects, (object) => {
    if (!object.vnwId || ids.has(object.vnwId)) issues.push('Every layer needs a unique ID.');
    if (object.vnwId) ids.add(object.vnwId);
    if (object.vnwLink && !isAllowedCarouselLink(object.vnwLink)) issues.push(`Invalid link on ${object.vnwId || 'a layer'}.`);
    if (Number(object.vnwAssetId) > 0) uploadedLayerCount += 1;
  });
  if (uploadedLayerCount > 10) issues.push('An artboard can use at most 10 uploaded image/sticker layers.');
  return Array.from(new Set(issues));
}

export function serializeCarouselDocument(document: CarouselDocument): CarouselDocument {
  const copy = structuredClone(document);
  visitObjects(copy.fabric.objects, (object) => {
    if (Number(object.vnwAssetId) > 0 && typeof object.src === 'string') object.src = `asset:${object.vnwAssetId}`;
  });
  return copy;
}
