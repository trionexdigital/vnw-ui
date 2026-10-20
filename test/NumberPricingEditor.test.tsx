import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import NumberEditor from '@/pages/admin/NumberEditor';
import NumberPricingPreview from '@/pages/admin/NumberPricingPreview';
import DealerListingForm from '@/pages/dealer/DealerListingForm';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const api = vi.hoisted(() => ({ analyze: vi.fn(), save: vi.fn(), listings: vi.fn(), updateListing: vi.fn() }));
vi.mock('@/core/api/vnwAPI', () => ({ adminAPI: { numbersAnalyze: api.analyze, numberSave: api.save }, dealerAPI: { listings: api.listings, updateListing: api.updateListing }, categoriesAPI: { classify: vi.fn().mockResolvedValue({ categories: [] }) } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('previews the independent discounts using the full unrounded formula', () => {
  const { rerender } = render(<NumberPricingPreview base="2500" />);
  expect(screen.getByText('₹3,125.00')).toBeInTheDocument();
  expect(screen.getAllByText('₹2,968.75')).toHaveLength(2);
  rerender(<NumberPricingPreview base="2500" additional="10" />);
  expect(screen.getByText('₹2,671.88')).toBeInTheDocument();
  rerender(<NumberPricingPreview base="0.02" additional="50" />);
  expect(screen.getByText('₹0.01')).toBeInTheDocument();
});

it('edits the saved base rather than the marked-up listed price and sends decimal strings', async () => {
  api.analyze.mockResolvedValue({ total: 1, ready: 1, rejected: 0, analysis_token: 'v2', rows: [{ row: 1, input: '8008005413', reasons: [], values: { number: '8008005413' } }] });
  api.save.mockResolvedValue({});
  render(<NumberEditor initial={{ number_id: 7, display_number: '8008005413', title_label: 'VIP Number', badge: 'NONE', status: 'AVAILABLE', visibility_type: 'ONLINE', rtp_status: 'RTP', mrp: '3125.00', base_price: '2500.00', additional_discount_pct: '10.00' }} onSaved={vi.fn()} />);
  const base = screen.getByLabelText('Base price (₹)');
  expect(base).toHaveValue('2500.00');
  expect(screen.getByLabelText('Additional discount (%)')).toHaveValue(10);
  await userEvent.click(screen.getByRole('button', { name: 'Validate' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Save number' }));
  await waitFor(() => expect(api.save).toHaveBeenCalled());
  expect(api.save.mock.calls[0][0]).toMatchObject({ base_price: '2500.00', additional_discount_pct: '10.00' });
  expect(api.save.mock.calls[0][0].mrp).toBeUndefined();
  expect(api.save.mock.calls[0][0].stock).toBeUndefined();
});

it('uses the legacy original MRP as the base only for unconverted records', () => {
  render(<NumberEditor initial={{ number_id: 8, display_number: '8008005413', mrp: '2500.00', base_price: null, title_label: 'VIP Number', badge: 'NONE', status: 'AVAILABLE', visibility_type: 'ONLINE', rtp_status: 'RTP' }} onSaved={vi.fn()} />);
  expect(screen.getByLabelText('Base price (₹)')).toHaveValue('2500.00');
  expect(screen.getAllByText('₹2,968.75')).toHaveLength(2);
});

it('dealer edits preload the original base and independently clear the additional discount', async () => {
  api.listings.mockResolvedValue({ items: [{ number_id: 7, display_number: '8008005413', title_label: 'VIP Number', rtp_status: 'RTP', mrp: '3125.00', base_price: '2500.00', additional_discount_pct: '10.00' }] });
  api.updateListing.mockResolvedValue({});
  render(<MemoryRouter initialEntries={['/dealer/listings/7/edit']}><Routes><Route path="/dealer/listings/:id/edit" element={<DealerListingForm />} /><Route path="/dealer/listings" element={<div>Saved listing</div>} /></Routes></MemoryRouter>);
  await waitFor(() => expect(screen.getByLabelText('Base price (₹)')).toHaveValue(2500));
  expect(screen.getByText('₹2,671.88')).toBeInTheDocument();
  await userEvent.clear(screen.getByLabelText('Additional discount (%)'));
  await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(api.updateListing).toHaveBeenCalled());
  expect(api.updateListing.mock.calls[0][0]).toMatchObject({ number_id: 7, base_price: '2500.00', additional_discount_pct: '' });
  expect(api.updateListing.mock.calls[0][0].mrp).toBeUndefined();
});
