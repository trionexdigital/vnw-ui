import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
}

export const THEME_STORAGE_KEY = 'vnw_theme';
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#FBFAF7',
  dark: '#12100F',
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const canUseDOM = () => typeof window !== 'undefined' && typeof document !== 'undefined';

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

function readStoredTheme(): ThemeMode {
  if (!canUseDOM()) return 'system';

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(storedTheme) ? storedTheme : 'system';
  } catch {
    return 'system';
  }
}

function readSystemTheme(): ResolvedTheme {
  if (!canUseDOM() || typeof window.matchMedia !== 'function') return 'light';

  try {
    return window.matchMedia(THEME_MEDIA_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function setThemeColor(theme: ResolvedTheme) {
  let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (!themeColor) {
    themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    document.head.appendChild(themeColor);
  }

  themeColor.content = THEME_COLORS[theme];
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  setThemeColor(theme);
}

const useIsomorphicLayoutEffect = canUseDOM() ? useLayoutEffect : useEffect;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(readSystemTheme);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    if (!isThemeMode(nextTheme)) return;
    if (nextTheme === 'system') setSystemTheme(readSystemTheme());
    setThemeState(nextTheme);
  }, []);

  useIsomorphicLayoutEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable in private browsing or restricted contexts.
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);
    const updateSystemTheme = (event: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    updateSystemTheme(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateSystemTheme);
      return () => mediaQuery.removeEventListener('change', updateSystemTheme);
    }

    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(updateSystemTheme);
      return () => mediaQuery.removeListener(updateSystemTheme);
    }

    return undefined;
  }, [theme]);

  useEffect(() => {
    const syncThemeAcrossTabs = (event: StorageEvent) => {
      if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
      const nextTheme = isThemeMode(event.newValue) ? event.newValue : 'system';
      if (nextTheme === 'system') setSystemTheme(readSystemTheme());
      setThemeState(nextTheme);
    };

    window.addEventListener('storage', syncThemeAcrossTabs);
    return () => window.removeEventListener('storage', syncThemeAcrossTabs);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
