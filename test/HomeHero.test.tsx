import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import type { DealOfDayItem } from '@/core/api/vnwAPI';

const motionPreference = vi.hoisted(() => ({ reduced: false }));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return { ...actual, useReducedMotion: () => motionPreference.reduced };
});

import { HomeHero } from '@/pages/home/components/HomeSections';

const deal = (number_id: number, display_number: string, label: string): DealOfDayItem => ({
  deal_id: number_id,
  number_id,
  number_value: display_number.replace(/\s/g, ''),
  display_number,
  title_label: label,
  badge: 'PREMIUM',
  mrp: 399999,
  offer_price: 259999 - number_id,
  stock: 1,
  status: 'AVAILABLE',
  hero_label: label,
  hero_description: 'Highly desirable • Easy to remember',
  sort_order: number_id - 1,
  is_active: true,
  source: 'CURATED',
  primary_category: {
    slug: label.toLowerCase().replace(/\s+/g, '-'),
    name: label,
  },
  categories: [{
    slug: label.toLowerCase().replace(/\s+/g, '-'),
    name: label,
  }],
});

const deals = [
  deal(1, '969595 1155', 'Numerology Special'),
  deal(2, '999997 1155', 'Premium Pick'),
  deal(3, '936313 1155', 'Golden Choice'),
];

function renderHero(element: ReactElement) {
  return render(<MemoryRouter>{element}</MemoryRouter>);
}

describe('HomeHero', () => {
  afterEach(() => { motionPreference.reduced = false; });

  it('renders the screenshot-inspired deal stage while preserving the protected right artwork', () => {
    const { container } = renderHero(<HomeHero deals={deals} />);

    expect(screen.getByRole('heading', { name: /deal of the day/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /deal of the day vip numbers/i })).toHaveAttribute('aria-roledescription', 'carousel');
    expect(screen.getByRole('link', { name: '969595 1155' })).toHaveAttribute('href', '/number/1');
    expect(screen.getByRole('link', { name: /book now/i })).toHaveAttribute('href', '/checkout?number_id=1');
    expect(screen.getByText('Numerology Special')).toBeInTheDocument();
    expect(screen.getAllByText('VIP Category')).toHaveLength(3);
    expect(screen.getAllByText('Ready to Port')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Pause automatic deal rotation' })).toBeInTheDocument();
    expect(container.querySelectorAll('.deal-hero-card')).toHaveLength(3);
    expect(container.querySelector('.home-hero__copy')).toHaveClass('lg:col-start-1');
    expect(container.querySelector('.home-hero__art')).toHaveClass('lg:col-start-2');
    expect(container.querySelector('.brand-stage__slogan')).toBeInTheDocument();
    expect(container.querySelector('.brand-stage__pedestal')).toBeInTheDocument();
    expect(container.querySelectorAll('.brand-stage__number-plaque')).toHaveLength(8);
    expect(screen.getByRole('link', { name: 'Browse Mirror numbers' })).toHaveAttribute('href', '/shop?category=mirror-numbers');
    expect(screen.getByRole('link', { name: 'Browse Numerology numbers' })).toHaveAttribute('href', '/numerology');
    expect(container.querySelector('.home-showcase__butterflies--ambient')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.home-showcase__butterflies--focus')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.home-showcase__butterflies--mobile-art')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.home-showcase__butterflies--ambient .home-hero__butterfly')).toHaveLength(15);
    expect(container.querySelectorAll('.home-showcase__butterflies--focus .home-hero__butterfly')).toHaveLength(15);
  });

  it('moves to the next deal and rotates the platform in the same direction', async () => {
    const user = userEvent.setup();
    const { container } = renderHero(<HomeHero deals={deals} />);
    const ring = container.querySelector('.deal-showcase__base-ring--inner');
    expect(ring).toHaveAttribute('data-rotation', '0');

    await user.click(screen.getByRole('button', { name: 'Next deal' }));
    await waitFor(() => expect(screen.getByRole('link', { name: '999997 1155' })).toBeInTheDocument());
    expect(ring).toHaveAttribute('data-rotation', '60');
  });

  it('provides an explicit automatic-rotation control', async () => {
    const user = userEvent.setup();
    renderHero(<HomeHero deals={deals} />);
    await user.click(screen.getByRole('button', { name: 'Pause automatic deal rotation' }));
    expect(screen.getByRole('button', { name: 'Start automatic deal rotation' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('pauses the category orbit while a category is hovered or keyboard-focused', () => {
    const { container } = renderHero(<HomeHero deals={deals} />);
    const orbit = container.querySelector('.brand-stage__number-orbit');
    const mirror = screen.getByRole('link', { name: 'Browse Mirror numbers' });

    fireEvent.mouseEnter(mirror);
    expect(orbit).toHaveClass('is-paused');
    fireEvent.mouseLeave(mirror);
    expect(orbit).not.toHaveClass('is-paused');

    fireEvent.focus(mirror);
    expect(orbit).toHaveClass('is-paused');
    fireEvent.blur(mirror);
    expect(orbit).not.toHaveClass('is-paused');
  });

  it('supports one- and two-number layouts plus keyboard wraparound', () => {
    const single = renderHero(<HomeHero deals={deals.slice(0, 1)} />);
    expect(single.container.querySelectorAll('.deal-hero-card')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Next deal' })).not.toBeInTheDocument();
    single.unmount();

    const pair = renderHero(<HomeHero deals={deals.slice(0, 2)} />);
    expect(pair.container.querySelectorAll('.deal-hero-card')).toHaveLength(2);
    expect(pair.container.querySelector('[data-position="previous"]')).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('region', { name: /deal of the day vip numbers/i }), { key: 'ArrowLeft' });
    expect(screen.getByRole('link', { name: '999997 1155' })).toBeInTheDocument();
    expect(pair.container.querySelector('.deal-showcase__base-ring--inner')).toHaveAttribute('data-rotation', '-60');
  });

  it('reserves the card stage while the deals API is loading', () => {
    renderHero(<HomeHero deals={[]} dealsLoading />);
    expect(screen.getByRole('status', { name: /loading deal of the day/i })).toBeInTheDocument();
  });

  it('keeps the catalog number visible when its formatted display value is missing', () => {
    const fallbackDeal = { ...deals[0], display_number: '', number_value: '9695951155' };
    renderHero(<HomeHero deals={[fallbackDeal]} />);
    expect(screen.getByRole('link', { name: '9695951155' })).toBeInTheDocument();
  });

  it('keeps the authoritative category separate from an admin hero label', () => {
    const categorizedDeal: DealOfDayItem = {
      ...deals[0],
      hero_label: 'Lucky VIP Number',
      primary_category: { slug: 'mirror-numbers', name: 'Mirror Numbers' },
      categories: [{ slug: 'mirror-numbers', name: 'Mirror Numbers' }],
    };
    renderHero(<HomeHero deals={[categorizedDeal]} />);
    expect(screen.getByText('VIP Category')).toBeInTheDocument();
    expect(screen.getByText('Mirror Numbers')).toBeInTheDocument();
    expect(screen.getByText('Lucky VIP Number')).toBeInTheDocument();
  });

  it('uses the catalog classifier fallback when category data is unavailable', () => {
    const unclassifiedDeal: DealOfDayItem = {
      ...deals[0],
      hero_label: 'Lucky VIP Number',
      primary_category: null,
      categories: [],
      category_name: null,
      category_slug: null,
    };
    renderHero(<HomeHero deals={[unclassifiedDeal]} />);
    expect(screen.getByText('Unique Numbers')).toBeInTheDocument();
    expect(screen.getByText('Lucky VIP Number')).toBeInTheDocument();
  });

  it('renders a curated fallback state when no deal feed is available', () => {
    renderHero(<HomeHero deals={[]} dealsError />);
    expect(screen.getByText('Deals are refreshing')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore numbers/i })).toHaveAttribute('href', '/shop');
  });

  it('keeps ambient and platform rotation disabled when reduced motion is requested', async () => {
    motionPreference.reduced = true;
    const user = userEvent.setup();
    const { container } = renderHero(<HomeHero deals={deals} />);
    expect(container.querySelector('.home-hero')).not.toHaveClass('is-motion-active');
    await user.click(screen.getByRole('button', { name: 'Next deal' }));
    expect(container.querySelector('.deal-showcase__base-ring--inner')).toHaveAttribute('data-rotation', '0');
  });
});
