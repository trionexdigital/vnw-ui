import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeControl, ThemeProvider } from '@/shared/theme';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.classList.remove('dark');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.removeProperty('color-scheme');
});

describe('ThemeControl', () => {
  it('starts with the system setting and allows explicit light and dark choices', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeControl /></ThemeProvider>);

    expect(screen.getByRole('radio', { name: 'Follow system theme' })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('radio', { name: 'Use dark theme' }));

    expect(screen.getByRole('radio', { name: 'Use dark theme' })).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem('vnw_theme')).toBe('dark');
    await user.click(screen.getByRole('radio', { name: 'Use light theme' }));
    expect(document.documentElement).not.toHaveClass('dark');
    await user.click(screen.getByRole('radio', { name: 'Follow system theme' }));
    expect(window.localStorage.getItem('vnw_theme')).toBe('system');
  });

  it('shows a readable label when requested', () => {
    render(<ThemeProvider><ThemeControl showLabel /></ThemeProvider>);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Color theme' })).toBeInTheDocument();
  });

  it('supports keyboard selection', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeControl /></ThemeProvider>);
    screen.getByRole('radio', { name: 'Use light theme' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('radio', { name: 'Use light theme' })).toHaveAttribute('aria-checked', 'true');
    expect(window.localStorage.getItem('vnw_theme')).toBe('light');
  });
});
