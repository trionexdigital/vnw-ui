import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMutation, rupee, previewProfit } from '@/pages/dealerManagement/components';
import Statement from '@/pages/dealerManagement/Statement';
const {
  mutation,
  requestKey,
  dm
} = vi.hoisted(() => ({
  mutation: vi.fn(),
  requestKey: vi.fn(),
  dm: vi.fn()
}));
vi.mock('@/core/api/dealerManagement', () => ({
  mutation,
  requestKey,
  dm
}));
describe('standalone dealer UI safety', () => {
  it('preserves paise in large values and previews without floating point rounding', () => {
    expect(rupee('90071992547400.03')).toBe('₹9,00,71,99,25,47,400.03');
    expect(previewProfit('90071992547400.01', '90071992547400.02', '0.02')).toBe('-0.01');
    expect(previewProfit('15000', '22000', '500')).toBe('6500.00');
  });
  beforeEach(() => {
    vi.clearAllMocks();
    let serial = 0;
    requestKey.mockImplementation(() => `test-request-${++serial}`);
  });
  it('reuses the request key after an uncertain failure and generates a new key for changed inputs', async () => {
    mutation.mockRejectedValueOnce(new Error('Network interrupted')).mockResolvedValueOnce({
      payment_id: 1
    }).mockResolvedValueOnce({
      payment_id: 2
    });
    const {
      result
    } = renderHook(() => useMutation());
    await act(async () => {
      await result.current.run('paymentRecord', {
        sale_ids: [1]
      });
    });
    expect(result.current.error).toBe('Network interrupted');
    await act(async () => {
      await result.current.run('paymentRecord', {
        sale_ids: [1]
      });
    });
    expect(mutation.mock.calls[0][2]).toBe(mutation.mock.calls[1][2]);
    await act(async () => {
      await result.current.run('paymentRecord', {
        sale_ids: [2]
      });
    });
    expect(mutation.mock.calls[2][2]).not.toBe(mutation.mock.calls[1][2]);
  });
  it('ignores double submissions while the original request is pending', async () => {
    let finish: (value: any) => void = () => {};
    mutation.mockImplementation(() => new Promise(resolve => {
      finish = resolve;
    }));
    const {
      result
    } = renderHook(() => useMutation());
    let pending: any;
    act(() => {
      pending = result.current.run('paymentRecord', {
        sale_ids: [1]
      });
    });
    await act(async () => {
      await result.current.run('paymentRecord', {
        sale_ids: [1]
      });
    });
    expect(mutation).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish({
        payment_id: 1
      });
      await pending;
    });
    expect(result.current.busy).toBe(false);
  });
  it('keeps inaccessible statement data out of the rendered screen', async () => {
    dm.mockRejectedValue(new Error('No active dealer statement is linked to this login.'));
    render(<Statement />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No active dealer statement');
    expect(screen.queryByText('Dealer amount')).not.toBeInTheDocument();
    await waitFor(() => expect(dm).toHaveBeenCalledWith('statement', expect.objectContaining({
      dealer_id: undefined
    })));
  });
});
