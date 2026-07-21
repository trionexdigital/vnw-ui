import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { NumberCategory } from '@/core/categories/types';

const apiMocks = vi.hoisted(() => ({
  categoriesList: vi.fn(),
  categoriesClassify: vi.fn(),
}));

vi.mock('@/core/api/vnwAPI', () => ({
  categoriesAPI: { list: apiMocks.categoriesList, classify: apiMocks.categoriesClassify },
  cartAPI: { add: vi.fn(), list: vi.fn(async () => ({ count: 0 })) },
  wishlistAPI: { add: vi.fn(), remove: vi.fn(), list: vi.fn(async () => ({ count: 0 })) },
  siteAPI: { settings: vi.fn(async () => ({})) },
}));

import Categories from '@/pages/categories/Categories';
import NumberCard from '@/shared/components/NumberCard';
import DetectedCategories from '@/shared/components/DetectedCategories';
import HighlightedNumber from '@/shared/components/HighlightedNumber';
import { CategorySection } from '@/pages/home/components/HomeSections';
import { getCategoryNames, getNumberCategories, getPrimaryCategory } from '@/core/categories/types';
import { buildHighlightedNumberModel, normalizeMatchSpans } from '@/core/categories/highlight';

const catalog: NumberCategory[] = [
  {
    slug: 'mirror-numbers',
    name: 'Mirror Numbers',
    description: 'Matching halves or a complete palindrome.',
    examples: ['9876598765'],
    number_count: 12,
  },
  {
    slug: '786-numbers',
    name: '786 Numbers',
    description: 'Numbers containing 786.',
    examples: ['9878600001'],
    number_count: 7,
  },
];

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current location">{location.pathname}{location.search}</output>;
}

afterEach(() => {
  cleanup();
  apiMocks.categoriesList.mockReset();
  apiMocks.categoriesClassify.mockReset();
});

describe('automatic category helpers', () => {
  it('deduplicates compatibility matches but exposes only the authoritative primary name', () => {
    const categories = getNumberCategories({
      categories: [catalog[0], catalog[0], catalog[1]],
      primary_category: catalog[0],
    });

    expect(categories.map((category) => category.slug)).toEqual(['mirror-numbers', '786-numbers']);
    expect(getPrimaryCategory({ categories })).toEqual(categories[0]);
    expect(getCategoryNames({ categories }, ' · ')).toBe('Mirror Numbers');
    expect(getNumberCategories({ category_name: 'Legacy Category', category_slug: 'legacy-category' })).toEqual([
      { slug: 'legacy-category', name: 'Legacy Category' },
    ]);
  });

  it('keeps adjacent evidence groups separate, merges overlaps, and falls back for malformed spans', () => {
    expect(normalizeMatchSpans([
      { start: 3, end: 5 },
      { start: 1, end: 3 },
      { start: 4, end: 7 },
    ], 10)).toEqual([
      { start: 1, end: 3 },
      { start: 3, end: 7 },
    ]);

    const doubling = buildHighlightedNumberModel('+91 90066 22121', [
      { start: 1, end: 3 },
      { start: 3, end: 5 },
      { start: 5, end: 7 },
    ]);
    expect(doubling.canonicalNumber).toBe('9006622121');
    expect(doubling.segments.map(({ text, matched }) => [text, matched])).toEqual([
      ['9', false],
      ['00', true],
      ['66', true],
      ['22', true],
      ['121', false],
    ]);

    const malformed = buildHighlightedNumberModel('9006622121', [{ start: -1, end: 2 }]);
    expect(malformed.hasHighlights).toBe(false);
    expect(malformed.segments.map((segment) => segment.text)).toEqual(['9006', '622', '121']);
  });

  it.each([
    ['9006136333', [{ start: 7, end: 10 }], ['9006136', '333']],
    ['9060481010', [{ start: 6, end: 10 }], ['906048', '1010']],
    ['9006859696', [{ start: 6, end: 10 }], ['900685', '9696']],
    ['9006622121', [{ start: 1, end: 3 }, { start: 3, end: 5 }, { start: 5, end: 7 }], ['9', '00', '66', '22', '121']],
    ['9060032323', [{ start: 5, end: 9 }], ['90600', '3232', '3']],
    ['7070700852', [{ start: 0, end: 2 }, { start: 2, end: 4 }, { start: 4, end: 6 }], ['70', '70', '70', '0852']],
    ['9991926234', [{ start: 0, end: 3 }], ['999', '1926234']],
  ])('renders the approved evidence grouping for %s', (number, spans, expectedGroups) => {
    expect(buildHighlightedNumberModel(number, spans).segments.map((segment) => segment.text)).toEqual(expectedGroups);
  });
});

describe('detected category preview', () => {
  it('waits for ten valid digits and renders only the primary match as a read-only chip', async () => {
    apiMocks.categoriesClassify.mockResolvedValue({
      canonical_number: '9876598765',
      categories: catalog,
      primary_category: { ...catalog[0], match_spans: [{ start: 0, end: 5 }, { start: 5, end: 10 }] },
      classifier_version: 2,
    });
    const { rerender } = render(<DetectedCategories number="98765" />);
    expect(screen.getByText(/enter a valid 10-digit mobile number/i)).toBeInTheDocument();
    expect(apiMocks.categoriesClassify).not.toHaveBeenCalled();

    rerender(<DetectedCategories number="+91 98765 98765" />);
    expect(await screen.findByText('Mirror Numbers')).toBeInTheDocument();
    expect(screen.queryByText('786 Numbers')).not.toBeInTheDocument();
    expect(apiMocks.categoriesClassify).toHaveBeenCalledWith('+91 98765 98765');
  });
});

describe('Categories page and homepage section', () => {
  it('loads searchable category cards with live counts and slug links', async () => {
    apiMocks.categoriesList.mockResolvedValue(catalog);
    const user = userEvent.setup();
    render(<MemoryRouter><Categories /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Mirror Numbers' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse mirror numbers, 12 numbers available/i })).toHaveAttribute('href', '/shop?category=mirror-numbers');
    expect(screen.getByText('2 categories')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: /search categories/i }), '786');
    expect(screen.queryByRole('heading', { name: 'Mirror Numbers' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '786 Numbers' })).toBeInTheDocument();
  });

  it('replaces featured categories without inventory with available categories', () => {
    const categories: NumberCategory[] = [
      { ...catalog[0], number_count: 0 },
      { ...catalog[1], number_count: 7 },
      { slug: 'unique-numbers', name: 'Unique Numbers', number_count: 3 },
    ];
    render(<MemoryRouter><CategorySection categories={categories} /></MemoryRouter>);

    expect(screen.queryByRole('heading', { name: 'Mirror Numbers' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '786 Numbers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Unique Numbers' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view all categories/i })).toHaveAttribute('href', '/categories');
  });
});

describe('NumberCard automatic category badges', () => {
  it('shows one primary category, highlights its evidence groups, and navigates by slug', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <NumberCard item={{
          number_id: 11,
          number_value: '9006622121',
          display_number: '90066 22121',
          title_label: 'Doubling Numbers',
          mrp: 20000,
          offer_price: 15000,
          categories: [
            catalog[0],
            catalog[1],
            { slug: 'three-digit-numbers', name: 'Three Digit Numbers' },
            { slug: 'without-248-numbers', name: 'Without 248 Numbers' },
          ],
          primary_category: {
            slug: 'doubling-numbers',
            name: 'Doubling Numbers',
            match_spans: [{ start: 1, end: 3 }, { start: 3, end: 5 }, { start: 5, end: 7 }],
          },
        }} />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Doubling Numbers' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mirror Numbers' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Doubling Numbers')).toHaveLength(1);
    expect(screen.getByText('Signature VIP Number')).toBeInTheDocument();
    expect(Array.from(container.querySelectorAll('[data-match="true"]')).map((node) => node.textContent)).toEqual(['00', '66', '22']);
    expect(screen.getByRole('img', {
      name: 'VIP number, digits 9 0 0 6 6 2 2 1 2 1. Category: Doubling Numbers. Matching digits: 00, 66, 22.',
    })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Doubling Numbers' }));
    await waitFor(() => expect(screen.getByLabelText('Current location')).toHaveTextContent('/shop?category=doubling-numbers'));
  });

  it('uses the readable 4-3-3 fallback when match evidence is malformed', () => {
    const { container } = render(
      <HighlightedNumber
        number="9876598765"
        category={{ slug: 'mirror-numbers', name: 'Mirror Numbers', match_spans: [{ start: 7, end: 12 }] }}
      />,
    );

    expect(container.querySelectorAll('[data-match="true"]')).toHaveLength(0);
    expect(Array.from(container.querySelectorAll('[data-match="false"]')).map((node) => node.textContent)).toEqual(['9876', '598', '765']);
    expect(screen.getByRole('img', { name: 'VIP number, digits 9 8 7 6 5 9 8 7 6 5. Category: Mirror Numbers.' })).toBeInTheDocument();
  });
});
