import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PaymentReturn from '@/pages/checkout/PaymentReturn';
import { paymentsAPI } from '@/core/api/vnwAPI';
import { openCashfreeCheckout } from '@/core/payments/cashfree';

vi.mock('@/core/api/vnwAPI', () => ({ paymentsAPI: { verify: vi.fn(), createCashfreeOrder: vi.fn() } }));
vi.mock('@/shared/store/useStore', () => ({ useStore: () => ({ refreshCounts: vi.fn().mockResolvedValue(undefined) }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); delete (window as any).Cashfree; });

describe('Cashfree checkout and payment return', () => {
  it('opens hosted checkout with only the server session and matching sandbox mode', async () => {
    const checkout = vi.fn().mockResolvedValue(undefined); const factory = vi.fn(() => ({ checkout }));
    (window as any).Cashfree = factory;
    await openCashfreeCheckout({ order_id: 7, order_no: 'VNW-7', payment_status: 'PENDING', environment: 'sandbox', payment_session_id: 'session-test' });
    expect(factory).toHaveBeenCalledWith({ mode: 'sandbox' });
    expect(checkout).toHaveBeenCalledWith({ paymentSessionId: 'session-test', redirectTarget: '_self' });
  });
  it('rejects a missing session instead of attempting payment', async () => {
    await expect(openCashfreeCheckout({ order_id: 7, order_no: 'VNW-7', payment_status: 'PENDING' })).rejects.toThrow('session');
  });
  it('does not trust a success flag in the browser URL', async () => {
    vi.mocked(paymentsAPI.verify).mockRejectedValue(new Error('Order not found.'));
    render(<MemoryRouter initialEntries={['/payments/return?order_id=7&success=1']}><PaymentReturn /></MemoryRouter>);
    await screen.findByText('Unable to check payment');
    expect(paymentsAPI.verify).toHaveBeenCalledWith({ order_id: 7 });
    expect(screen.queryByText('Payment confirmed')).not.toBeInTheDocument();
  });
  it('shows a confirmed order only after the backend verifies it', async () => {
    vi.mocked(paymentsAPI.verify).mockResolvedValue({ order_id: 7, order_no: 'VNW-7', order_type: 'PURCHASE', payment_status: 'PAID' });
    render(<MemoryRouter initialEntries={['/payments/return?order_id=7']}><PaymentReturn /></MemoryRouter>);
    await screen.findByText('Payment confirmed');
    expect(screen.getByRole('link', { name: 'View order' })).toHaveAttribute('href', '/orders/7');
    expect(screen.queryByRole('button', { name: 'Continue payment' })).not.toBeInTheDocument();
  });
  it('offers support for late payments and cannot open another payment', async () => {
    vi.mocked(paymentsAPI.verify).mockResolvedValue({ order_id: 7, order_no: 'VNW-7', order_type: 'PREBOOK', payment_status: 'REVIEW' });
    render(<MemoryRouter initialEntries={['/payments/return?order_id=7']}><PaymentReturn /></MemoryRouter>);
    await screen.findByText('Payment received — review needed');
    expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '/contact');
    expect(screen.queryByRole('button', { name: 'Continue payment' })).not.toBeInTheDocument();
  });
  it('does not query the backend for an invalid order reference', async () => {
    render(<MemoryRouter initialEntries={['/payments/return?order_id=oops']}><PaymentReturn /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('The order reference is invalid.')).toBeVisible());
    expect(paymentsAPI.verify).not.toHaveBeenCalled();
  });
});
