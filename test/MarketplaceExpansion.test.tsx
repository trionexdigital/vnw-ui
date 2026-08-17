import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CorporatePackPreview, FaqAccordion, JourneyPreview, OperatorSection } from '@/pages/home/components/MarketplaceSections';
import FamilyPack from '@/pages/corporate/CorporateElitePack';
import { siteAPI } from '@/core/api/vnwAPI';
import { cartAPI, numbersAPI, wishlistAPI, type CorporatePack } from '@/core/api/vnwAPI';
import { listPayloadFromParams } from '@/pages/shop/searchTypes';
import FamilyPackCard from '@/shared/components/FamilyPackCard';
import { localService } from '@/core/services/local';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('marketplace expansion', () => {
  it('maps operator and premium URLs to catalog API filters', () => {
    const payload = listPayloadFromParams(new URLSearchParams('operator=Jio&premium=1&sort=popular'));
    expect(payload).toMatchObject({ operator: 'Jio', is_premium: 1, sort: 'popular' });
  });

  it('uses the supplied operator logos without exposing zero-stock counts', async () => {
    const user = userEvent.setup();
    const list = vi.spyOn(numbersAPI, 'list').mockResolvedValue({ items: [], total: 0, page: 1, limit: 8 } as any);
    render(<MemoryRouter><OperatorSection operators={[]} /></MemoryRouter>);

    expect(screen.getByRole('img', { name: 'Airtel logo' })).toHaveAttribute('src', '/icons/Airtel_logo-02.png');
    expect(screen.getByRole('img', { name: 'Jio logo' })).toHaveAttribute('src', '/icons/jio-logo-icon.png');
    expect(screen.getByRole('img', { name: 'Vi logo' })).toHaveAttribute('src', '/icons/vi-mobile-icon.png');
    expect(screen.getByRole('img', { name: 'BSNL logo' })).toHaveAttribute('src', '/icons/bsnl-logo.png');
    expect(screen.queryByText(/0 available/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('Browse series')).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: 'Browse Jio catalogued series' }));
    await waitFor(() => expect(list).toHaveBeenCalledWith({ operator: 'Jio', limit: 8, sort: 'popular' }));
    expect(screen.getByText(/After purchase, you may port it/i)).toBeVisible();
  });

  it('exposes FAQs as keyboard-operable disclosure controls', async () => {
    const user = userEvent.setup();
    render(<FaqAccordion items={[{ faq_id: 1, category: 'Support', question: 'What happens next?', answer: 'Track the order and follow the transfer guidance.', sort_order: 1, is_active: true }]} />);
    const trigger = screen.getByRole('button', { name: 'What happens next?' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Track the order/)).toBeVisible();
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Track the order/)).not.toBeInTheDocument();
  });

  it('regenerates Family Packs when match type or the 2–10 size dropdown changes', async () => {
    const user = userEvent.setup();
    const packs = vi.spyOn(siteAPI, 'familyPacks').mockResolvedValue([]);
    render(<MemoryRouter><FamilyPack /></MemoryRouter>);

    await waitFor(() => expect(packs).toHaveBeenCalledWith({ pack_type: 'MIXED', size: 3 }));
    expect(screen.queryByRole('button', { name: 'Numbers in Series' })).not.toBeInTheDocument();
    const size = screen.getByRole('combobox', { name: 'Numbers in pack' });
    expect(size).toHaveValue('3');
    expect(screen.getAllByRole('option')).toHaveLength(9);

    await user.selectOptions(size, '5');
    await user.click(screen.getByRole('button', { name: 'Similar Start' }));
    await waitFor(() => expect(packs).toHaveBeenLastCalledWith({ pack_type: 'SIMILAR_START', size: 5 }));
  });

  it('offers the same automatic pack filters in the homepage preview', async () => {
    const user = userEvent.setup();
    const packs = vi.spyOn(siteAPI, 'familyPacks').mockResolvedValue([]);
    render(<MemoryRouter><CorporatePackPreview /></MemoryRouter>);

    await waitFor(() => expect(packs).toHaveBeenCalledWith({ pack_type: 'MIXED', size: 3, limit: 3 }));
    expect(screen.queryByRole('button', { name: 'Numbers in Series' })).not.toBeInTheDocument();
    const size = screen.getByRole('combobox', { name: 'Homepage pack size' });
    expect(screen.getAllByRole('option')).toHaveLength(9);
    await user.selectOptions(size, '4');
    await user.click(screen.getByRole('button', { name: 'Similar Both Ends' }));
    await waitFor(() => expect(packs).toHaveBeenLastCalledWith({ pack_type: 'SIMILAR_BOTH', size: 4, limit: 3 }));
  });

  it('shows operator-free selectable Family Pack cards with working cart and wishlist actions', async () => {
    const user = userEvent.setup();
    const pack: CorporatePack = {
      pack_id: 'AUTO-MIXED-1-2', title: 'All Mixed 1', pack_type: 'MIXED', sort_order: 0,
      is_active: true, is_available: true, size: 2, total_price: 36000,
      numbers: [
        { number_id: 1, display_number: '9155 915 915', offer_price: 17000, status: 'AVAILABLE', stock: 1, operator: 'Airtel' },
        { number_id: 2, display_number: '9353 115 511', offer_price: 19000, status: 'AVAILABLE', stock: 1, operator: 'Vi' },
      ],
    };
    vi.spyOn(localService, 'getToken').mockReturnValue('token');
    const add = vi.spyOn(cartAPI, 'add').mockResolvedValue({});
    const addWish = vi.spyOn(wishlistAPI, 'add').mockResolvedValue({});
    vi.spyOn(cartAPI, 'list').mockResolvedValue({ count: 1 });
    vi.spyOn(wishlistAPI, 'list').mockResolvedValue({ count: 1, items: [] });

    render(<MemoryRouter><FamilyPackCard pack={pack} wishedIds={new Set()} onWishlistChange={vi.fn()} /></MemoryRouter>);

    expect(screen.queryByText('Airtel')).not.toBeInTheDocument();
    expect(screen.queryByText('Vi')).not.toBeInTheDocument();
    expect(screen.getByText('2 of 2 selected')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Buy Now' })).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Add 9155 915 915 to cart' }));
    await waitFor(() => expect(add).toHaveBeenCalledWith(1));

    await user.click(screen.getByRole('button', { name: 'Add 9353 115 511 to wishlist' }));
    await waitFor(() => expect(addWish).toHaveBeenCalledWith(2));

    await user.click(screen.getByRole('button', { name: 'Deselect 9353 115 511' }));
    expect(screen.getByText('1 of 2 selected')).toBeInTheDocument();
  });

  it('shows the money-back guarantee as the fifth journey step', () => {
    render(<MemoryRouter><JourneyPreview /></MemoryRouter>);
    expect(screen.getByText('Step 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '100% Money Back' })).toBeInTheDocument();
    expect(screen.getByText('Guaranteed full refund if you encounter any issues with UPC delivery or number activation.')).toBeInTheDocument();
  });
});
