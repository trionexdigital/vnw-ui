import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  disconnect() {}
  observe(target: Element) {
    this.callback([
      {
        boundingClientRect: target.getBoundingClientRect(),
        intersectionRatio: 1,
        intersectionRect: target.getBoundingClientRect(),
        isIntersecting: true,
        rootBounds: null,
        target,
        time: 0,
      },
    ], this);
  }
  takeRecords() { return []; }
  unobserve() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  configurable: true,
  writable: true,
  value: MockIntersectionObserver,
});

class MockMediaQueryList extends EventTarget implements MediaQueryList {
  matches = false;
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null = null;

  constructor(readonly media: string) {
    super();
  }

  addListener(callback: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null) {
    if (callback) this.addEventListener('change', callback as EventListener);
  }

  removeListener(callback: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null) {
    if (callback) this.removeEventListener('change', callback as EventListener);
  }

  setMatches(matches: boolean) {
    if (this.matches === matches) return;
    this.matches = matches;

    const event = new Event('change') as MediaQueryListEvent;
    Object.defineProperties(event, {
      matches: { configurable: true, value: matches },
      media: { configurable: true, value: this.media },
    });
    this.dispatchEvent(event);
    this.onchange?.call(this, event);
  }
}

const mediaQueries = new Map<string, MockMediaQueryList>();

export function setMediaQueryMatches(query: string, matches: boolean) {
  const mediaQuery = window.matchMedia(query) as MockMediaQueryList;
  mediaQuery.setMatches(matches);
}

export function resetMediaQueries() {
  mediaQueries.clear();
}

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: (query: string) => {
    let mediaQuery = mediaQueries.get(query);
    if (!mediaQuery) {
      mediaQuery = new MockMediaQueryList(query);
      mediaQueries.set(query, mediaQuery);
    }
    return mediaQuery;
  },
});

Object.defineProperties(HTMLElement.prototype, {
  hasPointerCapture: {
    configurable: true,
    value: () => false,
  },
  releasePointerCapture: {
    configurable: true,
    value: () => undefined,
  },
  scrollIntoView: {
    configurable: true,
    value: () => undefined,
  },
  setPointerCapture: {
    configurable: true,
    value: () => undefined,
  },
});

afterEach(() => {
  resetMediaQueries();
});
