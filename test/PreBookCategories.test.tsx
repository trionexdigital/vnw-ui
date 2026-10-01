import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({ catalog: vi.fn(), categories: vi.fn(), operators: vi.fn() }));
vi.mock('@/core/api/vnwAPI', () => ({
  prebooksAPI: { catalog: api.catalog, my: vi.fn() },
  categoriesAPI: { list: api.categories },
  numbersAPI: { operators: api.operators },
}));
vi.mock('@/core/services/local', () => ({ localService: { getToken: () => null } }));
vi.mock('@/shared/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import PreBook from '@/pages/prebook/PreBook';

it('applies a parent-scoped child filter and clears it when the parent changes', async () => {
  api.catalog.mockResolvedValue({ items: [], total: 0 });
  api.operators.mockResolvedValue([]);
  api.categories.mockResolvedValue([
    { slug: 'customer-care-numbers', name: 'Mirror', subcategories: [{ id: 104, name: 'Ulta-Pulta', number_count: 2 }] },
    { slug: 'doublling-aabbcc', name: 'Doublling', subcategories: [{ id: 63, name: '5 Couples', number_count: 4 }] },
  ]);
  const user = userEvent.setup();
  render(<MemoryRouter><PreBook /></MemoryRouter>);
  await screen.findByRole('combobox', { name: 'Category' });
  expect(screen.getByRole('combobox', { name: 'Subcategory' })).toBeDisabled();
  await user.click(screen.getByRole('combobox', { name: 'Category' }));
  await user.click(await screen.findByRole('option', { name: 'Mirror' }));
  await user.click(screen.getByRole('combobox', { name: 'Subcategory' }));
  await user.click(screen.getByRole('option', { name: /Ulta-Pulta/ }));
  await user.click(screen.getByRole('button', { name: 'Apply filters' }));
  await waitFor(() => expect(api.catalog).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'customer-care-numbers', subcategory_id: 104 })));
  await user.click(screen.getByRole('combobox', { name: 'Category' }));
  await user.click(screen.getByRole('option', { name: 'Doublling' }));
  expect(screen.getByRole('combobox', { name: 'Subcategory' })).toHaveTextContent('All subcategories');
  await user.click(screen.getByRole('button', { name: 'Apply filters' }));
  await waitFor(() => expect(api.catalog).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'doublling-aabbcc', subcategory_id: undefined })));
});
