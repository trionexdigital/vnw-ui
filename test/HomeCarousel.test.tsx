import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomeCarousel from '@/pages/home/components/HomeCarousel';
import type { CarouselDocument, PublishedCarouselSlide } from '@/core/carousel/types';

vi.mock('@/core/api/vnwAPI', () => ({
  carouselAPI: {
    assetBlob: vi.fn(async () => new Blob(['asset'], { type: 'image/png' })),
    previewBlob: vi.fn(async () => new Blob(['preview'], { type: 'image/jpeg' })),
  },
}));

vi.mock('@/shared/components/carousel/CarouselArtboard', () => ({
  default: ({ document, previewUrl }: { document: CarouselDocument; previewUrl: string }) => <img alt={String(document.fabric.objects[0]?.vnwAriaLabel || 'Carousel artwork')} data-preview-ready={String(Boolean(previewUrl))} src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />,
  collectCarouselAssetIds: () => [],
}));

Object.defineProperties(URL, {
  createObjectURL: { configurable: true, value: vi.fn(() => 'blob:carousel-preview') },
  revokeObjectURL: { configurable: true, value: vi.fn() },
});

const desktop = (label: string): CarouselDocument => ({
  version: 1,
  artboard: { width: 1600, height: 900 },
  settings: { background: '#111' },
  fabric: { objects: [{ type: 'Rect', vnwId: label, vnwAriaLabel: label, width: 1600, height: 900 }] },
});
const mobile = (label: string): CarouselDocument => ({
  version: 1,
  artboard: { width: 1080, height: 1920 },
  settings: { background: '#111' },
  fabric: { objects: [{ type: 'Rect', vnwId: label, vnwAriaLabel: label, width: 1080, height: 1920 }] },
});

const slides: PublishedCarouselSlide[] = [
  { carousel_id: 1, name: 'Signature collection', sort_order: 0, published_revision: 2, published_desktop: desktop('Signature artwork'), published_mobile: mobile('Signature mobile artwork'), published_desktop_preview_id: 11, published_mobile_preview_id: 12, transition_style: 'fade', autoplay_seconds: 6, published_at: '2026-01-01' },
  { carousel_id: 2, name: 'Guided transfer', sort_order: 1, published_revision: 1, published_desktop: desktop('Transfer artwork'), published_mobile: mobile('Transfer mobile artwork'), published_desktop_preview_id: 21, published_mobile_preview_id: 22, transition_style: 'slide', autoplay_seconds: 6, published_at: '2026-01-02' },
];

describe('HomeCarousel', () => {
  afterEach(cleanup);

  it('renders the complete production artboard in an exact-ratio card', async () => {
    const { container } = render(<HomeCarousel slides={slides} />);
    expect(screen.getByRole('region', { name: 'Featured VIP number stories' })).toHaveAttribute('aria-roledescription', 'carousel');
    await waitFor(() => expect(screen.getByRole('img', { name: 'Signature artwork' })).toHaveAttribute('data-preview-ready', 'true'));
    expect((container.querySelector('[aria-roledescription="slide"]') as HTMLElement).style.aspectRatio).toBe('1600/900');
    expect(container.querySelector('.object-cover')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause carousel' })).toBeInTheDocument();
  });

  it('moves to the next published slide', async () => {
    const user = userEvent.setup();
    render(<HomeCarousel slides={slides} />);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    await waitFor(() => expect(screen.getByRole('img', { name: 'Transfer artwork' })).toBeInTheDocument());
  });

  it('reserves a no-crop frame while loading and renders nothing when empty', () => {
    const { rerender, container } = render(<HomeCarousel slides={[]} loading />);
    expect(screen.getByRole('region', { name: /loading/i })).toBeInTheDocument();
    rerender(<HomeCarousel slides={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
