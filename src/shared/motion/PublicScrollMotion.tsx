import { useEffect, useRef, type ReactNode } from 'react';

const MANAGED_MOTION_SELECTOR = '[data-motion-reveal], [data-testid="number-card"], [data-testid="family-pack-card"]';
const SKIP_SELECTOR = 'footer, nav, [role="dialog"], [data-no-scroll-motion]';

function isElementVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

export default function PublicScrollMotion({ children, routeKey }: { children: ReactNode; routeKey: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const processed = new WeakSet<HTMLElement>();
    let revealIndex = 0;
    let frame = 0;

    const reveal = (element: HTMLElement) => {
      element.dataset.vnwScrollState = 'visible';
    };

    const observer = !reducedMotion && typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const element = entry.target as HTMLElement;
            reveal(element);
            observer.unobserve(element);
          });
        }, { threshold: 0.06, rootMargin: '0px 0px -7% 0px' })
      : null;

    const register = (element: Element) => {
      if (!(element instanceof HTMLElement) || processed.has(element)) return;
      if (!isElementVisible(element) || element.matches(SKIP_SELECTOR) || element.closest(SKIP_SELECTOR)) return;
      if (element.matches(MANAGED_MOTION_SELECTOR) || element.closest(MANAGED_MOTION_SELECTOR)) return;

      processed.add(element);
      element.dataset.vnwScrollReveal = 'true';
      element.style.setProperty('--vnw-scroll-delay', `${Math.min(revealIndex % 6, 5) * 45}ms`);
      revealIndex += 1;

      if (!observer) reveal(element);
      else observer.observe(element);
    };

    const scan = () => {
      revealIndex = 0;
      const topLevel = Array.from(root.children);
      const contentRoots = topLevel.length === 1 && topLevel[0] instanceof HTMLElement
        ? Array.from(topLevel[0].children)
        : topLevel;

      contentRoots.forEach((block) => {
        if (!(block instanceof HTMLElement)) return;
        if (block.matches(MANAGED_MOTION_SELECTOR)) return;
        if (block.classList.contains('grid') && block.children.length > 1) {
          Array.from(block.children).forEach(register);
        } else {
          register(block);
        }
      });

      root.querySelectorAll<HTMLElement>('[data-scroll-reveal], .number-card-grid, .public-scroll-grid').forEach(register);
    };

    const scheduleScan = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(scan);
    };

    scan();
    const mutationObserver = new MutationObserver(scheduleScan);
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      observer?.disconnect();
    };
  }, [routeKey]);

  return <div ref={rootRef} className="contents">{children}</div>;
}
