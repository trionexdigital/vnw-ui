import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';

const motionPreference = vi.hoisted(() => ({ reduced: false }));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return { ...actual, useReducedMotion: () => motionPreference.reduced };
});

import { HomeHero, formatHeroCount } from '@/pages/home/components/HomeSections';

const stats = {
  delivered_numbers: 1_250,
  available_numbers: 24_000,
  customers_served: 1_000_000,
};

function renderHero(element: ReactElement) {
  return render(<MemoryRouter>{element}</MemoryRouter>);
}

describe('formatHeroCount', () => {
  const cases: Array<[number, string]> = [
    [0, '0'],
    [786, '786+'],
    [1_250, '1.3K+'],
    [24_000, '24K+'],
    [1_000_000, '1M+'],
  ];

  it.each(cases)('formats %s as %s', (value, expected) => {
    expect(formatHeroCount(value)).toBe(expected);
  });
});

describe('HomeHero', () => {
  afterEach(() => { motionPreference.reduced = false; });

  it('renders the reference brand message, CTAs, artwork, and accessible final metric values', () => {
    const { container } = renderHero(<HomeHero stats={stats} />);

    expect(screen.getByRole('heading', { name: /own a number that feels unmistakably yours/i })).toBeInTheDocument();
    expect(screen.getByText('1,250 VIP numbers delivered')).toHaveClass('sr-only');
    expect(screen.getByText('24,000 Live premium numbers')).toHaveClass('sr-only');
    expect(screen.getByText('10,00,000 Happy customers')).toHaveClass('sr-only');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore numbers/i })).toHaveAttribute('href', '/shop');
    expect(screen.getByRole('link', { name: /how it works/i })).toHaveAttribute('href', '/about');
    expect(container.querySelector('.home-hero__copy')).toHaveClass('lg:col-start-1');
    expect(container.querySelector('.home-hero__art')).toHaveClass('lg:col-start-2');
    expect(container.querySelector('.brand-stage__slogan')).toBeInTheDocument();
    expect(container.querySelector('.brand-stage__pedestal')).toBeInTheDocument();
    expect(container.querySelectorAll('.brand-stage__number-plaque')).toHaveLength(8);
    expect(container.querySelector('.home-showcase__butterflies--ambient')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.home-showcase__butterflies--focus')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.home-showcase__butterflies--mobile-art')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.home-showcase__butterflies--ambient .home-hero__butterfly')).toHaveLength(15);
    expect(container.querySelectorAll('.home-showcase__butterflies--focus .home-hero__butterfly')).toHaveLength(15);
  });

  it('reserves the metric area while the API is loading', () => {
    renderHero(<HomeHero stats={null} statsLoading />);

    expect(screen.getByRole('status', { name: /loading marketplace statistics/i })).toBeInTheDocument();
  });

  it('shows nonnumeric trust statements when metric loading fails', () => {
    renderHero(<HomeHero stats={null} statsError />);

    expect(screen.getByText('Verified listings')).toBeInTheDocument();
    expect(screen.getByText('Secure purchase')).toBeInTheDocument();
    expect(screen.getByText('Pan-India support')).toBeInTheDocument();
  });

  it('keeps ambient motion disabled when reduced motion is requested', () => {
    motionPreference.reduced = true;
    const { container } = renderHero(<HomeHero stats={stats} />);
    expect(container.querySelector('.home-hero')).not.toHaveClass('is-motion-active');
  });
});
