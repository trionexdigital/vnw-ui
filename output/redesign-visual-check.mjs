import { chromium } from '@playwright/test';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const base = 'http://127.0.0.1:5173';
const widths = [320, 375, 430, 768, 1280, 1920];
for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'What matters most to you?' }).waitFor();
  await page.waitForTimeout(350);
  const measure = await page.evaluate(() => {
    const x = (selector) => { const el = document.querySelector(selector); if (!el) return null; const r = el.getBoundingClientRect(); return { width: Math.round(r.width), height: Math.round(r.height) }; };
    const rail = document.querySelector('.home-number-shelf__rail');
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      readiness: x('.home-readiness'),
      gallery: x('.home-pattern-gallery'),
      tile: x('.home-pattern-gallery__tile'),
      railScrollbar: rail ? getComputedStyle(rail).scrollbarWidth : null,
    };
  });
  if (width === 375) {
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await page.waitForTimeout(240);
    await page.screenshot({ path: 'output/redesign-2026-09-28-mobile-menu-final.png' });
    measure.menuBackground = await page.locator('.public-header__drawer').evaluate(el => getComputedStyle(el).backgroundColor);
    await page.getByRole('button', { name: 'Close navigation menu' }).click();
  }
  if (width === 1280) {
    await page.getByRole('heading', { name: 'Every pattern has a personality.' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'output/redesign-2026-09-28-patterns-final.png' });
  }
  console.log(JSON.stringify({ width, ...measure }));
  await context.close();
}
for (const route of ['/how-it-works', '/family-pack', '/numerology', '/about', '/shop']) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const result = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    firstHeading: document.querySelector('h1')?.textContent?.trim(),
    firstSectionHeight: Math.round(document.querySelector('main section')?.getBoundingClientRect().height || 0),
  }));
  console.log(JSON.stringify({ route, ...result }));
  await context.close();
}
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const category = { slug: 'customer-care-numbers', name: 'Mirror', match_spans: [] };
  const item = { number_id: 71, number_value: '9988998877', display_number: '9988 998 877', title_label: 'VIP Number', badge: 'PREMIUM', mrp: 50000, offer_price: 45000, rtp_status: 'RTA', status: 'AVAILABLE', categories: [category], primary_category: category };
  const items = Array.from({ length: 9 }, (_, index) => ({ ...item, number_id: index + 71 }));
  await page.route('**/vipnumberworld/numbers/list', route => route.fulfill({ json: { status: 1, data: { items, total: 30 } } }));
  await page.route('**/vipnumberworld/site/family-packs', route => route.fulfill({ json: { status: 1, data: [{ pack_id: 'sample', title: 'Mirror Duo', pack_type: 'MIXED', description: 'Two memorable numbers', sort_order: 1, is_active: true, size: 2, total_price: 90000, is_available: true, numbers: [item, { ...item, number_id: 72, display_number: '9888 998 877', number_value: '9888998877' }] }] } }));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('.home-number-shelf .reference-card').first().waitFor();
  await page.locator('.home-number-shelf').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'output/redesign-2026-09-28-number-card-final.png' });
  const card = await page.locator('.home-number-shelf .reference-card').first().evaluate(el => {
    const r = el.getBoundingClientRect();
    const actions = el.querySelector('.reference-card__actions').getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height), actionGap: Math.round(actions.top - el.querySelector('.reference-card__price').getBoundingClientRect().bottom), digits: el.querySelector('.reference-card__digits')?.textContent };
  });
  const rail = await page.locator('.home-rail__track').first().evaluate(el => ({ scrollbarWidth: getComputedStyle(el).scrollbarWidth, overflow: el.scrollWidth > el.clientWidth }));
  await page.locator('.home-family-shelf .reference-family').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'output/redesign-2026-09-28-family-card-final.png' });
  const family = await page.locator('.home-family-shelf .reference-family').first().evaluate(el => {
    const r = el.getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height), actions: el.querySelectorAll('.reference-family__batch-actions button').length };
  });
  console.log(JSON.stringify({ card, rail, family }));
  await context.close();
}
for (const width of [320, 375, 430, 768]) {
  const context = await browser.newContext({ viewport: { width, height: 850 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const item = { number_id: 11, number_value: '9988998877', display_number: '9988 998 877', title_label: 'VIP Number', badge: 'PREMIUM', mrp: 4999999, offer_price: 3499999, rtp_status: 'NON_RTP', rtp_available_at: '2026-11-30', status: 'AVAILABLE', category_name: 'Mirror', category_slug: 'customer-care-numbers' };
  await page.route('**/vipnumberworld/numbers/list', route => route.fulfill({ json: { status: 1, data: { items: [item], total: 1 } } }));
  await page.route('**/vipnumberworld/site/family-packs', route => route.fulfill({ json: { status: 1, data: [{ pack_id: 'compact', title: 'Mirror Duo', pack_type: 'MIXED', size: 2, total_price: 6999998, is_available: true, numbers: [item, { ...item, number_id: 12 }] }] } }));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('.home-number-shelf .reference-card').first().waitFor();
  await page.locator('.home-family-shelf .reference-family').first().waitFor();
  const bounds = await page.evaluate(() => {
    const fit = selector => { const el = document.querySelector(selector); return { width: Math.round(el.getBoundingClientRect().width), clipped: el.scrollWidth > el.clientWidth + 1 }; };
    return { pageOverflow: document.documentElement.scrollWidth > innerWidth, card: fit('.home-number-shelf .reference-card'), digits: fit('.home-number-shelf .reference-card__digits'), price: fit('.home-number-shelf .reference-card__price'), family: fit('.home-family-shelf .reference-family') };
  });
  console.log(JSON.stringify({ width, ...bounds }));
  await context.close();
}
await browser.close();
