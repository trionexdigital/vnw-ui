import { expect, test } from '@playwright/test';

const numbers = Array.from({ length: 14 }, (_, index) => ({
  number_id: index + 1,
  number_value: `998899${String(index).padStart(4, '0')}`,
  display_number: `9988 99${String(index).padStart(4, '0')}`,
  title_label: 'VIP Number',
  badge: index === 0 ? 'PREMIUM' : 'NONE',
  mrp: 50000 + index * 100,
  offer_price: 45000 + index * 100,
  discount_pct: 10,
  stock: 1,
  status: 'AVAILABLE',
  rtp_status: 'RTP',
  categories: [{ id: 16, slug: 'customer-care-numbers', name: 'Mirror', match_spans: [] }],
  primary_category: { id: 16, slug: 'customer-care-numbers', name: 'Mirror', match_spans: [] },
}));

async function mockHomepage(page: import('@playwright/test').Page) {
  const requests: any[] = [];
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
  await page.route('http://localhost:3002/vipnumberworld/**', async (route) => {
    const url = route.request().url();
    const payload = route.request().postDataJSON?.() || {};
    if (url.endsWith('/numbers/list')) requests.push(payload);
    const data = url.endsWith('/numbers/list')
      ? { items: numbers.slice((Number(payload.page || 1) - 1) * Number(payload.limit || 7), Number(payload.page || 1) * Number(payload.limit || 7)), total: numbers.length, pages: 2 }
      : url.endsWith('/categories/list')
        ? [{ id: 16, slug: 'customer-care-numbers', name: 'Mirror', number_count: 14, subcategories: [] }]
        : url.endsWith('/site/family-packs')
          ? Array.from({length:7},(_,index)=>({ pack_id: `pack-${index+1}`, title: 'Matching Pair', pack_type: 'MIXED', size: 2, total_price: 90000, is_available: true, is_active: true, sort_order: index, numbers: [numbers[0], numbers[1]] }))
          : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, info: 'OK', data }) });
  });
  return requests;
}

test('homepage rails load seven more cards and animate digits on hover', async ({ page }, testInfo) => {
  const requests = await mockHomepage(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Every pattern has a personality.' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('home-discovery-top.png') });
  const gallery = page.locator('.home-pattern-gallery');
  await gallery.scrollIntoViewIfNeeded();
  await expect.poll(() => gallery.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
  await gallery.screenshot({ path: testInfo.outputPath('home-pattern-gallery.png') });
  const premium = page.locator('#home-premium');
  await expect(page.locator('#zero')).toHaveCSS('background-color', 'rgb(251, 247, 239)');
  await expect(page.locator('.home-discovery-heading p:not(.home-discovery-eyebrow)')).toHaveCount(0);
  await expect(premium.getByTestId('number-card')).toHaveCount(7);
  await expect(premium.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/premium-numbers');
  await premium.getByRole('button', { name: /Show 7 more/ }).click();
  await expect(premium.getByTestId('number-card')).toHaveCount(14);
  expect(requests.some((request) => request.is_premium === 1 && request.page === 2 && request.limit === 7)).toBe(true);
  const first = premium.getByTestId('number-card').first();
  await expect(first).toHaveClass(/reference-card--compact/);
  const digitSpacing = await first.locator('.reference-card__digits').evaluate((element) => parseFloat(getComputedStyle(element).letterSpacing));
  expect(digitSpacing).toBeGreaterThan(0);
  await premium.screenshot({ path: testInfo.outputPath('home-premium-desktop.png') });
  const familyShelf = page.locator('.home-family-shelf');
  await familyShelf.scrollIntoViewIfNeeded();
  const center = await familyShelf.locator('.home-rail__filters').boundingBox();
  expect(center).not.toBeNull();
  expect(Math.abs(center!.x + center!.width / 2 - 640)).toBeLessThan(160);
  await familyShelf.screenshot({ path: testInfo.outputPath('home-family-desktop.png') });
  await first.getByRole('button', { name: /View VIP number/ }).hover();
  await expect.poll(() => first.locator('.reference-card__digit').first().evaluate((digit) => getComputedStyle(digit).transform)).not.toBe('none');
});

test('number and family rails keep equal page gutters and complete cards when paging in every language',async({page},info)=>{
  test.setTimeout(240000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await mockHomepage(page);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  const locales=['English','हिंदी','मराठी','Hinglish','ગુજરાતી','বাংলা','ਪੰਜਾਬੀ','தமிழ்','తెలుగు','ಕನ್ನಡ','മലയാളം','ଓଡ଼ିଆ'];
  for(const locale of locales) {
    await page.locator('.store-header .public-language-button').click();
    await page.getByRole('dialog').getByRole('button',{name:new RegExp(locale)}).click();
    await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.body).overflow)).not.toBe('hidden');
    for(const width of [320,375,768,1366,1920]) {
      await page.setViewportSize({width,height:900});
      const gutter=width>=1024?24:width>=640?20:12;
      for(const selector of ['#home-premium','.home-family-shelf']) {
        const shelf=page.locator(selector), track=shelf.locator('.home-rail__track:not(.home-rail__track--loading)');
        await expect(track).toBeVisible();
        await track.evaluate(el=>el.scrollTo({left:0,behavior:'instant'}));
        const assertEdges=async()=>{
          const geometry=await track.evaluate(el=>{
            const box=el.getBoundingClientRect();
            const visible=Array.from(el.children).map(child=>child.getBoundingClientRect()).filter(child=>child.right>box.left+1&&child.left<box.right-1);
            return {left:box.left,right:box.right,visible:visible.map(child=>({left:child.left,right:child.right}))};
          });
          expect(geometry.left,`${locale} ${selector} left gutter at ${width}`).toBeCloseTo(gutter,0);
          expect(width-geometry.right,`${locale} ${selector} right gutter at ${width}`).toBeCloseTo(gutter,0);
          const actions=(await shelf.locator('.home-rail__actions').boundingBox())!;
          expect(actions.x+actions.width,`${locale} ${selector} controls at ${width}`).toBeCloseTo(geometry.right,0);
          expect(geometry.visible[0].left).toBeCloseTo(geometry.left,0);
          expect(geometry.visible.at(-1)!.right).toBeCloseTo(geometry.right,0);
          for(const card of geometry.visible) { expect(card.left).toBeGreaterThanOrEqual(geometry.left-1); expect(card.right).toBeLessThanOrEqual(geometry.right+1); }
        };
        await assertEdges();
        const buttons=shelf.locator('.home-rail__actions > button[aria-controls]');
        await buttons.nth(1).click();await assertEdges();
        if(locale==='English'&&[375,1366].includes(width))await shelf.screenshot({path:info.outputPath(`paged-${selector==='#home-premium'?'numbers':'family'}-${width}.png`)});
        await buttons.first().click();await assertEdges();
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
    }
  }
  expect(errors).toEqual([]);
});

test('mobile discovery stays within the page while its rails scroll horizontally', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockHomepage(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#home-premium').getByTestId('number-card')).toHaveCount(7);
  const familyCard = page.getByTestId('family-pack-card').first();
  const familyShelf = page.locator('.home-family-shelf');
  const familyFilterButton = familyShelf.getByRole('combobox', { name: 'Choose Family packs selection' });
  const packSize = familyShelf.getByRole('combobox', { name: 'Pack of' });
  await expect(familyFilterButton).toBeVisible();
  await expect(packSize).toBeVisible();
  const packSizeBounds = await packSize.boundingBox();
  const packArrowLayout = await packSize.evaluate((element) => {
    const value = element.querySelector('span')!.getBoundingClientRect();
    const arrow = element.querySelector('svg')!.getBoundingClientRect();
    return { valueRight: value.right, arrowLeft: arrow.left, valueCenter: value.y + value.height / 2, arrowCenter: arrow.y + arrow.height / 2 };
  });
  expect(packArrowLayout.arrowLeft).toBeGreaterThan(packArrowLayout.valueRight);
  expect(Math.abs(packArrowLayout.arrowCenter - packArrowLayout.valueCenter)).toBeLessThanOrEqual(2);
  const leftArrowBounds = await familyShelf.getByRole('button', { name: 'Scroll Family and business packs left' }).boundingBox();
  expect(packSizeBounds!.x + packSizeBounds!.width).toBeLessThanOrEqual(leftArrowBounds!.x);
  const viewAll = await familyShelf.getByRole('link', { name: 'View all packs' }).boundingBox();
  const filterButton = await familyFilterButton.boundingBox();
  expect(filterButton!.x).toBeGreaterThan(viewAll!.x + viewAll!.width);
  await familyFilterButton.click();
  await expect(page.getByRole('option', { name: 'In Series' })).toBeVisible();
  await familyShelf.screenshot({ path: testInfo.outputPath('home-family-filters-mobile.png') });
  await page.keyboard.press('Escape');
  await expect(familyCard).toHaveClass(/reference-family--compact/);
  await expect(familyCard.locator('.reference-family__badge')).toContainText('All Mixed');
  await expect(familyCard.locator('.reference-family__price')).toHaveCount(2);
  await familyCard.scrollIntoViewIfNeeded();
  await expect.poll(() => familyCard.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
  await expect.poll(() => page.locator('.home-family-shelf').evaluate((element) => getComputedStyle(element).filter)).toBe('none');
  await familyCard.screenshot({ path: testInfo.outputPath('home-family-mobile.png') });
  const sizes = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: window.innerWidth, rail: document.querySelector('#home-premium .home-rail__track')?.scrollWidth || 0, railWidth: document.querySelector('#home-premium .home-rail__track')?.clientWidth || 0 }));
  expect(sizes.page).toBeLessThanOrEqual(sizes.viewport + 1);
  expect(sizes.rail).toBeGreaterThan(sizes.railWidth);
  const rhythm = page.locator('#rhythm');
  const rhythmSelection = rhythm.getByRole('combobox', { name: 'Choose Sequences worth remembering selection' });
  await expect(rhythm.getByRole('heading', { name: 'Sequences worth remembering' })).toHaveCSS('white-space', 'nowrap');
  await rhythmSelection.click();
  await expect(page.getByRole('option', { name: 'Tripling' })).toBeVisible();
  await rhythm.screenshot({ path: testInfo.outputPath('home-number-filters-mobile.png') });
  await page.setViewportSize({ width: 320, height: 812 });
  const narrowLayout = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(narrowLayout.page).toBeLessThanOrEqual(narrowLayout.viewport + 1);
  await page.keyboard.press('Escape');
  const narrowFilter = await rhythmSelection.boundingBox();
  expect(narrowFilter!.x + narrowFilter!.width).toBeLessThanOrEqual(320);
});
