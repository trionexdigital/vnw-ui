import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ScrollToTop from '@/app/router/ScrollToTop';

afterEach(() => vi.restoreAllMocks());

describe('ScrollToTop', () => {
  it('returns to the top after each route navigation', async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    render(
      <MemoryRouter initialEntries={['/first']}>
        <ScrollToTop />
        <Link to="/second">Open second page</Link>
        <Routes>
          <Route path="/first" element={<div>First page</div>} />
          <Route path="/second" element={<div>Second page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    scrollTo.mockClear();
    await user.click(screen.getByRole('link', { name: 'Open second page' }));

    expect(screen.getByText('Second page')).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });
});
