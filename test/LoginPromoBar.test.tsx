import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PromoBar } from '@/shared/layout/PublicLayout';
import { useStore } from '@/shared/store/useStore';

describe('login sale announcement', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-27T10:00:00Z'));
    localStorage.setItem('token', 'signed-in');
    sessionStorage.setItem('vnw_login_promo_expires_at', String(Date.now() + 5_000));
    sessionStorage.removeItem('vnw_login_promo_started');
    useStore.setState({ site: { PROMO_TEXT: '🎉 MEGA FESTIVAL SALE — use code WELCOME10 for 10% OFF your first VIP number!' } });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('shows once after login and disappears at the five-second session deadline', () => {
    const view = render(<MemoryRouter><PromoBar /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /MEGA FESTIVAL SALE/ })).toHaveAttribute('href', '/shop?badge=HOT_DEAL');

    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.queryByRole('link', { name: /MEGA FESTIVAL SALE/ })).not.toBeInTheDocument();

    view.unmount();
    render(<MemoryRouter><PromoBar /></MemoryRouter>);
    expect(screen.queryByRole('link', { name: /MEGA FESTIVAL SALE/ })).not.toBeInTheDocument();
  });
});
