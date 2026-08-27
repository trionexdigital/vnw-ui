import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LegalPage from '@/pages/legal/LegalPage';
import About from '@/pages/static/About';
import { useStore } from '@/shared/store/useStore';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('legal and contact experience', () => {
  it('combines the about story, contact form, and configured Google map', () => {
    useStore.setState({ site: {
      CONTACT_EMAIL: 'help@example.test',
      CONTACT_PHONE: '+91 98765 43210',
      WHATSAPP: '919876543210',
      SUPPORT_ADDRESS: 'Jaipur, Rajasthan, India',
    } });
    render(<MemoryRouter initialEntries={['/about?subject=family-pack#contact']}><About /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: /About VIP Number World/ })).toBeVisible();
    expect(screen.getByRole('heading', { name: /Contact our team/ })).toBeVisible();
    expect(screen.getByLabelText('Subject')).toHaveValue('family pack');
    expect(screen.getByRole('button', { name: /Send Message/ })).toBeVisible();
    expect(screen.getByTitle('VIP Number World location map')).toHaveAttribute('src', expect.stringContaining('Jaipur%2C%20Rajasthan%2C%20India'));
  });

  it('renders keyboard-operable legal disclosures and configured identity fallbacks', async () => {
    useStore.setState({ site: { SITE_TITLE: 'VIP Number World', CONTACT_EMAIL: 'help@example.test', POLICY_EFFECTIVE_DATE: '1 August 2026' } });
    const user = userEvent.setup(); render(<MemoryRouter><LegalPage policyKey="refund-policy" /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Refund and Cancellation Policy' })).toBeVisible();
    expect(screen.getByText(/Effective 1 August 2026/)).toBeVisible(); expect(screen.getAllByText('help@example.test')).toHaveLength(2);
    const disclosure = screen.getByRole('button', { name: /VIP number and pre-book refunds/ }); expect(disclosure).toHaveAttribute('aria-expanded','true');
    await user.click(disclosure); expect(disclosure).toHaveAttribute('aria-expanded','false');
  });
});
