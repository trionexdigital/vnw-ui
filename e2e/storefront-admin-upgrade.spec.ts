import { test, expect, type Page } from '@playwright/test';

test.setTimeout(180_000);

const numbers = Array.from({ length: 100 }, (_, index) => ({ number_id: index + 1, number_value: String(9000000000 + index), display_number: String(9000000000 + index), title_label: 'Business VIP Number', badge: 'PREMIUM', mrp: index === 0 ? 99999999 : 39999, offer_price: index === 0 ? 49999999.50 : 19999.50, discount_pct: 50, stock: 1, status: 'AVAILABLE', visibility_type: 'ONLINE', rtp_status: 'RTP', categories: [{ slug: 'mirror', name: 'Mirror & symmetry' }], numerology_sum: 36 }));
const cities = [{ city_id: 1, city_name: 'Mumbai', state_name: 'Maharashtra', description: 'Delivery by appointment', is_active: 1, is_highlighted: 1, sort_order: 0 }];
const requests: any[] = [];
async function mock(page: Page, admin = false) {
  await page.addInitScript((isAdmin) => {
    localStorage.setItem('vnw_theme', 'dark');
    if (isAdmin) { localStorage.setItem('token', 'test-admin'); localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Administrator', email: 'admin@example.test', role: 'ADMIN', permissions: ['*'] })); }
  }, admin);
  await page.route('http://localhost:3002/vipnumberworld/**', async (route) => {
    const url = route.request().url(); const payload = route.request().postDataJSON() || {};
    requests.push({ url, payload });
    let data: any = [];
    if (url.endsWith('/site/settings')) data = {};
    else if (url.endsWith('/numbers/list')) data = { items: numbers.slice(0, payload.limit || 7), total: 100, page: 1, pages: 5 };
    else if (url.endsWith('/site/deals-of-day')) data = { items: [], source: 'CURATED' };
    else if (url.endsWith('/site/hero-stats')) data = { available_numbers: 100, delivered_numbers: 200, customers_served: 50 };
    else if (url.endsWith('/categories/list')) data = [{ slug: 'mirror', name: 'Mirror & symmetry', number_count: 100 }, { slug: 'penta', name: 'Penta', number_count: 25 }];
    else if (url.endsWith('/site/corporate-packs') || url.endsWith('/site/family-packs')) data = [{ pack_id: 'live-pack', title: 'Business series', pack_type: payload.pack_type, size: payload.size, total_price: payload.size * 19999.50, is_available: true, is_active: true, sort_order: 0, numbers: numbers.slice(0, payload.size) }];
    else if (url.endsWith('/delivery-cities') || url.endsWith('/delivery-cities/list')) data = cities;
    else if (url.endsWith('/admin/dealer-purchases/dealers/list')) data = [{ external_dealer_id: 2, dealer_user_id: 4, name: 'Same name', email: 'one@example.test', phone: '9876500000', total_billed: 500, total_paid: 0, amount_remaining: 500 }, { external_dealer_id: 3, dealer_user_id: 5, name: 'Same name', email: 'two@example.test', phone: '9876500001', total_billed: 300, total_paid: 0, amount_remaining: 300 }];
    else if (url.endsWith('/admin/dealer-purchases/summary')) data = { total_billed: 800, total_paid: 0, amount_remaining: 800, inventory_count: 0, sold_count: 0, deleted_count: 0 };
    else if (url.includes('/admin/') && url.endsWith('/list')) data = { items: [], total: 0, pages: 0 };
    else if (url.endsWith('/cart/list')) data = { items: [], total: 0 };
    else if (url.endsWith('/auth/me')) data = { user_id: 1, full_name: 'Administrator', email: 'admin@example.test', role: 'ADMIN' };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, info: 'OK', data }) });
  });
}

test('corporate filters call the bulk API and cities/order appear on the homepage', async ({ page }, info) => {
  await mock(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(page.locator('header').getByRole('link', { name: 'Corporate Pack' })).toBeVisible();
  await expect(page.locator('.home-family-shelf')).toBeVisible();
  const order = await page.locator('.home-family-shelf,.home-corporate-shelf,.home-pattern-gallery').evaluateAll((elements) => elements.map((item) => item.className));
  expect(order[0]).toContain('home-family-shelf'); expect(order[1]).toContain('home-corporate-shelf'); expect(order[2]).toContain('home-pattern-gallery');
  await expect(page.getByRole('heading', { name: 'Home delivery in selected cities' })).toBeVisible();
  const gallery = page.locator('.home-pattern-gallery');
  expect(await gallery.evaluate((item) => item.nextElementSibling?.textContent)).toContain('From checkout to confident activation');
  await page.goto('/corporate-numbers');
  await page.getByRole('combobox', { name: 'Corporate pack size' }).click();
  await page.getByRole('option', { name: '100 numbers', exact: true }).click();
  await page.getByRole('combobox', { name: 'Corporate category' }).click();
  await page.getByRole('option', { name: 'Penta', exact: true }).click();
  await expect.poll(() => requests.filter((item) => item.url.endsWith('/site/corporate-packs')).at(-1)?.payload).toMatchObject({ size: 100, category_slug: 'penta', pack_type: 'SERIES' });
  await expect(page.getByRole('link', { name: '9000000099' })).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('corporate-desktop.png'), fullPage: true });
});

test('mobile drawer opens on the right, scrolls, closes and restores body scrolling', async ({ page }, info) => {
  await mock(page); await page.setViewportSize({ width: 375, height: 480 }); await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Store navigation' });
  await expect(drawer).toBeVisible();
  await expect.poll(async () => {const box=await drawer.boundingBox();return box ? Math.round(box.x+box.width) : 0;}).toBe(375);
  await expect(drawer.getByRole('link', { name: 'Register', exact: true })).toBeVisible();
  await expect(drawer.getByRole('link', { name: 'Sign In', exact: true })).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-scroll-locked', '1');
  const scroll=drawer.locator('.store-drawer__scroll');
  await scroll.evaluate((item) => item.scrollTop = item.scrollHeight);
  await expect.poll(() => scroll.evaluate((item) => item.scrollTop)).toBeGreaterThan(0);
  await expect(drawer.getByRole('link', { name: 'Contact', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('drawer-mobile.png') });
  await page.keyboard.press('Escape'); await expect(drawer).toBeHidden();
  await expect(page.locator('body')).not.toHaveAttribute('data-scroll-locked');
  await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
  await expect(drawer).toBeVisible(); await drawer.getByRole('link', { name: 'Corporate Pack' }).click();
  await expect(page).toHaveURL(/corporate-numbers/); await expect(drawer).toBeHidden();
});

test('number cards match personality tiles and fit every narrow viewport', async ({ page }, info) => {
  await mock(page);
  for (const width of [320, 375, 430, 768, 1024, 1200, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/', { waitUntil: 'domcontentloaded' });
    const card = page.locator('#home-premium [data-testid="number-card"]').first(); await expect(card).toBeVisible();
    const panelOverflow = await page.locator('.public-header__panel').evaluate((item) => item.scrollWidth - item.clientWidth);
    expect(panelOverflow, `header overflow at ${width}`).toBeLessThanOrEqual(1);
    if (width < 768) {
      const tile = page.locator('.home-pattern-gallery__tile').first();
      expect(Math.abs((await card.boundingBox())!.width - (await tile.boundingBox())!.width), `mobile tile width at ${width}`).toBeLessThanOrEqual(1);
    }
    const overflow = await card.evaluate((item) => Array.from(item.querySelectorAll<HTMLElement>('div,button,a,span,dl')).filter((child) => child.scrollWidth > child.clientWidth + 2 && !child.classList.contains('reference-card__digits')).map((child) => `${child.className}: ${child.scrollWidth}/${child.clientWidth}`));
    expect(overflow, `card content overflow at ${width}`).toEqual([]);
    for (const route of ['/shop', '/numerology', '/premium-numbers', '/newly-added-vip-numbers', '/categories', '/family-pack', '/corporate-numbers', '/about', '/how-it-works', '/faq', '/terms-and-conditions']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' }); await expect(page.locator('.public-route-content')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `${route} page overflow at ${width}`).toBeLessThanOrEqual(1);
      const layout = await page.locator('.public-route-content').evaluate((item) => ({ width: item.getBoundingClientRect().width, padding: parseFloat(getComputedStyle(item).paddingLeft) }));
      expect(Math.round(layout.width)).toBe(width); expect(layout.padding).toBe(width < 640 ? 12 : width < 1024 ? 20 : 24);
    }
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    const shopCard = page.getByTestId('number-card').first(); await expect(shopCard).toBeVisible();
    const shopOverflow = await shopCard.evaluate((item) => Array.from(item.querySelectorAll<HTMLElement>('div,button,a,dl')).filter((child) => child.scrollWidth > child.clientWidth + 2).map((child) => child.className));
    expect(shopOverflow, `search card overflow at ${width}`).toEqual([]);
    expect(await page.locator('footer .newsletter-form').evaluate((form) => {
      const frame = form.getBoundingClientRect();
      return Array.from(form.children).every((item) => item.getBoundingClientRect().right <= frame.right + 1);
    }), `footer controls fit at ${width}`).toBe(true);
    if ([375,1440].includes(width)) await page.screenshot({ path: info.outputPath(`shop-${width}.png`), fullPage: true });
  }
});

test('the storefront header remains mounted while a new screen loads', async ({ page }) => {
  await mock(page); await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#home-premium').getByTestId('number-card').first()).toBeVisible();
  await page.route('**/src/pages/legal/LegalPage.tsx', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500)); await route.continue();
  });
  await page.locator('footer a[href="/terms-and-conditions"]').click();
  await expect(page.locator('.public-header')).toBeVisible();
  await expect(page.locator('.public-route-content')).toHaveCSS('opacity', '1');
  await expect(page.locator('.legal-page')).toBeVisible();
});

test('admin controls cities, selects actual dealers, and keeps theme in profile only', async ({ page }, info) => {
  await mock(page, true); await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/admin/delivery-cities');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('aside').getByRole('link', { name: 'Home Delivery Cities', exact: true })).toBeVisible();
  await expect(page.locator('header').getByRole('button', { name: 'Dark', exact: true })).toHaveCount(0);
  await expect(page.getByText('Mumbai', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add city', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('City', { exact: true }).fill('Pune'); await modal.getByLabel('State', { exact: true }).fill('Maharashtra');
  await modal.getByLabel('Highlight this city').check(); await modal.getByRole('button', { name: 'Save city' }).click();
  await expect.poll(() => requests.findLast((item) => item.url.endsWith('/delivery-cities/save'))?.payload).toMatchObject({ city_name: 'Pune', is_highlighted: true, is_active: true });
  await page.goto('/admin/dealer-purchases'); await page.getByRole('button', { name: 'Add Numbers' }).click();
  const input = page.locator('input').filter({ hasNot: page.locator('[type=number]') });
  const search = page.getByRole('dialog').locator('input').first();
  await search.fill('two@'); await expect(page.getByRole('button', { name: 'Same name · two@example.test', exact: true })).toBeVisible();
  await search.fill('missing dealer'); await expect(page.getByText('No dealer accounts found.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create new dealer' })).toBeVisible();
  await search.fill(''); await expect(page.getByRole('button', { name: 'Same name · one@example.test', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('dealer-selector.png') });
  await page.keyboard.press('Escape');
  await page.goto('/account'); await expect(page.getByText('Appearance', { exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: /dark/i })).toBeVisible();
  await page.goto('/', { waitUntil: 'domcontentloaded' }); await expect(page.locator('html')).not.toHaveClass(/dark/); expect(await page.evaluate(() => localStorage.getItem('vnw_theme'))).toBe('dark');
  await page.goto('/admin/delivery-cities'); await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({ path: info.outputPath('delivery-admin-dark.png') });
  for (const width of [320, 375, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/admin/delivery-cities', '/admin/dealer-purchases', '/admin/dealers', '/admin/dealers/new', '/account']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const content = page.locator('.account-content'); await expect(content).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${route} admin overflow at ${width}`).toBeLessThanOrEqual(1);
      expect(await content.evaluate((item) => parseFloat(getComputedStyle(item).paddingLeft))).toBe(width < 640 ? 12 : width < 1024 ? 20 : 24);
    }
  }
});

