import type { Area } from 'react-easy-crop';

export const CAROUSEL_ASPECT = 16 / 5;
export const CAROUSEL_OUTPUT_WIDTH = 1600;
export const CAROUSEL_OUTPUT_HEIGHT = 500;
export const CAROUSEL_MAX_SOURCE_BYTES = 10 * 1024 * 1024;
export const CAROUSEL_MAX_DATA_URL_LENGTH = 4 * 1024 * 1024;
export const DEFAULT_CAROUSEL_CONTENT_X = 25;
export const DEFAULT_CAROUSEL_CONTENT_Y = 62;

export function normalizeCarouselPosition(value: unknown, fallback: number) {
  const position = Number(value);
  if (!Number.isFinite(position)) return fallback;
  return Math.round(Math.max(8, Math.min(92, position)));
}

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('The selected image could not be opened.')));
    image.src = source;
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result || '')));
    reader.addEventListener('error', () => reject(new Error('The selected image could not be read.')));
    reader.readAsDataURL(file);
  });
}

export async function prepareCarouselSource(file: File) {
  if (!acceptedTypes.has(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
  if (file.size > CAROUSEL_MAX_SOURCE_BYTES) throw new Error('Choose an image smaller than 10 MB.');

  const source = await fileToDataUrl(file);
  const image = await loadImage(source);
  if (image.naturalWidth < 1200 || image.naturalHeight < 375) {
    throw new Error('For a sharp carousel, choose an image at least 1200 × 375 pixels.');
  }
  return source;
}

export async function cropCarouselImage(source: string, crop: Area) {
  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image cropping is not supported in this browser.');

  canvas.width = CAROUSEL_OUTPUT_WIDTH;
  canvas.height = CAROUSEL_OUTPUT_HEIGHT;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    Math.max(0, Math.round(crop.x)),
    Math.max(0, Math.round(crop.y)),
    Math.max(1, Math.round(crop.width)),
    Math.max(1, Math.round(crop.height)),
    0,
    0,
    CAROUSEL_OUTPUT_WIDTH,
    CAROUSEL_OUTPUT_HEIGHT,
  );

  const result = canvas.toDataURL('image/webp', 0.88);
  if (result.length > CAROUSEL_MAX_DATA_URL_LENGTH) {
    throw new Error('The cropped image is still too large. Try a less detailed source image.');
  }
  return result;
}
