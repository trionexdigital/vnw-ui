import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import SearchWorkbench from '@/pages/shop/SearchWorkbench';
import {
  listPayloadFromParams,
  readSearchState,
  writeSearchState,
} from '@/pages/shop/searchTypes';

function LocationValue() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function renderWorkbench(initialEntry = '/shop', placement: 'home' | 'shop' = 'shop') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SearchWorkbench placement={placement} />
      <LocationValue />
    </MemoryRouter>,
  );
}

describe('SearchWorkbench', () => {
  it('exposes four accessible search tabs and defaults to AI search', () => {
    renderWorkbench();
    expect(screen.getByRole('tab', { name: 'AI Search' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Global Search' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Search by Price' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Advanced Search' })).toBeInTheDocument();
  });

  it('serializes global edge matching into refreshable URL parameters', async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.click(screen.getByRole('tab', { name: 'Global Search' }));
    await user.selectOptions(screen.getByLabelText('Match position'), 'ends_with');
    await user.type(screen.getByLabelText('Digits'), '786');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/shop?mode=global&global_scope=ends_with&q=786');
  });

  it('keeps an active sidebar price range when a search predicate changes', async () => {
    const user = userEvent.setup();
    renderWorkbench('/shop?price_min=3001&price_max=5000');
    await user.click(screen.getByRole('tab', { name: 'Global Search' }));
    await user.type(screen.getByLabelText('Digits'), '55');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    const location = screen.getByTestId('location').textContent || '';
    expect(location).toContain('price_min=3001');
    expect(location).toContain('price_max=5000');
    expect(location).toContain('q=55');
  });

  it('bypasses AI for pure-digit input and performs an Anywhere search', async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.type(screen.getByLabelText('Describe the number you want'), '9999');
    await user.click(screen.getByRole('button', { name: 'Ask AI' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/shop?mode=global&global_scope=anywhere&q=9999');
  });

  it('serializes the shared inclusive price bands', async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.click(screen.getByRole('tab', { name: 'Search by Price' }));
    await user.selectOptions(screen.getByLabelText('Inclusive price range'), '10001:30000');
    await user.click(screen.getByRole('button', { name: 'Show Numbers' }));

    const location = screen.getByTestId('location').textContent || '';
    expect(location).toContain('mode=price');
    expect(location).toContain('price_min=10001');
    expect(location).toContain('price_max=30000');
  });

  it('shows inline validation for an incomplete exact mask', async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.click(screen.getByRole('tab', { name: 'Advanced Search' }));
    await user.click(screen.getByRole('button', { name: /Exact ten-position mask/i }));
    await user.type(screen.getByLabelText('Ten-position exact mask'), '98??');
    await user.click(screen.getByRole('button', { name: 'Apply Search' }));

    expect(screen.getByText('Use exactly 10 positions containing digits or ? wildcards.')).toBeInTheDocument();
    expect(screen.getByLabelText('Ten-position exact mask')).toHaveAttribute('aria-invalid', 'true');
  });

  it('opens Advanced Search as a modal and discards an uncommitted draft on cancel', async () => {
    const user = userEvent.setup();
    renderWorkbench();
    const advancedTab = screen.getByRole('tab', { name: 'Advanced Search' });

    await user.click(advancedTab);
    expect(screen.getByRole('dialog', { name: 'Advanced VIP Number Search' })).toBeInTheDocument();
    expect(document.body).toHaveAttribute('data-scroll-locked');
    await user.type(screen.getByLabelText('Starts With'), '98');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('location')).toHaveTextContent('/shop');

    await user.click(advancedTab);
    expect(screen.getByLabelText('Starts With')).toHaveValue('');
  });

  it('resets only the Advanced Search draft and returns focus on Escape', async () => {
    const user = userEvent.setup();
    renderWorkbench();
    const advancedTab = screen.getByRole('tab', { name: 'Advanced Search' });

    await user.click(advancedTab);
    expect(screen.getByLabelText('Starts With')).toHaveFocus();
    await user.type(screen.getByLabelText('Starts With'), '98');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Starts With')).toHaveValue('');
    expect(screen.getByTestId('location')).toHaveTextContent('/shop');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(advancedTab).toHaveFocus();
  });

  it('commits Advanced Search to the URL and replaces the drawer with compact summary chips', async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.click(screen.getByRole('tab', { name: 'Advanced Search' }));
    await user.type(screen.getByLabelText('Starts With'), '98');
    await user.click(screen.getByRole('button', { name: 'Apply Search' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('location')).toHaveTextContent('/shop?mode=advanced&starts_with=98');
    expect(screen.getByText('Starts 98')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Search' })).toBeInTheDocument();
  });

  it('hydrates a shared Advanced Search URL directly into the open drawer', () => {
    renderWorkbench('/shop?mode=advanced&starts_with=98&exact_mask=98%3F%3F54%3F%3F%3F%3F');
    expect(screen.getByRole('dialog', { name: 'Advanced VIP Number Search' })).toBeInTheDocument();
    expect(screen.getByLabelText('Starts With')).toHaveValue('98');
  });

  it('hydrates advanced fields and all legacy shop filters from a shared URL', () => {
    const params = new URLSearchParams(
      'category=mirror-numbers&price_max=50000&numerology=9&badge=RARE'
      + '&mode=advanced&starts_with_pattern=mirror&must_contain=786%2C99'
      + '&digit_sum=45&exact_mask=98%3F%3F54%3F%3F%3F%3F&frequencies=7%3A2%3A4',
    );
    const state = readSearchState(params);
    const payload = listPayloadFromParams(params) as any;

    expect(state.mode).toBe('advanced');
    expect(state.startsPattern).toBe('mirror');
    expect(state.frequencies).toEqual([{ digit: '7', min: '2', max: '4' }]);
    expect(payload.category).toBe('mirror-numbers');
    expect(payload.price_max).toBe('50000');
    expect(payload.numerology).toBe('9');
    expect(payload.badge).toBe('RARE');
    expect(payload.search.must_contain).toEqual(['786', '99']);
    expect(payload.search.exact_mask).toBe('98??54????');
    expect(payload.search.include_alternatives).toBe(true);
  });

  it('maps the complete advanced state to the typed listing payload', () => {
    const state = readSearchState(new URLSearchParams('mode=advanced'));
    Object.assign(state, {
      startsPattern: 'double',
      anywhere: '786',
      endsWith: '55',
      mustContain: '11,22',
      mustNotContain: '13',
      digitSum: '45',
      midSum: '9',
      scoreSum: '9',
      exactMask: '98??54????',
      priceMin: '1501',
      priceMax: '3000',
      frequencies: [{ digit: '7', min: '2', max: '4' }],
    });
    const params = writeSearchState(new URLSearchParams('category=mirror-numbers'), state);
    const payload = listPayloadFromParams(params) as any;

    expect(payload.category).toBe('mirror-numbers');
    expect(payload.price_min).toBe('1501');
    expect(payload.search).toMatchObject({
      starts_with_pattern: 'double',
      anywhere: '786',
      ends_with: '55',
      must_contain: ['11', '22'],
      must_not_contain: ['13'],
      digit_sum: 45,
      mid_sum: 9,
      score_sum: 9,
      exact_mask: '98??54????',
      digit_frequencies: [{ digit: 7, min: 2, max: 4 }],
      include_alternatives: true,
    });
  });

  it('navigates homepage searches to the shop route', async () => {
    const user = userEvent.setup();
    renderWorkbench('/', 'home');
    await user.type(screen.getByLabelText('Describe the number you want'), 'mirror number under 30000');
    await user.click(screen.getByRole('button', { name: 'Ask AI' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/shop?mode=ai&ai=mirror+number+under+30000');
  });
});
