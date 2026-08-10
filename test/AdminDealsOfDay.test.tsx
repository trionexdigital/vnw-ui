import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { DealOfDayItem } from '@/core/api/vnwAPI';

const api = vi.hoisted(() => ({
  list: vi.fn(),
  numbersList: vi.fn(),
  save: vi.fn(),
  reorder: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/core/api/vnwAPI', async () => {
  const actual = await vi.importActual<typeof import('@/core/api/vnwAPI')>('@/core/api/vnwAPI');
  return {
    ...actual,
    adminAPI: {
      ...actual.adminAPI,
      dealsOfDayList: api.list,
      numbersList: api.numbersList,
      dealOfDaySave: api.save,
      dealsOfDayReorder: api.reorder,
      dealOfDayDelete: api.remove,
    },
  };
});

vi.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import AdminDealsOfDay from '@/pages/admin/AdminDealsOfDay';

const deal = (dealId: number, numberId: number, displayNumber: string): DealOfDayItem => ({
  deal_id: dealId,
  number_id: numberId,
  number_value: displayNumber.replace(/\s/g, ''),
  display_number: displayNumber,
  title_label: 'Premium Pick',
  badge: 'PREMIUM',
  mrp: 349999,
  offer_price: 259999,
  stock: 1,
  status: 'AVAILABLE',
  hero_label: null,
  hero_description: null,
  sort_order: dealId - 1,
  is_active: true,
  source: 'CURATED',
  categories: [],
});

const configured = [
  deal(11, 101, '969595 1155'),
  deal(12, 102, '999997 1155'),
];

describe('AdminDealsOfDay', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('toggles, reorders, and removes a deal without deleting its catalog number', async () => {
    api.list.mockResolvedValue(configured);
    api.save.mockResolvedValue({});
    api.reorder.mockResolvedValue({});
    api.remove.mockResolvedValue({});
    api.numbersList.mockResolvedValue({ items: [] });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    render(<MemoryRouter><AdminDealsOfDay /></MemoryRouter>);

    await screen.findByText('969595 1155');
    await user.click(screen.getAllByRole('button', { name: 'Active' })[0]);
    await waitFor(() => expect(api.save).toHaveBeenCalledWith(expect.objectContaining({
      deal_id: 11,
      number_id: 101,
      is_active: false,
    })));

    await user.click(screen.getByRole('button', { name: 'Move 969595 1155 down' }));
    await waitFor(() => expect(api.reorder).toHaveBeenCalledWith([12, 11]));

    await user.click(screen.getByRole('button', { name: 'Remove 999997 1155' }));
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(12));
    expect(window.confirm).toHaveBeenCalledWith('Remove 999997 1155 from Lucky Pick of the Day?');
  });

  it('adds a catalog number with optional hero copy', async () => {
    api.list.mockResolvedValue(configured);
    api.numbersList.mockResolvedValue({
      items: [
        {
          number_id: 101,
          display_number: '969595 1155',
          number_value: '9695951155',
          title_label: 'Already configured',
          offer_price: 259999,
          status: 'AVAILABLE',
        },
        {
          number_id: 103,
          display_number: '936313 1155',
          number_value: '9363131155',
          title_label: 'Golden Choice',
          offer_price: 189999,
          status: 'AVAILABLE',
        },
      ],
    });
    api.save.mockResolvedValue({});
    const user = userEvent.setup();

    render(<MemoryRouter><AdminDealsOfDay /></MemoryRouter>);

    await screen.findByText('969595 1155');
    await user.click(screen.getByRole('button', { name: 'Add Lucky Pick' }));
    const picker = await screen.findByRole('combobox', { name: 'VIP number' });
    await waitFor(() => expect(screen.getByRole('option', { name: /936313 1155/ })).toBeInTheDocument());
    expect(screen.queryByRole('option', { name: /969595 1155/ })).not.toBeInTheDocument();
    await user.selectOptions(picker, '103');
    await user.type(screen.getByPlaceholderText('e.g. Numerology Special'), 'Golden Choice');
    await user.type(screen.getByPlaceholderText(/Highly desirable/), 'Rare and memorable');
    await user.click(screen.getByRole('button', { name: 'Add to Lucky Pick of the Day' }));

    await waitFor(() => expect(api.save).toHaveBeenCalledWith({
      number_id: 103,
      hero_label: 'Golden Choice',
      hero_description: 'Rare and memorable',
      is_active: true,
    }));
  });
});
