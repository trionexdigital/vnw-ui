import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CorporatePackPreview, FaqAccordion, JourneyPreview } from '@/pages/home/components/MarketplaceSections';
import CorporateElitePack from '@/pages/corporate/CorporateElitePack';
import { siteAPI } from '@/core/api/vnwAPI';
import { listPayloadFromParams } from '@/pages/shop/searchTypes';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('marketplace expansion', () => {
  it('maps operator and premium URLs to catalog API filters', () => {
    const payload = listPayloadFromParams(new URLSearchParams('operator=Jio&premium=1&sort=popular'));
    expect(payload).toMatchObject({ operator: 'Jio', is_premium: 1, sort: 'popular' });
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

  it('regenerates corporate packs when match type or the 2–10 size dropdown changes', async () => {
    const user = userEvent.setup();
    const packs = vi.spyOn(siteAPI, 'corporatePacks').mockResolvedValue([]);
    render(<MemoryRouter><CorporateElitePack /></MemoryRouter>);

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
    const packs = vi.spyOn(siteAPI, 'corporatePacks').mockResolvedValue([]);
    render(<MemoryRouter><CorporatePackPreview /></MemoryRouter>);

    await waitFor(() => expect(packs).toHaveBeenCalledWith({ pack_type: 'MIXED', size: 3, limit: 3 }));
    expect(screen.queryByRole('button', { name: 'Numbers in Series' })).not.toBeInTheDocument();
    const size = screen.getByRole('combobox', { name: 'Homepage pack size' });
    expect(screen.getAllByRole('option')).toHaveLength(9);
    await user.selectOptions(size, '4');
    await user.click(screen.getByRole('button', { name: 'Similar Both Ends' }));
    await waitFor(() => expect(packs).toHaveBeenLastCalledWith({ pack_type: 'SIMILAR_BOTH', size: 4, limit: 3 }));
  });

  it('shows the money-back guarantee as the fifth journey step', () => {
    render(<MemoryRouter><JourneyPreview /></MemoryRouter>);
    expect(screen.getByText('Step 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '100% Money Back' })).toBeInTheDocument();
    expect(screen.getByText('Guaranteed full refund if you encounter any issues with UPC delivery or number activation.')).toBeInTheDocument();
  });
});
