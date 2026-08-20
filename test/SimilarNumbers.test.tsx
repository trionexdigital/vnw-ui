import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const apiMocks = vi.hoisted(() => ({ similar: vi.fn() }));

vi.mock('@/core/api/vnwAPI', () => ({
  numbersAPI: { similar: apiMocks.similar },
}));

vi.mock('@/shared/components/NumberCard', () => ({
  default: ({ item }: { item: any }) => <article data-testid="similar-card">{item.display_number}</article>,
}));

import SimilarNumbers from '@/pages/shop/SimilarNumbers';

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current location">{location.pathname}{location.search}</output>;
}

function renderPage(entry = '/number/9/similar') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes><Route path="/number/:id/similar" element={<><SimilarNumbers /><LocationProbe /></>} /></Routes>
    </MemoryRouter>,
  );
}

const source = {
  number_id: 9,
  number_value: '9193999999',
  display_number: '9193 999 999',
  mrp: 499999,
  offer_price: 349999,
  primary_category: { slug: 'hexa-numbers', name: 'Hexa Pattern' },
};

afterEach(() => {
  cleanup();
  apiMocks.similar.mockReset();
});

describe('Similar Numbers page', () => {
  it('shows the source summary, ranked cards, result count, and paginates', async () => {
    apiMocks.similar.mockResolvedValue({
      source,
      items: [{ ...source, number_id: 10, display_number: '9193 999 998' }],
      total: 13,
      page: 1,
      limit: 12,
      pages: 2,
    });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('heading', { name: /numbers similar to 9193 999 999/i })).toBeInTheDocument();
    expect(screen.getByText('Hexa Pattern')).toBeInTheDocument();
    expect(screen.getByText('13 close matches')).toBeInTheDocument();
    expect(screen.getByTestId('similar-card')).toHaveTextContent('9193 999 998');
    expect(apiMocks.similar).toHaveBeenCalledWith({ number_id: 9, page: 1, limit: 12 });

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(screen.getByLabelText('Current location')).toHaveTextContent('?page=2'));
  });

  it('renders a useful empty state without requiring authentication', async () => {
    apiMocks.similar.mockResolvedValue({ source, items: [], total: 0, page: 1, limit: 12, pages: 0 });
    renderPage();
    expect(await screen.findByText('No similar numbers available')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse all numbers' })).toHaveAttribute('href', '/shop');
  });

  it('distinguishes a missing source from a retryable request failure', async () => {
    apiMocks.similar.mockRejectedValueOnce(new Error('Number not found.'));
    renderPage();
    expect(await screen.findByText('Number not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse VIP numbers' })).toHaveAttribute('href', '/shop');
  });
});
