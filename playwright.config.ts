import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    channel: 'chrome',
    storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:5173', localStorage: [{ name: 'vnw_language', value: 'en' }, { name: 'vnw_location_prompt_seen', value: '1' }, { name: 'vnw_website_tour_seen_v1', value: '1' }] }] },
    trace: 'retain-on-failure',
  },
});
