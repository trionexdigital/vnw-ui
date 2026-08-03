import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NumberCard from '@/shared/components/NumberCard';
import { getNumberPurchaseMode, numberActionPath } from '@/core/lib/numberPurchaseMode';

const base = { number_id: 41, number_value: '9193999999', display_number: '9193 999 999', mrp: 40000, offer_price: 32000, status: 'AVAILABLE' };

describe('RTP purchase-mode contract', () => {
  it('keeps legacy and explicit RTP inventory on normal checkout', () => {
    expect(getNumberPurchaseMode(base)).toBe('BUY');
    expect(numberActionPath({ ...base, rtp_status: 'RTP' })).toBe('/checkout?number_id=41');
  });

  it('routes available NON-RTP inventory to protected pre-book checkout', () => {
    const item = { ...base, rtp_status: 'NON_RTP' as const, rtp_available_at: '2026-09-01 18:30:00' };
    expect(getNumberPurchaseMode(item)).toBe('PREBOOK');
    expect(numberActionPath(item)).toBe('/pre-book/41/checkout');
  });

  it('renders Pre-book and removes the normal cart action from a NON-RTP card', () => {
    render(<MemoryRouter><NumberCard item={{ ...base, rtp_status: 'NON_RTP', rtp_available_at: '2026-09-01 18:30:00' }} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /pre-book/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
  });

  it('disables actions for reserved inventory', () => {
    expect(getNumberPurchaseMode({ ...base, status: 'RESERVED', rtp_status: 'NON_RTP' })).toBe('UNAVAILABLE');
  });
});
