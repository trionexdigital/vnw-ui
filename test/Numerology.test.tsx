import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Numerology from '@/pages/numerology/Numerology';
import { numbersAPI } from '@/core/api/vnwAPI';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Numerology page', () => {
  it('uses aligned animated sections and exposes both calculator paths', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    const list = vi.spyOn(numbersAPI, 'list').mockResolvedValue({ items: [], total: 0, page: 1, limit: 8, pages: 0 });
    const { container } = render(<MemoryRouter><Numerology /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: /Find the numbers that feel like you/i })).toBeVisible();
    expect(container.querySelectorAll('[data-motion-reveal="section"]').length).toBeGreaterThanOrEqual(4);
    expect(screen.getByRole('heading', { name: 'Reveal your mobile number root' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Calculate your personal numbers' })).toBeVisible();

    await user.type(screen.getByLabelText('Mobile number'), '9999999999');
    await user.click(screen.getByRole('button', { name: 'Show Sum 9 Numbers' }));
    await waitFor(() => expect(list).toHaveBeenCalledWith({ numerology: 9, limit: 8, status: 'AVAILABLE' }));
    expect(await screen.findByRole('heading', { name: 'VIP numbers aligned with Sum 9' })).toBeVisible();

    await user.type(screen.getByLabelText(/Full name/), 'Rahul Sharma');
    await user.click(screen.getByRole('button', { name: 'Calculate My Numbers' }));
    expect(await screen.findByRole('heading', { name: 'Your core numerology numbers' })).toBeVisible();
    await waitFor(() => expect(scrollIntoView.mock.instances.at(-1)?.id).toBe('numerology-profile-results'));
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'start' });
  });
});
