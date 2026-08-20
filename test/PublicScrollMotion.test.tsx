import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PublicScrollMotion from '@/shared/motion/PublicScrollMotion';
import { Loader } from '@/shared/components/ui-bits';
import { MemoryRouter } from 'react-router-dom';
import { setMediaQueryMatches } from './setup';

describe('public scroll motion and loading wireframes', () => {
  it('reveals meaningful page blocks while leaving specialized motion components untouched', async () => {
    render(
      <PublicScrollMotion routeKey="/about">
        <div>
          <section data-testid="static-section">Static public content</section>
          <section data-testid="managed-section" data-motion-reveal="section">Managed content</section>
        </div>
      </PublicScrollMotion>,
    );

    await waitFor(() => expect(screen.getByTestId('static-section')).toHaveAttribute('data-vnw-scroll-state', 'visible'));
    expect(screen.getByTestId('static-section')).toHaveAttribute('data-vnw-scroll-reveal', 'true');
    expect(screen.getByTestId('managed-section')).not.toHaveAttribute('data-vnw-scroll-reveal');
  });

  it('uses product-card wireframes for the public accessories listing', () => {
    render(<MemoryRouter initialEntries={['/accessories']}><Loader label="Loading accessories" /></MemoryRouter>);
    expect(screen.getByLabelText('Loading accessories')).toHaveAttribute('aria-busy', 'true');
    expect(document.querySelector('[data-wireframe="products"]')).toBeInTheDocument();
    expect(document.querySelectorAll('.wireframe-shimmer').length).toBeGreaterThan(8);
  });

  it('makes public content immediately visible when reduced motion is requested', async () => {
    setMediaQueryMatches('(prefers-reduced-motion: reduce)', true);
    render(<PublicScrollMotion routeKey="/contact"><div><form data-testid="contact-form">Contact</form></div></PublicScrollMotion>);
    await waitFor(() => expect(screen.getByTestId('contact-form')).toHaveAttribute('data-vnw-scroll-state', 'visible'));
  });
});
