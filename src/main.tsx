/**
 * main.tsx
 * ─────────────────────────────────────────────────────────────────
 * Application entry point — executed once when the browser loads the
 * page.  Responsibilities:
 *
 *  1. Mount the React root into the #root div defined in index.html.
 *  2. Register the PWA service worker so the app shell is cached and
 *     the app works offline after the first visit.
 */

import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
// import { setupServiceWorker } from './pwa/sw-lifecycle';

// ── 1. Mount React ───────────────────────────────────────────────
// The non-null assertion (!) is safe here because index.html always
// contains <div id="root"></div>.
createRoot(document.getElementById('root')!).render(<App />);

// PWA service worker registration removed
