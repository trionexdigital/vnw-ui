import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
  ThemeProvider,
  useTheme,
} from '@/shared/theme';
import { setMediaQueryMatches } from './setup';

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div>
      <output aria-label="selected theme">{theme}</output>
      <output aria-label="resolved theme">{resolvedTheme}</output>
      <button type="button" onClick={() => setTheme('light')}>Choose light</button>
      <button type="button" onClick={() => setTheme('dark')}>Choose dark</button>
      <button type="button" onClick={() => setTheme('system')}>Choose system</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.classList.remove('dark');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.removeProperty('color-scheme');
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.remove();
});

describe('ThemeProvider', () => {
  it('defaults to the system preference and applies the resolved light theme', () => {
    renderProvider();

    expect(screen.getByLabelText('selected theme')).toHaveTextContent('system');
    expect(screen.getByLabelText('resolved theme')).toHaveTextContent('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#FBFAF7');
  });

  it('restores a persisted dark preference and updates browser chrome metadata', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    renderProvider();

    expect(screen.getByLabelText('selected theme')).toHaveTextContent('dark');
    expect(screen.getByLabelText('resolved theme')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#12100F');
  });

  it('treats an invalid stored value as system', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    setMediaQueryMatches(THEME_MEDIA_QUERY, true);
    renderProvider();

    expect(screen.getByLabelText('selected theme')).toHaveTextContent('system');
    expect(screen.getByLabelText('resolved theme')).toHaveTextContent('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('follows operating-system changes only while System is selected', () => {
    renderProvider();

    act(() => setMediaQueryMatches(THEME_MEDIA_QUERY, true));
    expect(screen.getByLabelText('resolved theme')).toHaveTextContent('dark');

    fireEvent.click(screen.getByRole('button', { name: 'Choose light' }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(screen.getByLabelText('resolved theme')).toHaveTextContent('light');

    act(() => setMediaQueryMatches(THEME_MEDIA_QUERY, false));
    act(() => setMediaQueryMatches(THEME_MEDIA_QUERY, true));
    expect(screen.getByLabelText('resolved theme')).toHaveTextContent('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('synchronizes valid preferences and storage resets from another tab', () => {
    renderProvider();

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: THEME_STORAGE_KEY,
        newValue: 'dark',
      }));
    });
    expect(screen.getByLabelText('selected theme')).toHaveTextContent('dark');

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: THEME_STORAGE_KEY,
        newValue: null,
      }));
    });
    expect(screen.getByLabelText('selected theme')).toHaveTextContent('system');
  });
});
