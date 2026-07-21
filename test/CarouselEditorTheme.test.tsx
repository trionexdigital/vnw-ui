import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import CarouselEditor from '@/pages/admin/carousel/CarouselEditor';
import { THEME_STORAGE_KEY, ThemeProvider } from '@/shared/theme/ThemeProvider';

describe('Carousel Studio theme', () => {
  beforeEach(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    document.documentElement.className = '';
  });

  afterEach(() => {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.className = '';
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = '';
  });

  it('keeps its workspace light without changing the saved application theme', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <CarouselEditor />
        </MemoryRouter>
      </ThemeProvider>,
    );

    const studio = screen.getByRole('main');
    expect(document.documentElement).toHaveClass('dark');
    expect(studio).toHaveAttribute('data-carousel-studio-theme', 'light');
    expect(studio).toHaveStyle({ colorScheme: 'light' });
    expect(screen.getByRole('heading', { name: 'Choose a starting point' })).toBeInTheDocument();
  });
});
