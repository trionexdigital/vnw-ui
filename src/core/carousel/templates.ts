import { CAROUSEL_ARTBOARDS, createBlankCarouselDocument, createCarouselObjectId, type CarouselDevice, type CarouselDocument, type CarouselFabricObject } from './types';

type TemplateDefinition = { id: string; name: string; description: string; colors: [string, string]; title: string; subtitle: string; accent: string };

export const CAROUSEL_TEMPLATES: TemplateDefinition[] = [
  { id: 'luxury', name: 'Midnight Luxury', description: 'Dark editorial promotion', colors: ['#0f0a08', '#2d190d'], title: 'A number as rare as you are.', subtitle: 'Discover premium VIP numbers curated for unforgettable identities.', accent: '#f5bd42' },
  { id: 'festival', name: 'Festival Gold', description: 'High-energy seasonal offer', colors: ['#56198f', '#e09a16'], title: 'The premium number festival.', subtitle: 'Find striking patterns and limited-time offers in one beautiful collection.', accent: '#fff4cc' },
  { id: 'minimal', name: 'Quiet Premium', description: 'Clean and sophisticated', colors: ['#f8f5ee', '#e7ddcc'], title: 'Simple. Personal. Unmistakable.', subtitle: 'Your next VIP number deserves a presentation this considered.', accent: '#6e4e22' },
  { id: 'neon', name: 'Electric Drop', description: 'Bold digital release', colors: ['#07111d', '#241052'], title: 'New numbers just dropped.', subtitle: 'Explore memorable combinations before they are gone.', accent: '#43f6ce' },
  { id: 'business', name: 'Business Signature', description: 'Professional lead campaign', colors: ['#081c2c', '#164c63'], title: 'Make every call memorable.', subtitle: 'Premium business numbers built for brands that intend to be remembered.', accent: '#7de0ff' },
  { id: 'romance', name: 'Lucky Story', description: 'Warm personal campaign', colors: ['#43122d', '#a7335d'], title: 'A lucky number with your story.', subtitle: 'Discover patterns inspired by birthdays, milestones, and meaningful dates.', accent: '#ffd0df' },
];

function textLayer(text: string, props: Record<string, unknown>): CarouselFabricObject {
  return { type: 'Textbox', vnwId: createCarouselObjectId('text'), text, fontFamily: 'Inter', fill: '#ffffff', ...props };
}

export function createTemplateDocument(templateId: string, device: CarouselDevice): CarouselDocument {
  const definition = CAROUSEL_TEMPLATES.find((template) => template.id === templateId);
  if (!definition) return createBlankCarouselDocument(device);
  const { width, height } = CAROUSEL_ARTBOARDS[device];
  const mobile = device === 'mobile';
  const document = createBlankCarouselDocument(device, definition.colors[0]);
  const gradient = {
    type: 'linear', coords: { x1: 0, y1: 0, x2: width, y2: height },
    colorStops: [{ offset: 0, color: definition.colors[0] }, { offset: 1, color: definition.colors[1] }],
  };
  document.fabric.objects[0].fill = gradient;
  document.fabric.objects.push(
    { type: 'Circle', vnwId: createCarouselObjectId('shape'), left: mobile ? 610 : 1050, top: mobile ? 170 : -120, radius: mobile ? 360 : 420, fill: definition.accent, opacity: 0.12, selectable: true },
    textLayer('VIP NUMBER WORLD', { left: mobile ? 90 : 120, top: mobile ? 210 : 130, width: mobile ? 900 : 1000, fontSize: mobile ? 34 : 30, fontWeight: '700', charSpacing: 160, fill: definition.accent, vnwEntrance: 'fade' }),
    textLayer(definition.title, { left: mobile ? 90 : 120, top: mobile ? 430 : 245, width: mobile ? 900 : 1050, fontSize: mobile ? 105 : 98, fontWeight: '800', lineHeight: 0.98, vnwEntrance: 'slide-up', vnwDuration: 700 }),
    textLayer(definition.subtitle, { left: mobile ? 95 : 125, top: mobile ? 890 : 555, width: mobile ? 860 : 850, fontSize: mobile ? 42 : 34, lineHeight: 1.25, opacity: 0.82, vnwEntrance: 'fade', vnwDelay: 250 }),
    { type: 'Rect', vnwId: createCarouselObjectId('button'), left: mobile ? 90 : 120, top: mobile ? 1260 : 710, width: mobile ? 590 : 430, height: mobile ? 126 : 88, rx: 36, ry: 36, fill: definition.accent, vnwLink: '/shop', vnwAriaLabel: 'Explore VIP numbers', vnwEntrance: 'zoom', shadow: { color: 'rgba(0,0,0,.25)', blur: 24, offsetX: 0, offsetY: 12 } },
    textLayer('Explore numbers  →', { left: mobile ? 135 : 164, top: mobile ? 1296 : 737, width: mobile ? 500 : 350, fontSize: mobile ? 42 : 27, fontWeight: '800', fill: definition.colors[0], selectable: false, evented: false }),
  );
  return document;
}

