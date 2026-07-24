import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';

const apiMocks = vi.hoisted(() => ({
  list: vi.fn(),
  aiSearch: vi.fn(),
  categories: vi.fn(),
}));

vi.mock('@/core/api/vnwAPI', () => ({
  numbersAPI: { list: apiMocks.list, aiSearch: apiMocks.aiSearch },
  categoriesAPI: { list: apiMocks.categories },
}));

vi.mock('@/shared/components/NumberCard', () => ({
  default: ({ item }: { item: any }) => <article>{item.display_number}</article>,
}));

vi.mock('@/shared/components/ui-bits', () => ({
  Loader: () => <div role="status">Loading cards</div>,
}));

import Shop from '@/pages/shop/Shop';

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current location">{location.pathname}{location.search}</output>;
}

function renderShop(initialEntry = '/shop') {
  apiMocks.categories.mockResolvedValue([
    { slug: 'mirror-numbers', name: 'Mirror Numbers', number_count: 12 },
    { slug: '786-numbers', name: '786 Numbers', number_count: 7 },
  ]);
  apiMocks.list.mockResolvedValue({
    items: [{ number_id: 1, display_number: '98765 43210' }],
    total: 1,
    pages: 1,
  });
  apiMocks.aiSearch.mockResolvedValue({
    items: [],
    total: 0,
    pages: 1,
    alternatives: [],
  });
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Shop />
      <LocationProbe />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  apiMocks.list.mockReset();
  apiMocks.aiSearch.mockReset();
  apiMocks.categories.mockReset();
  document.body.style.overflow = '';
});

describe('shop search results and filters', () => {
  it('renders a viewport-bounded sticky desktop shell with internally scrolling options', async () => {
    const { container } = renderShop();
    expect(await screen.findByText('98765 43210')).toBeInTheDocument();
    const stickyShell = container.querySelector('.sticky.top-24');
    expect(stickyShell).toHaveClass('max-h-[calc(100vh-7rem)]', 'overflow-hidden');
    expect(stickyShell?.querySelector('[role="tabpanel"]')).toHaveClass('overflow-y-auto');
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('locks page scrolling while the accessible mobile filter sheet is open', async () => {
    const user = userEvent.setup();
    renderShop();
    await screen.findByText('98765 43210');
    await user.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('dialog', { name: 'Filter VIP number results' })).toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    await user.click(screen.getByRole('button', { name: 'Close filters' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('');
  });

  it('applies the same price bands from the filter card and resets pagination', async () => {
    const user = userEvent.setup();
    renderShop('/shop?page=3');
    await screen.findByText('98765 43210');
    const priceTabs = screen.getAllByRole('tab', { name: 'Prices' });
    await user.click(priceTabs[0]);
    const priceButtons = screen.getAllByRole('button', { name: '₹3,001 – ₹5,000' });
    await user.click(priceButtons[0]);

    await waitFor(() => {
      const location = screen.getByLabelText('Current location').textContent || '';
      expect(location).toContain('price_min=3001');
      expect(location).toContain('price_max=5000');
      expect(location).not.toContain('page=');
    });
  });

  it('exposes legacy category, price, numerology, and badge filters as removable chips', async () => {
    const user = userEvent.setup();
    renderShop('/shop?category=mirror-numbers&price_max=50000&numerology=9&badge=RARE');

    expect(await screen.findByRole('button', { name: /Category: Mirror Numbers/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /to ₹50,000/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Numerology: 9/ })).toBeInTheDocument();
    const badge = screen.getByRole('button', { name: /Badge:/ });
    await user.click(badge);
    await waitFor(() => expect(screen.getByLabelText('Current location')).not.toHaveTextContent('badge=RARE'));
  });
});
