/**
 * vite.config.ts
 * ─────────────────────────────────────────────────────────────────
 * Vite build configuration for the Vaani frontend.
 *
 * Sections:
 *  1. optimizeDeps  — pre-bundle heavy packages so the dev server starts faster.
 *  2. plugins       — React fast-refresh + PWA service-worker generation.
 *  3. resolve       — path aliases (@, @shared) so imports stay short.
 *  4. test          — Vitest configuration.
 */

/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // ── 1. Dependency pre-bundling ──────────────────────────────────
  // Vite pre-bundles CJS packages so they load as a single ESM chunk.
  // List large libraries here to avoid slow cold-start in development.
  optimizeDeps: {
    include: [
      'dayjs',
    ],
  },

  // ── 2. Plugins ──────────────────────────────────────────────────
  plugins: [
    // React — enables JSX transform and Fast Refresh in development.
    react(),

    // PWA plugin removed
  ],

  // ── 3. Path aliases ─────────────────────────────────────────────
  // Keeps import paths short and refactor-friendly:
  //   import Foo from '@/components/Foo'
  //   import Bar from '@shared/schema'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },

  // ── 4. Vitest ───────────────────────────────────────────────────
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
