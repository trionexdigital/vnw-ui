import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HomeCarousel from '@/pages/home/components/HomeCarousel';
import type { CarouselSlide } from '@/core/api/vnwAPI';

const slides: CarouselSlide[] = [
  {
    banner_id: 1,
    eyebrow: 'Curated drop',
    title: 'Signature number collection',
    subtitle: 'Discover memorable premium combinations.',
    image: 'data:image/webp;base64,AAAA',
    cta_text: 'Explore numbers',
    cta_link: '/shop',
    content_x: 36,
    content_y: 54,
    is_active: 1,
    sort_order: 0,
  },
  {
    banner_id: 2,
    title: 'Guided VIP transfer',
    subtitle: 'Secure support from purchase to activation.',
    image: 'data:image/webp;base64,BBBB',
    is_active: 1,
    sort_order: 1,
  },
];

function renderCarousel(items = slides, loading = false) {
  return render(<MemoryRouter><HomeCarousel slides={items} loading={loading} /></MemoryRouter>);
}

describe('HomeCarousel', () => {
  afterEach(cleanup);

  it('renders an accessible managed slide and its internal CTA', () => {
    const { container } = renderCarousel();

    const region = screen.getByRole('region', { name: 'Featured promotions' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    expect(region.className).not.toMatch(/\bpy-/);
    expect(screen.getByRole('img', { name: 'Signature number collection' })).toBeInTheDocument();
    expect(screen.getByText('Curated drop')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore numbers/i })).toHaveAttribute('href', '/shop');
    expect(screen.getByRole('button', { name: /pause carousel autoplay/i })).toBeInTheDocument();
    expect(container.querySelector('.home-carousel__copy')).toHaveStyle({ '--carousel-content-x': '36%', '--carousel-content-y': '54%' });
    expect(container.querySelector('.home-carousel__frame')).toHaveClass('h-[420px]', 'xl:h-[560px]');
    expect(container.querySelector('.home-carousel__frame')).not.toHaveClass('border');
  });

  it('moves to the next managed slide with the carousel control', async () => {
    const user = userEvent.setup();
    renderCarousel();

    await user.click(screen.getByRole('button', { name: /show next promotion/i }));
    await waitFor(() => expect(screen.getByRole('img', { name: 'Guided VIP transfer' })).toBeInTheDocument());
  });

  it('reserves the carousel frame while loading', () => {
    renderCarousel([], true);
    expect(screen.getByRole('region', { name: /loading homepage carousel/i })).toBeInTheDocument();
  });

  it('renders nothing when no active image slides are returned', () => {
    const { container } = renderCarousel([]);
    expect(container).toBeEmptyDOMElement();
  });
});
