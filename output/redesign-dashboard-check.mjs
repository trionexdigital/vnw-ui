import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const { role, path, width } of [
  { role: 'ADMIN', path: '/admin/numbers', width: 1280 },
  { role: 'DEALER', path: '/dealer/listings', width: 375 },
  { role: 'EMPLOYEE', path: '/employee/numbers', width: 768 },
]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await context.addInitScript((userRole) => {
    localStorage.setItem('token', 'visual-check');
    localStorage.setItem('user', JSON.stringify({ id: 1, name: `${userRole} Preview`, role: userRole, email: 'preview@example.invalid' }));
  }, role);
  const page = await context.newPage();
  await page.route('**/vipnumberworld/**', route => {
    const url = route.request().url();
    const data = url.includes('private-links') ? [] : { items: [], total: 0 };
    return route.fulfill({ json: { status: 1, data } });
  });
  await page.goto(`http://127.0.0.1:5173${path}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  await page.waitForTimeout(350);
  const layout = await page.evaluate(() => ({
    heading: document.querySelector('h1')?.textContent?.trim(),
    overflow: document.documentElement.scrollWidth > innerWidth,
    headerHeight: Math.round(document.querySelector('.vip-page-header')?.getBoundingClientRect().height || 0),
  }));
  await page.screenshot({ path: `output/redesign-2026-09-28-${role.toLowerCase()}-final.png` });
  console.log(JSON.stringify({ role, width, ...layout }));
  await context.close();
}
await browser.close();
