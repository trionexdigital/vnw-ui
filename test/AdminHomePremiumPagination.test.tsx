import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ homePremiumList: vi.fn(), numbersList: vi.fn() }));
vi.mock('@/core/api/vnwAPI', async () => {
  const actual = await vi.importActual<typeof import('@/core/api/vnwAPI')>('@/core/api/vnwAPI');
  return { ...actual, adminAPI: { ...actual.adminAPI, ...api } };
});
vi.mock('@/shared/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import AdminHomePremium from '@/pages/admin/AdminHomePremium';

it('pages the premium catalog on the server and resets the page for search', async () => {
  api.homePremiumList.mockResolvedValue([]);
  api.numbersList.mockImplementation(async ({ page, q }: { page: number; q: string }) => ({
    items: [{ number_id: page, display_number: q ? '9123 456 789' : `9000 000 00${page}`, operator: 'Airtel', offer_price: 5000, status: 'AVAILABLE' }],
    total: 45,
  }));
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/admin/home-premium']}><AdminHomePremium /></MemoryRouter>);

  await waitFor(() => expect(api.numbersList).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 25 })));
  await user.click(await screen.findByRole('button', { name: 'Next page' }));
  await waitFor(() => expect(api.numbersList).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 25 })));
  await user.type(screen.getByPlaceholderText('Search stored numbers'), '9123');
  await user.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() => expect(api.numbersList).toHaveBeenCalledWith(expect.objectContaining({ q: '9123', page: 1 })));
});
