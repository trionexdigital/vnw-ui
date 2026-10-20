import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({ cart: vi.fn(), wish: vi.fn(), removeWish: vi.fn() }));
vi.mock('@/core/api/vnwAPI', () => ({
  cartAPI: { add: mocks.cart, list: vi.fn(async () => ({ count: 1 })) },
  wishlistAPI: { add: mocks.wish, remove: mocks.removeWish, list: vi.fn(async () => ({ count: 1 })) },
  siteAPI: { settings: vi.fn(async () => ({})) },
}));
import NumberCard, { type NumberItem } from '@/shared/components/NumberCard';
import FamilyPackCard from '@/shared/components/FamilyPackCard';
import type { CorporatePack } from '@/core/api/vnwAPI';
import { useStore } from '@/shared/store/useStore';

const base: NumberItem = {
  number_id: 71, display_number: '9988 998 877', number_value: '9988998877',
  mrp: 50000, offer_price: 45000, badge: 'PREMIUM', rtp_status: 'RTA', status: 'AVAILABLE',
};
function Location() { const location = useLocation(); return <output aria-label="Location">{location.pathname}{location.search}</output>; }
function card(overrides: Partial<NumberItem> = {}, callback?: () => void) {
  return render(<MemoryRouter><NumberCard item={{ ...base, ...overrides }} onWishlistChange={callback} /><Location /></MemoryRouter>);
}
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); useStore.setState({ compare: [] }); });
afterEach(cleanup);

describe('reference number card', () => {
  it('hides omitted title/badge and displays the sequential effective discount without adding it twice', () => {
    const { container } = card({ title_label: '', badge: 'NONE', mrp: 3125, offer_price: 2671.88, discount_pct: 14.5 });
    expect(container.querySelector('.reference-card__title')).toBeNull();
    expect(container.querySelector('.reference-card__badge')).toBeNull();
    expect(container.querySelector('.reference-card__discount')).toHaveTextContent('14.5% OFF');
    expect(container.querySelector('.reference-card__offer')).toHaveTextContent('₹2,671.88');
  });
  it('family and corporate pack selections total the saved final prices without applying another discount', async () => {
    const pack: CorporatePack = { pack_id: 'pricing', title: 'Pack', pack_type: 'MIXED', size: 2, total_price: 5640.63, is_available: true, is_active: true, sort_order: 1,
      numbers: [{ number_id: 1, display_number: '8008005413', offer_price: 2968.75, status: 'AVAILABLE', stock: 1 }, { number_id: 2, display_number: '8008009307', offer_price: 2671.88, status: 'AVAILABLE', stock: 1 }] };
    const { container } = render(<MemoryRouter><FamilyPackCard pack={pack} /></MemoryRouter>);
    expect(container.querySelector('.reference-family__total')).toHaveTextContent('₹5,640.63');
    expect(container.querySelectorAll('.reference-family__price')[1]).toHaveTextContent('₹2,671.88');
    await userEvent.click(screen.getByRole('button', { name: 'Deselect 8008005413' }));
    expect(container.querySelector('.reference-family__total')).toHaveTextContent('₹2,671.88');
  });

  it('keeps category spacing identical when search highlighting is toggled', () => {
    const primary_category = { slug: 'doublling-aabbcc', name: 'Doublling (AABBCC)', match_spans: [{ start: 0, end: 3 }, { start: 3, end: 6 }] };
    const item = { ...base, number_value: '8008005413', primary_category };
    const { container, rerender } = render(<MemoryRouter><NumberCard item={item} /></MemoryRouter>);
    const groups = () => Array.from(container.querySelectorAll('.reference-card__digit-group')).map((group) => group.textContent);
    expect(groups()).toEqual(['800', '800', '5413']);
    expect(container.querySelector('[data-match="true"]')).toBeNull();
    rerender(<MemoryRouter><NumberCard item={item} highlightDigits /></MemoryRouter>);
    expect(groups()).toEqual(['800', '800', '5413']);
    expect(container.querySelectorAll('[data-match="true"]')).toHaveLength(2);
  });
  it.each([
    ['9988 998 877', 82, 1], ['+91 9988 998 877', 82, 1],
    ['9006-622-121', 29, 2], ['9999 999 999', 90, 9], ['9000 000 000', 9, 9],
  ])('calculates Total and Root sum from normalized %s', (display_number, total, root) => {
    const { container } = card({ number_value: undefined, display_number });
    expect(container.querySelectorAll('dl dd')[0]).toHaveTextContent(String(total));
    expect(container.querySelectorAll('dl dd')[1]).toHaveTextContent(String(root));
    expect(screen.getByText('Root sum')).toBeInTheDocument();
    expect(screen.queryByText('Sum')).not.toBeInTheDocument();
  });
  it('uses canonical digits when a formatted display value differs', () => {
    const { container } = card({ display_number: '+91 9006 622 121' });
    expect(container.querySelectorAll('dl dd')[0]).toHaveTextContent('82');
    expect(container.querySelectorAll('dl dd')[1]).toHaveTextContent('1');
  });
  it('keeps real badge labels and handles a zero discount', () => {
    card({ badge: 'BEST_SELLER', offer_price: 50000 });
    expect(screen.getByText('Best Seller')).toBeInTheDocument();
    expect(screen.queryByText('Premium')).not.toBeInTheDocument();
    expect(screen.getByText('Best price')).toBeInTheDocument();
  });
  it('keeps authenticated wishlist, cart and compare actions functional', async () => {
    localStorage.setItem('token', 'test-token');
    const callback = vi.fn();
    card({}, callback);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'add to wishlist' }));
    expect(mocks.wish).toHaveBeenCalledWith(71);
    expect(screen.getByRole('button', { name: 'remove from wishlist' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'remove from wishlist' }));
    expect(mocks.removeWish).toHaveBeenCalledWith(71);
    expect(callback).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', { name: 'add to cart' }));
    expect(mocks.cart).toHaveBeenCalledWith(71);
    await user.click(screen.getByRole('button', { name: 'Add to compare' }));
    expect(useStore.getState().compare).toEqual([71]);
    await user.click(screen.getByRole('button', { name: 'Remove from compare' }));
    expect(useStore.getState().compare).toEqual([]);
  });
  it('requires login before adding a number to the cart', async () => {
    card();
    await userEvent.click(screen.getByRole('button', { name: 'add to cart' }));
    expect(screen.getByLabelText('Location')).toHaveTextContent('/login');
    expect(mocks.cart).not.toHaveBeenCalled();
  });
  it.each([['RTA', '/checkout?number_id=71'], ['RTP', '/checkout?number_id=71'], ['NON_RTP', '/pre-book/71/checkout']] as const)(
    'keeps the %s purchase destination', async (rtp_status, path) => {
      localStorage.setItem('token', 'test-token');
      card({ rtp_status, rtp_available_at: '2027-01-01 12:00:00' });
      await userEvent.click(screen.getByRole('button', { name: rtp_status === 'NON_RTP' ? 'Pre-book' : 'Buy Now' }));
      expect(screen.getByLabelText('Location')).toHaveTextContent(path);
    },
  );
  it('disables purchases for unavailable numbers without mislabeling NON-RTP stock', () => {
    card({ status: 'RESERVED', rtp_status: 'NON_RTP', rtp_available_at: '2027-01-01 12:00:00' });
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'add to cart' })).toBeDisabled();
    expect(screen.getByTitle(/NON-RTP · Ready to port on/)).toHaveTextContent('NON-RTP');
  });
  it('shows pending cart feedback and recovers from a failed request', async () => {
    localStorage.setItem('token', 'test-token');
    let reject!: (reason: Error) => void;
    mocks.cart.mockImplementationOnce(() => new Promise((_, rejectRequest) => { reject = rejectRequest; }));
    card();
    await userEvent.click(screen.getByRole('button', { name: 'add to cart' }));
    expect(screen.getByRole('button', { name: 'add to cart' })).toBeDisabled();
    expect(screen.getByText('Adding…')).toBeInTheDocument();
    reject(new Error('Private link expired'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'add to cart' })).toBeEnabled());
  });
});
