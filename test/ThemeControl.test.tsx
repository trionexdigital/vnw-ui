import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeControl, ThemeProvider } from '@/shared/theme';
import { TooltipProvider } from '@/shared/ui/tooltip';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.classList.remove('dark');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.removeProperty('color-scheme');
});

describe('ThemeControl', () => {
  it('exposes the current selection and changes theme from an accessible radio menu', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TooltipProvider delayDuration={0}>
          <ThemeControl />
        </TooltipProvider>
      </ThemeProvider>,
    );

    const trigger = screen.getByRole('button', { name: 'Theme: System, currently Light' });
    await user.click(trigger);

    expect(screen.getByRole('menuitemradio', { name: /System Light/i })).toHaveAttribute('data-state', 'checked');
    await user.click(screen.getByRole('menuitemradio', { name: 'Dark' }));

    expect(screen.getByRole('button', { name: 'Theme: Dark, currently Dark' })).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem('vnw_theme')).toBe('dark');
  });

  it('can show the selected mode as text for settings and mobile surfaces', () => {
    render(
      <ThemeProvider>
        <TooltipProvider>
          <ThemeControl showLabel />
        </TooltipProvider>
      </ThemeProvider>,
    );

    expect(screen.getByRole('button', { name: 'Theme: System, currently Light' })).toHaveTextContent('System');
  });

  it('supports keyboard selection through the radio menu', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TooltipProvider delayDuration={60_000}>
          <ThemeControl />
        </TooltipProvider>
      </ThemeProvider>,
    );

    const trigger = screen.getByRole('button', { name: 'Theme: System, currently Light' });
    act(() => trigger.focus());
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(screen.getByRole('button', { name: 'Theme: Light, currently Light' })).toBeInTheDocument();
    expect(window.localStorage.getItem('vnw_theme')).toBe('light');
  });
});
