import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import imports from '../../vnw-server/dist/server/pixels/api/admin/numberImport.js';
const { readNumberRows, validateImportRow } = imports;
const tourKey = 'vnw_website_tour_seen_v1';

async function mock(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('**/vipnumberworld/**', r => r.fulfill({ json: { status: 1, data: r.request().url().endsWith('/site/languages/catalog') ? { translations: {} } : /\/numbers\/(list|featured|similar)$/.test(r.request().url()) ? { items: [], total: 0 } : [] } }));
}

test.describe('first-visit guide', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:5173', localStorage: [{ name: 'vnw_language', value: 'en' }, { name: 'vnw_location_prompt_seen', value: '1' }] }] } });
  test('all three tutorial steps fit every storefront language and viewport; finishing is remembered', async ({ page }, info) => {
    test.setTimeout(420_000); await mock(page); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    for (const lang of ['en','hi','mr','hg','gu','bn','pa','ta','te','kn','ml','or']) {
      await page.goto(`/?lang=${lang}`); const tour = page.locator('.first-visit-tour'); await expect(tour).toBeVisible();
      const messages = lang === 'en' ? {} : JSON.parse(readFileSync(new URL(`../src/shared/language/${lang}.json`, import.meta.url), 'utf8'));
      for (let step = 0; step < 3; step++) {
        await expect(tour.locator('[data-tour-step]')).toHaveAttribute('data-tour-step', String(step));
        const source = ['Start with a search','Find a pattern you love','Choose how to get your number'][step];
        await expect(tour.locator('.first-visit-tour__copy h2')).toHaveText(messages[source] || source);
        for (const width of [320,375,768,1366,1920]) {
          await page.setViewportSize({ width, height: 900 });
          const bounds = (await tour.boundingBox())!; expect(bounds.x).toBeGreaterThanOrEqual(10); expect(bounds.x + bounds.width).toBeLessThanOrEqual(width - 10);
          expect(await tour.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
          await tour.locator('[data-tour-next]').scrollIntoViewIfNeeded(); await expect(tour.locator('[data-tour-next]')).toBeInViewport();
          if (lang === 'en' && [375,1366].includes(width)) await tour.screenshot({ path: info.outputPath(`tour-${step}-${width}.png`) });
        }
        if (step < 2) await tour.locator('[data-tour-next]').click();
      }
      await tour.locator('[data-tour-back]').click(); await expect(tour.locator('[data-tour-step]')).toHaveAttribute('data-tour-step','1');
      await page.locator('.first-visit-tour > div:first-child > button').click();
      expect(await page.evaluate(key => localStorage.getItem(key), tourKey)).toBe('1');
      await page.reload(); await expect(tour).toHaveCount(0);
      // A new browser preference state models a different first-time visitor for the next locale.
      await page.evaluate(key => localStorage.removeItem(key), tourKey);
    }
    await page.reload(); const tour = page.locator('.first-visit-tour'); await expect(tour).toBeVisible();
    await tour.locator('[data-tour-next]').click(); await tour.locator('[data-tour-next]').click(); await tour.locator('[data-tour-next]').click();
    await expect(page).toHaveURL(/\/shop\?focus=search/); await expect(tour).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('language and location dialogs finish before the tour; Escape/skip persist without repeated popups', async ({ page }) => {
    await mock(page); await page.addInitScript(() => { localStorage.removeItem('vnw_language'); localStorage.removeItem('vnw_location_prompt_seen'); });
    await page.goto('/'); await expect(page.getByRole('dialog')).toHaveCount(1); await expect(page.locator('.first-visit-tour')).toHaveCount(0);
    await page.getByRole('button', { name: /English/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(1); await expect(page.getByRole('dialog').getByText('Choose your location', { exact: true })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Skip', exact: true }).click();
    await expect(page.locator('.first-visit-tour')).toBeVisible(); await page.keyboard.press('Escape');
    expect(await page.evaluate(key => localStorage.getItem(key), tourKey)).toBe('1');
    await expect(page.locator('.first-visit-tour')).toHaveCount(0);
  });
});

test('manual inventory entry uses the same required/optional rules as imports and filters/exports RTP status', async ({ page }, info) => {
  await mock(page); await page.addInitScript(() => { localStorage.setItem('token','admin-test'); localStorage.setItem('user',JSON.stringify({user_id:1,role:'ADMIN',full_name:'Administrator',permissions:['*']})); });
  let items: any[] = []; let analysis: any[] = []; const writes: any[] = []; let listed: any; let exported: any;
  await page.route('**/admin/numbers/list', async r => { listed = r.request().postDataJSON(); await r.fulfill({json:{status:1,data:{items:items.filter(n=>!listed.rtp_status||n.rtp_status===listed.rtp_status),total:items.length}}}); });
  await page.route('**/admin/numbers/analyze', async r => { const body = r.request().postDataJSON(); writes.push(body); analysis = readNumberRows(body).map((record: any) => validateImportRow(record)); const accepted = analysis.filter(row=>!row.reasons.length); await r.fulfill({json:{status:1,data:{total:analysis.length,ready:accepted.length,rejected:analysis.length-accepted.length,rows:analysis,analysis_token:accepted.length?'v3-entry':null}}}); });
  await page.route('**/admin/numbers/import/commit', async r => { items.push(...analysis.filter(row=>!row.reasons.length).map((row,i)=>({...row.values,number_id:i+1,number_value:row.values.number,display_number:row.values.number,stock:1}))); await r.fulfill({json:{status:1,data:{imported:items.length,rejected:0,rows:analysis}}}); });
  await page.route('**/admin/numbers/export', async r => { exported = r.request().postDataJSON(); await r.fulfill({json:{status:1,data:{filename:'numbers.xlsx',mime:'application/octet-stream',content_base64:'AA=='}}}); });
  await page.setViewportSize({width:1366,height:900}); await page.goto('/admin/numbers');
  await page.getByRole('button',{name:'Add Number',exact:true}).click(); const dialog=page.getByRole('dialog');
  await expect(dialog.getByLabel('Display title')).toHaveValue(''); await expect(dialog.getByText('Stock',{exact:true})).toHaveCount(0);
  await dialog.getByLabel('Mobile numbers').fill('8008005413'); await dialog.getByLabel('Base price (₹)').fill('2500');
  await dialog.getByRole('button',{name:'Validate',exact:true}).click(); await expect(dialog.getByRole('region')).toContainText('Visibility is required'); await expect(dialog.getByRole('region')).toContainText('Readiness is required');
  await dialog.getByRole('combobox',{name:'Visibility',exact:true}).click(); await page.getByRole('option',{name:'Online · public catalog',exact:true}).click();
  await dialog.getByRole('combobox',{name:'Porting / activation readiness',exact:true}).click(); await page.getByRole('option',{name:'RTA · ready to activate',exact:true}).click();
  await dialog.getByRole('button',{name:'Validate',exact:true}).click(); await expect(dialog.getByRole('region')).toContainText('RTA numbers require');
  await dialog.getByLabel('Serviceable PIN codes').fill('400001'); await dialog.getByLabel('Additional discount (%)').fill('10');
  await dialog.getByRole('button',{name:'Validate',exact:true}).click(); await expect(dialog.getByText('₹2,671.88',{exact:true})).toBeVisible();
  await dialog.screenshot({path:info.outputPath('entry-optional-fields.png')}); await dialog.getByRole('button',{name:'Add 1 accepted',exact:true}).click(); await expect(dialog).toHaveCount(0);
  expect(items[0]).toMatchObject({title_label:'',badge:'NONE',status:'AVAILABLE',offer_price:'2671.88',discount_pct:'14.50'}); expect(writes.at(-1).stock).toBeUndefined();
  for (const [option,value] of [['RTP','RTP'],['NON-RTP','NON_RTP'],['RTA','RTA']]) {
    await page.getByRole('combobox',{name:'Filter RTP status',exact:true}).click(); await page.getByRole('option',{name:option,exact:true}).click();
    await expect.poll(()=>listed?.rtp_status).toBe(value); await page.getByRole('button',{name:'Export',exact:true}).click(); await expect.poll(()=>exported?.rtp_status).toBe(value);
  }
  await page.setViewportSize({width:375,height:900}); expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(376);
});

test('the active desktop navigation border centers its icon and label after SPA navigation', async ({ page }) => {
  await mock(page);
  for (const width of [1366,1920]) {
    await page.setViewportSize({width,height:900}); await page.goto('/');
    for (let index=0; index<4; index++) {
      await page.locator('.store-header__nav > a').nth(index).click();
      const active=page.locator('.store-header__nav > a.is-active'); await expect(active).toHaveCount(1);
      const offset=await active.evaluate(el=>{ const a=el.getBoundingClientRect(); const icon=el.querySelector('svg')!.getBoundingClientRect(); const label=el.querySelector('span')!.getBoundingClientRect(); return Math.abs((icon.left+label.right)/2-(a.left+a.right)/2); });
      expect(offset).toBeLessThanOrEqual(1);
    }
  }
});
