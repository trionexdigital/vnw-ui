import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import { catalogResolver } from '../src/shared/language/localCatalog';

async function stub(page: Page) {
  await page.route('**/vipnumberworld/**', route => route.fulfill({ json: { status: 1, data: [] } }));
}

for (const [route, title, fields] of [['/login', 'Sign In', 2], ['/register', 'Create Account', 4], ['/forgot', 'Reset Password', 1]] as const) {
  test(`${title}: all languages and responsive layouts retain accessible fields and branding`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await stub(page);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const language of ['en', 'hi', 'mr', 'hg', 'gu', 'bn', 'pa', 'ta', 'te', 'kn', 'ml', 'or']) {
      await page.goto(`${route}?lang=${language}`, { waitUntil: 'domcontentloaded' });
      const translatedTitle = language === 'en' ? title : catalogResolver(JSON.parse(fs.readFileSync(`src/shared/language/${language}.json`, 'utf8')))(title);
      await expect(page.locator('#auth-title')).toHaveText(translatedTitle);
      for (const width of [320, 375, 768, 1366, 1920]) {
        const height = width === 320 ? 640 : width === 375 ? 667 : width === 1366 ? 768 : 900;
        await page.setViewportSize({ width, height });
        await expect(page.locator('#auth-title')).toBeVisible();
        const appFont = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
        await expect(page.locator('#auth-title')).toHaveCSS('font-family', appFont);
        await expect(page.locator('.auth-story__headline')).toHaveCSS('font-family', appFont);
        await expect(page.locator('.auth-form input')).toHaveCount(fields);
        await expect(page.locator('.auth-brand img').first()).toHaveAttribute('src', '/logo/logo.png');
        await expect(page.locator('.auth-brand img').last()).toHaveAttribute('src', '/logo/slogan.png');
        const button = page.locator('.auth-submit');
        await expect(page.getByRole('button', { name: 'Choose language' })).toHaveCount(0);
        await expect(page.locator('.auth-form .auth-back')).toHaveAttribute('href', '/');
        if (route === '/forgot') await expect(button).toBeDisabled();
        else await expect(button).toBeEnabled();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        // Full copy remains readable even when a short viewport needs scrolling.
        if (height >= 900 || width >= 1024 || language === 'en') await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height + 1);
        expect(await page.locator('.auth-form').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        const footer = page.locator('.auth-footer');
        await expect(footer.locator('a[href="/privacy-policy"]')).toBeVisible();
        await expect(footer.locator('a[href="/terms-and-conditions"]')).toBeVisible();
        const footerBox = await footer.boundingBox();
        expect(Math.abs(footerBox!.x + footerBox!.width / 2 - width / 2)).toBeLessThan(2);
        if (width < 1024) {
          // The footer follows overflowing content, or fills the spare viewport space.
          await expect.poll(async () => page.evaluate(() => {
            const footer = document.querySelector('.auth-footer')!.getBoundingClientRect();
            const layout = document.querySelector('.auth-layout')!.getBoundingClientRect();
            return Math.abs(layout.bottom - footer.bottom - parseFloat(getComputedStyle(document.querySelector('.auth-layout')!).paddingBottom));
          })).toBeLessThan(2);
        }
        if (width < 1024) {
          await expect(page.locator('.auth-eyebrow')).toBeVisible();
          await expect(page.locator('.auth-story__description')).toBeVisible();
          const header = await page.locator('.auth-brand-row').boundingBox();
          expect(header!.y).toBeLessThanOrEqual(18);
          await expect(page.locator('.auth-mobile-mark')).toHaveCount(0);
          const brand = await page.locator('.auth-brand').boundingBox();
          expect(Math.abs(brand!.x + brand!.width / 2 - width / 2)).toBeLessThan(2);
        }
        if (language === 'en' && [320, 1366].includes(width)) await page.screenshot({ path: testInfo.outputPath(`${route.slice(1)}-${width}.png`), fullPage: true });
      }
    }
    // Retain the selected language across SPA links without an auth language control.
    await page.goto(`${route}?lang=en`);
    await expect(page.locator('#auth-title')).toHaveText(title);
    await page.locator('.auth-form__switch a').click();
    await expect(page.locator('.auth-form')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('dark theme retains the Stitch layout and keyboard-accessible controls', async ({ page }, info) => {
  await stub(page);
  await page.addInitScript(() => localStorage.setItem('vnw_theme', 'dark'));
  for (const route of ['/login', '/register', '/forgot']) {
    for (const width of [375, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      // Exercise the application's dark class, independent of OS theme preference.
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await expect(page.locator('.auth-form')).toBeVisible();
      expect(await page.locator('.auth-screen').evaluate(el => getComputedStyle(el).getPropertyValue('--auth-background').trim())).toBe('#0b0e13');
      await page.screenshot({ path: info.outputPath(`${route.slice(1)}-dark-${width}.png`), fullPage: true });
    }
  }
});

for (const identifier of ['buyer@example.test', '+91 98765 43210']) {
  test(`login submits a single identifier (${identifier.includes('@') ? 'email' : 'mobile'}) and retains the payment return`, async ({ page }) => {
    await stub(page);
    const password = identifier.includes('@') ? 'long-password-'.repeat(20) : 'password';
    let payload: any;
    await page.route('**/auth/login', async route => {
      payload = route.request().postDataJSON();
      await route.fulfill({ headers: { token: 'test-token', 'access-control-expose-headers': 'token' }, json: { status: 1, data: { user_id: 1, full_name: 'Buyer', email: 'buyer@example.test', role: 'USER' } } });
    });
    await page.goto('/login?return_to=%2Fpayments%2Freturn%3Forder_id%3D7');
    await page.getByLabel('Mobile number or email', { exact: true }).fill(identifier);
    await page.locator('[name="password"]').fill(password);
    await page.getByRole('button', { name: 'Show password', exact: true }).click();
    await expect(page.locator('[name="password"]')).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide password', exact: true }).click();
    await page.locator('[name="password"]').press('Enter');
    await expect(page).toHaveURL(/\/payments\/return\?order_id=7/);
    expect(payload).toEqual({ identifier, password });
  });
}

for (const identifier of ['new@example.test', '9000000001']) {
  test(`signup submits only required fields and retains referrals (${identifier.includes('@') ? 'email' : 'mobile'})`, async ({ page }) => {
    await stub(page);
    let payload: any;
    await page.route('**/auth/register', async route => {
      payload = route.request().postDataJSON();
      await route.fulfill({ headers: { token: 'test-token', 'access-control-expose-headers': 'token' }, json: { status: 1, data: { user_id: 1, full_name: 'New Buyer', role: 'USER' } } });
    });
    await page.goto('/login?ref=VNWREF&lang=en');
    await page.locator('.auth-form__switch a').click();
    await expect(page).toHaveURL(/\/register\?ref=VNWREF&lang=en/);
    await page.locator('[name="full_name"]').fill('New Buyer');
    await page.locator('[name="identifier"]').fill(identifier);
    await page.locator('[name="password"]').fill('password');
    await page.locator('[name="confirm_password"]').fill('different');
    await page.locator('.auth-submit').click();
    await expect(page.getByRole('alert')).toHaveText('Passwords do not match');
    expect(payload).toBeUndefined();
    await page.locator('[name="confirm_password"]').fill('password');
    await page.getByRole('button', { name: 'Show confirm password', exact: true }).click();
    await expect(page.locator('[name="confirm_password"]')).toHaveAttribute('type', 'text');
    await page.locator('.auth-submit').click();
    await expect(page).toHaveURL(/\/dashboard/);
    expect(payload).toEqual({ full_name: 'New Buyer', identifier, password: 'password', confirm_password: 'password', ref_code: 'VNWREF' });
  });
}

test('invalid credentials remain editable and reset is a non-submitting coming-soon screen', async ({ page }) => {
  await stub(page);
  let resets = 0, logins = 0;
  await page.route('**/auth/forgot-request', async route => { resets++; await route.abort(); });
  await page.route('**/auth/login', async route => { logins++; await route.fulfill({ json: { status: -33, info: 'Login failed' } }); });
  await page.goto('/login');
  await page.locator('[name="identifier"]').fill('123');
  await page.locator('[name="password"]').fill('password');
  await page.locator('.auth-submit').click();
  await expect(page.getByRole('alert')).toHaveText('Enter a valid mobile number or email address.');
  expect(logins).toBe(0);
  await page.locator('[name="identifier"]').fill('buyer@example.test');
  await page.locator('.auth-submit').click();
  await expect(page.getByRole('alert')).toHaveText('Login failed');
  await expect(page.locator('.auth-submit')).toBeEnabled();
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page.locator('.auth-submit')).toHaveText('Coming soon');
  await expect(page.locator('.auth-submit')).toBeDisabled();
  await expect(page.locator('[name="identifier"]')).toBeDisabled();
  await page.locator('form').evaluate(el => (el as HTMLFormElement).requestSubmit());
  expect(resets).toBe(0);
});
