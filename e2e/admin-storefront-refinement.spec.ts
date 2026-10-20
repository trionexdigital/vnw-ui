import { expect, test, type Page } from '@playwright/test';

const inventory = Array.from({ length: 26 }, (_, i) => ({ number_id: i + 1, number_value: `800800${String(9000 + i)}`, display_number: `800800${String(9000 + i)}`, mrp: '6875.00', offer_price: '6531.25', discount_pct: '5.00', base_price: '5500.00', additional_discount_pct: '0.00', status: 'AVAILABLE', stock: 1, visibility_type: 'ONLINE', rtp_status: 'RTP', categories: [], title_label: 'VIP Number' }));
async function mock(page: Page, admin = false) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript((admin) => {
    localStorage.setItem('vnw_language', 'en'); localStorage.setItem('vnw_location_prompt_seen', '1');
    if (admin) { localStorage.setItem('token', 'admin-test'); localStorage.setItem('user', JSON.stringify({ user_id: 1, full_name: 'Administrator', role: 'ADMIN', permissions: ['*'] })); }
  }, admin);
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('**/vipnumberworld/**', async route => {
    const url = route.request().url(); let data: any = [];
    if (url.endsWith('/auth/me')) data = { user_id: 1, full_name: 'Administrator', role: 'ADMIN' };
    else if (url.endsWith('/site/settings')) data = { WHATSAPP: '918400084002' };
    else if (url.endsWith('/admin/settings/get')) data = { GST_PERCENT: '18', SITE_TITLE: 'VIP Number World', SITE_TAGLINE: 'Your Number. Your Identity.', CONTACT_EMAIL: 'info@vipnumberworld.com' };
    else if (url.endsWith('/site/languages/catalog')) data = { translations: {} };
    else if (url.endsWith('/site/hero-stats')) data = { delivered_numbers: 100, available_numbers: 26, customers_served: 50 };
    else if (/\/numbers\/(list|featured|similar)$/.test(url)) data = { items: inventory.slice(0, 10), total: 26, pages: 3 };
    else if (/\/admin\/.+\/list$/.test(url) && !/\/(faqs|banners|carousel|deals-of-day|trusted-clients|home-premium|delivery-cities|dealers)\/list$/.test(url)) data = { items: [], total: 0, page: 1, pages: 1, summary: {}, languages: [] };
    await route.fulfill({ json: { status: 1, info: 'OK', data } });
  });
}

test('compact search, CTA gutters and centered footer fit all languages and viewport sizes', async ({ page }, info) => {
  test.setTimeout(300_000); await mock(page);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const lang of ['en','hi','mr','hg','gu','bn','pa','ta','te','kn','ml','or']) {
    await page.goto(`/?lang=${lang}`);
    await expect(page.locator('.marketplace-cta__card')).toBeAttached();
    for (const width of [320,375,768,1366,1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => window.scrollTo(0, 0));
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      const card = page.locator('.marketplace-cta__card');
      const buttons = await card.locator('.marketplace-cta__actions > a').evaluateAll(nodes => nodes.map(el => { const b = el.getBoundingClientRect(); const c = el.closest('.marketplace-cta__card')!.getBoundingClientRect(); return { left: b.left - c.left, right: c.right - b.right, overflow: el.scrollWidth - el.clientWidth }; }));
      buttons.forEach(button => { expect(button.left).toBeGreaterThanOrEqual(17); expect(button.right).toBeGreaterThanOrEqual(17); expect(button.overflow).toBeLessThanOrEqual(1); });
      if (lang === 'en' && width === 375) await card.screenshot({ path: info.outputPath('cta-375.png') });
      if (width >= 1200) {
        const search = page.locator('.store-header__search .header-number-search');
        expect((await search.boundingBox())!.width).toBeLessThanOrEqual(261);
        const auth = await page.locator('.store-header__auth-link').first().boundingBox(); expect(auth!.width).toBeLessThanOrEqual(93);
        await search.locator('input').focus();
        await expect(search.locator('.header-number-search__result').first()).toBeVisible();
        expect((await search.locator('.header-number-search__panel').boundingBox())!.width).toBeLessThanOrEqual(281);
        expect(await search.locator('.header-number-search__panel').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
        if (lang === 'en' && width === 1366) await page.screenshot({ path: info.outputPath('header-search-1366.png') });
        await search.locator('input').press('Escape');
      }
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const copyright = (await page.locator('.store-footer__copyright').boundingBox())!;
      expect(Math.abs(copyright.x + copyright.width / 2 - width / 2)).toBeLessThanOrEqual(2);
      if (width < 1024) {
        const nav = (await page.locator('.store-mobile-navigation').boundingBox())!;
        expect(copyright.y + copyright.height).toBeLessThan(nav.y - 8);
        const floating = page.locator('a[aria-label="WhatsApp"]');
        if (await floating.isVisible()) {
          const button = (await floating.boundingBox())!;
          expect(copyright.x + copyright.width).toBeLessThan(button.x);
        }
      }
      if (lang === 'en' && [375,1366].includes(width)) await page.screenshot({ path: info.outputPath(`footer-${width}.png`) });
    }
    await page.locator('.marketplace-cta__actions > a').first().click();
    await expect(page).toHaveURL(/\/premium-numbers/);
    await page.locator('.store-header__brand').click();
    await expect(page.locator('.marketplace-cta__card')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('multi-record selection spans pages and uses the existing validation and Recycle confirmation', async ({ page }, info) => {
  await mock(page, true); let rows = [...inventory]; const removed: any[] = [];
  await page.route('**/admin/numbers/list', async route => { const body = route.request().postDataJSON(); const start = (body.page - 1) * body.limit; await route.fulfill({ json: { status: 1, data: { items: rows.slice(start, start + body.limit), total: rows.length } } }); });
  await page.route('**/admin/numbers/delete/validate', async route => {
    const numbers = route.request().postDataJSON().numbers.split('\n');
    await route.fulfill({ json: { status: 1, data: { total: numbers.length, eligible: rows.filter(n => numbers.includes(n.number_value)), invalid: [], not_found: [], duplicates: [], already_deleted: [], blocked: [], validation_token: 'recycle-v1' } } });
  });
  await page.route('**/admin/numbers/delete', async route => { const body = route.request().postDataJSON(); removed.push(body); rows = rows.filter(n => !body.numbers.split('\n').includes(n.number_value)); await route.fulfill({ json: { status: 1, data: {} } }); });
  await page.setViewportSize({ width: 1366, height: 900 }); await page.goto('/admin/numbers');
  await page.getByRole('checkbox', { name: `Select ${inventory[0].number_value}`, exact: true }).check();
  await expect(page.getByRole('checkbox', { name: 'Select all numbers on this page', exact: true })).toHaveJSProperty('indeterminate', true);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await page.getByRole('checkbox', { name: `Select ${inventory[25].number_value}`, exact: true }).check();
  await page.getByRole('button', { name: 'Delete selected (2)', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Mobile numbers')).toHaveValue(`${inventory[0].number_value}\n${inventory[25].number_value}`);
  await dialog.getByRole('button', { name: 'Validate', exact: true }).click();
  await dialog.getByRole('button', { name: 'Delete 2 numbers', exact: true }).click();
  expect(removed).toHaveLength(0);
  await dialog.getByRole('button', { name: 'Confirm delete', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(removed[0]).toMatchObject({ confirm: true, validation_token: 'recycle-v1' });
  await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 900 });
  const selectPage = page.getByRole('checkbox', { name: 'Select all numbers on this page', exact: true });
  await selectPage.check(); await expect(page.getByRole('button', { name: 'Delete selected (24)', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('inventory-mobile-selection.png') });
  await selectPage.uncheck(); await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeVisible();
});

test('Settings and admin forms share inventory control sizing without changing submitted values', async ({ page }, info) => {
  test.setTimeout(120_000); await mock(page, true); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  let saved: any; await page.route('**/admin/settings/save', async route => { saved = route.request().postDataJSON(); await route.fulfill({ json: { status: 1, data: {} } }); });
  for (const width of [375,1366]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/admin/settings','/admin/numbers','/admin/users','/admin/coupons','/admin/payments','/admin/orders','/admin/private-links','/admin/languages','/admin/dealer-purchases','/admin/prebooks','/admin/faqs','/admin/testimonials','/admin/trusted-clients','/admin/delivery-cities','/admin/messages','/admin/subscribers','/admin/sell-requests','/admin/payouts','/admin/dealers','/admin/approvals','/admin/home-premium','/admin/deals-of-day','/admin/carousel']) {
      await page.goto(path); await page.waitForLoadState('networkidle'); await expect(page.locator('.admin-shell'), path).toBeVisible();
      await expect(page.locator('[data-wireframe]')).toHaveCount(0);
      const controls = await page.locator('.account-content input:not([type="hidden"]):not([type="checkbox"]):not([type="file"]):not([type="range"]):not([type="color"]), .account-content button[role="combobox"], .account-content select').evaluateAll(nodes => nodes.filter(el => (el as HTMLElement).offsetWidth > 0).map(el => ({ height: el.getBoundingClientRect().height, overflow: el.getBoundingClientRect().right > window.innerWidth + 1 })));
      controls.forEach(control => { expect(control.height, path).toBe(36); expect(control.overflow, path).toBe(false); });
      if (path === '/admin/settings') {
        await page.screenshot({ path: info.outputPath(`settings-${width}.png`) });
        await page.getByRole('button', { name: 'Save settings', exact: true }).click();
        expect(saved).toMatchObject({ GST_PERCENT: '18', SITE_TITLE: 'VIP Number World', CONTACT_EMAIL: 'info@vipnumberworld.com' });
        expect(saved.GLOBAL_NUMBER_DISCOUNT_PERCENT).toBeUndefined();
      }
    }
  }
  expect(errors).toEqual([]);
});
