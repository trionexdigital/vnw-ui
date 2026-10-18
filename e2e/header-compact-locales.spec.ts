import { expect, test, type Page } from '@playwright/test';

const names: Record<string,string> = { en:'English', hi:'हिंदी', mr:'मराठी', hg:'Hinglish', gu:'ગુજરાતી', bn:'বাংলা', pa:'ਪੰਜਾਬੀ', ta:'தமிழ்', te:'తెలుగు', kn:'ಕನ್ನಡ', ml:'മലയാളം', or:'ଓଡ଼ିଆ' };
const widths = [320, 375, 768, 1200, 1366, 1920];
async function mock(page: Page, deals = false) {
  // Keep these layout checks offline; Inter is served by the application itself.
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
  await page.route('**/vipnumberworld/**', async route => {
    const url = route.request().url();
    let data: unknown = [];
    if (url.endsWith('/site/languages/catalog')) data = { language: route.request().postDataJSON()?.language, translations: {} };
    else if (url.endsWith('/site/settings')) data = {};
    else if (url.endsWith('/site/deals-of-day')) data = { source:'CURATED', items: deals ? [{ deal_id:1, number_id:1, number_value:'9876543210', display_number:'9876543210', title_label:'Mirror', hero_label:'Mirror', mrp:49999, offer_price:39999, stock:1, status:'AVAILABLE', primary_category:{name:'Mirror',slug:'customer-care-numbers'} }] : [] };
    else if (/\/numbers\/(list|featured)$/.test(url)) data = { items:[], total:0 };
    else if (url.endsWith('/site/hero-stats')) data = { delivered_numbers:0, available_numbers:0, customers_served:0 };
    await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({status:1,info:'OK',data}) });
  });
}

async function checkHeaderState(page: Page, width: number, scrolled: boolean) {
  await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.body).overflow)).not.toBe('hidden');
  // Route updates schedule scroll restoration on the following animation frame.
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  await page.evaluate(y=>new Promise<void>(resolve=>{
    window.scrollTo({top:y,behavior:'instant'});
    requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()));
  }),scrolled?120:0);
  const header=page.locator('.store-header'), panel=header.locator('.store-header__panel');
  await expect(header).toHaveAttribute('data-scrolled',String(scrolled));
  const floating=scrolled, gutter=floating?(width>=1024?16:12):0;
  const box=(await panel.boundingBox())!;
  expect(box.height).toBe(scrolled?64:65);
  expect(box.y).toBe(floating?12:0);
  expect((await header.boundingBox())!.height).toBe(box.height+(floating?12:0));
  expect(box.width).toBe(Math.min(width-gutter*2,scrolled?1880:width));
  expect(box.x).toBe((width-box.width)/2);
  const style=await panel.evaluate(el=>{const css=getComputedStyle(el);return {radius:css.borderTopLeftRadius,shadow:css.boxShadow,blur:css.backdropFilter,overflow:css.overflow};});
  expect(style.radius).toBe(floating?'24px':'0px');
  expect(style.overflow).toBe('visible');
  if(scrolled) { expect(style.shadow).not.toBe('none'); expect(style.blur).toBe('blur(12px)'); }
  else expect(style.shadow).toBe('none');
  expect(await panel.evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(1);
  const clipped=await panel.locator('.store-header__button,.public-language-button,.store-header__nav > a,.store-header__more').evaluateAll(nodes=>nodes.filter(node=>{const el=node as HTMLElement;return el.offsetWidth>0&&(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1);}).map(node=>node.className));
  expect(clipped).toEqual([]);
  if(width>=1200) {
    const slots=await panel.locator(':scope > .store-header__brand,:scope > .store-header__nav,:scope > .store-header__search,:scope > .store-header__actions').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return {left:b.left,right:b.right};}));
    for(let i=1;i<slots.length;i++)expect(slots[i-1].right).toBeLessThanOrEqual(slots[i].left);
  }
  await expect(panel.locator('.public-header__butterflies')).toHaveCount(1);
  if(width>=768) await expect(panel.locator('.public-header__butterflies')).toBeVisible();
  else await expect(panel.locator('.public-header__butterflies')).toBeHidden();
}

for (const signedIn of [false, true]) test(`${signedIn ? 'customer' : 'guest'} header and right mobile drawer fit all 12 languages at six widths`, async ({page}, info) => {
  test.setTimeout(240000);
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await mock(page);
  if(signedIn) await page.addInitScript(()=>{localStorage.setItem('token','layout-test-token');localStorage.setItem('user',JSON.stringify({id:1,name:'Layout Customer',email:'layout@example.test',role:'CUSTOMER'}));});
  await page.emulateMedia({reducedMotion:'reduce'}); await page.goto('/');
  await expect(page.locator('.deal-showcase__empty')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  const header=page.locator('.store-header__panel'); await expect(header).toBeVisible();
  const original=await header.elementHandle(), butterflies=await header.locator('.header-hero-butterfly').elementHandles(), baseline=new Map<number,number>();
  const search=header.locator('.header-number-search__form input');
  for(const code of Object.keys(names)) {
    await page.setViewportSize({width:1366,height:900});
    await search.fill('9876'); await search.press('Escape');
    await header.locator('.public-language-button').click();
    await page.getByRole('dialog').getByRole('button',{name:new RegExp(names[code])}).click();
    await expect(page.locator('html')).toHaveAttribute('lang',code==='hg'?'hi-Latn':code);
    await expect(search).toHaveValue('9876');
    await search.fill(''); await search.press('Escape');
    await expect(header.locator('.numeric-butterfly__wing')).toHaveText(['93','39','78','87','7','7']);
    for(const width of widths) {
      await page.setViewportSize({width,height:900});
      await checkHeaderState(page,width,true);
      await checkHeaderState(page,width,false);
      const box=await header.boundingBox(); if(code==='en')baseline.set(width,box!.height);
      expect(box!.height,`${code} compact header ${width}`).toBe(65);
      expect(box!.height,`${code} header height ${width}`).toBe(baseline.get(width));
      expect(await header.evaluate(el=>el.scrollWidth-el.clientWidth),`${code} header overflow ${width}`).toBeLessThanOrEqual(1);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),`${code} page overflow ${width}`).toBeLessThanOrEqual(1);
      expect(await header.locator('.store-header__icon,.public-language-button').evaluateAll(nodes=>nodes.filter(node=>(node as HTMLElement).offsetWidth>0).map(node=>(node as HTMLElement).innerText.trim())),`${code} icon labels ${width}`).toEqual(width>=1200&&!signedIn?['','']:['','','']);
      const clipped=await header.locator('.store-header__button,.public-language-button,.store-header__nav > a,.store-header__more').evaluateAll(nodes=>nodes.filter(node=>{const el=node as HTMLElement;return el.offsetWidth>0&&(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1);}).map(node=>node.className));
      expect(clipped,`${code} clipped controls ${width}`).toEqual([]);
      if(width>=1200) {
        expect((await header.locator('.header-number-search__form input').boundingBox())!.width,`${code} search input width ${width}`).toBeGreaterThanOrEqual(150);
        await expect(header.locator('[data-primary-navigation] > a')).toHaveCount(4);
        await expect(header.locator('[data-primary-navigation] > a > svg')).toHaveCount(4);
        for(const control of await header.locator('[data-primary-navigation] > a').all()) {
          const icon=(await control.locator(':scope > svg').first().boundingBox())!;
          const label=(await control.locator(':scope > span').boundingBox())!;
          expect(icon.x+icon.width).toBeLessThanOrEqual(label.x);
          expect(await control.evaluate(el=>getComputedStyle(el).justifyContent)).toBe('flex-start');
          expect(await control.evaluate(el=>getComputedStyle(el).textAlign)).toBe('left');
        }
        await expect(header.locator('.store-header__menu')).toBeHidden();
        await expect(page.locator('.public-header__drawer')).toHaveCount(0);
        await header.locator('[data-store-more]').click();
        await expect(page.getByRole('menuitem')).toHaveCount(2);
        expect(await page.locator('.store-header__submenu a').evaluateAll(links=>links.map(link=>link.getAttribute('href')))).toEqual(['/how-it-works','/about']);
        await page.keyboard.press('Escape');
        if(!signedIn) {
          const auth=header.locator('.store-header__auth'), language=header.locator('.store-header__language');
          const authBox=await auth.boundingBox(), languageBox=await language.boundingBox();
          expect(authBox!.x+authBox!.width).toBeLessThanOrEqual(languageBox!.x);
          for(const link of await auth.locator('a').all()) {
            const icon=await link.locator('svg').boundingBox(), label=await link.locator('span').boundingBox();
            expect(icon!.x+icon!.width).toBeLessThanOrEqual(label!.x);
            expect(await link.evaluate(el=>getComputedStyle(el).flexDirection)).toBe('row');
          }
        }
      } else {
        await expect(header.locator('.store-header__auth')).toBeHidden();
        await expect(header.locator('[data-store-more]')).toBeHidden();
        await expect(header.locator('.store-header__menu')).toBeVisible();
        expect(await header.locator('.store-header__actions').evaluate(el=>el.lastElementChild?.classList.contains('store-header__menu'))).toBe(true);
      }
      if(['en','hi','ml'].includes(code)&&[375,1366].includes(width))await page.screenshot({path:info.outputPath(`${signedIn?'customer':'guest'}-${code}-${width}.png`)});
    }
    await page.setViewportSize({width:320,height:500}); await header.locator('.store-header__menu').click();
    const drawer=page.locator('.public-header__drawer'); await expect(drawer).toBeVisible();
    const drawerBox=await drawer.boundingBox(); expect(drawerBox!.x).toBeGreaterThan(0); expect(Math.abs(drawerBox!.x+drawerBox!.width-320)).toBeLessThanOrEqual(1);
    await expect(drawer.locator('.store-drawer__header img').first()).toBeVisible();
    await expect(drawer.locator('.store-drawer__header a[href="/login"]')).toHaveCount(0);
    const drawerHeader=drawer.locator('.store-drawer__header'), footer=drawer.locator('.store-drawer__footer');
    const fixedHeader=(await drawerHeader.boundingBox())!, fixedFooter=(await footer.boundingBox())!;
    const brandBox=(await drawerHeader.locator('.store-drawer__brand').boundingBox())!, languageBox=(await drawerHeader.locator('.public-language-button').boundingBox())!;
    expect(brandBox.x+brandBox.width).toBeLessThanOrEqual(languageBox.x);
    expect(fixedFooter.y+fixedFooter.height).toBeCloseTo(drawerBox!.y+drawerBox!.height,0);
    expect(await drawer.evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(1);
    if(!signedIn) {
      const auth=drawer.locator('.store-drawer__auth');
      await expect(drawer.locator('.store-drawer__scroll a[href="/login"]')).toHaveCount(0);
      const actions=await auth.locator('a').all();
      expect((await actions[0].boundingBox())!.y).toBe((await actions[1].boundingBox())!.y);
      for(const link of await auth.locator('a').all()) {
        const icon=await link.locator('svg').boundingBox(), text=await link.locator('span').boundingBox();
        expect(icon!.x+icon!.width).toBeLessThanOrEqual(text!.x);
        expect(await link.evaluate(el=>el.scrollHeight-el.clientHeight)).toBeLessThanOrEqual(1);
      }
    }
    if(['en','hi','ml'].includes(code))await drawer.screenshot({path:info.outputPath(`${signedIn?'customer':'guest'}-${code}-drawer.png`)});
    await drawer.locator('.store-drawer__scroll').evaluate(el=>{el.scrollTop=el.scrollHeight;});
    expect((await drawerHeader.boundingBox())!.y).toBe(fixedHeader.y);
    expect((await footer.boundingBox())!.y).toBe(fixedFooter.y);
    expect(await drawer.locator('.store-drawer__scroll').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
    if(signedIn)await expect(drawer.getByText('Layout Customer',{exact:true})).toBeVisible();
    await drawer.locator('[data-store-drawer-close]').click();
    await expect(header.locator('.store-header__menu')).toBeFocused();
    await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.body).overflow)).not.toBe('hidden');
  }
  expect(await original!.evaluate(node=>node.isConnected)).toBe(true);
  for(const butterfly of butterflies)expect(await butterfly.evaluate(node=>node.isConnected)).toBe(true);
  expect(errors).toEqual([]);
});

test('original scroll threshold, responsive panel, and content offset remain stable',async({page},info)=>{
  await mock(page);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  for(const width of [320,375,639,640,767,768,1023,1024,1199,1200,1366,1920,2560]) {
    await page.setViewportSize({width,height:900});await checkHeaderState(page,width,false);
    const offset=page.locator('.store-header-offset');
    const before=await offset.evaluate(el=>el.getBoundingClientRect().bottom+scrollY);
    await page.evaluate(()=>window.scrollTo({top:16,behavior:'instant'}));
    await expect(page.locator('.store-header')).toHaveAttribute('data-scrolled','false');
    await page.evaluate(()=>window.scrollTo({top:17,behavior:'instant'}));
    await expect(page.locator('.store-header')).toHaveAttribute('data-scrolled','true');
    await checkHeaderState(page,width,true);
    expect(await offset.evaluate(el=>el.getBoundingClientRect().bottom+scrollY)).toBe(before);
    if([375,768,1200,1366,1920].includes(width))await page.screenshot({path:info.outputPath(`header-scrolled-${width}.png`),clip:{x:0,y:0,width,height:100}});
    await checkHeaderState(page,width,false);
    expect(await offset.evaluate(el=>el.getBoundingClientRect().bottom+scrollY)).toBe(before);
    if([375,768,1200,1366,1920].includes(width))await page.screenshot({path:info.outputPath(`header-top-${width}.png`),clip:{x:0,y:0,width,height:100}});
  }
  await page.setViewportSize({width:1366,height:900});
  await page.locator('[data-store-more]').click();await page.getByRole('menuitem',{name:'Contact',exact:true}).click();
  await expect(page).toHaveURL(/\/about/);await checkHeaderState(page,1366,false);await checkHeaderState(page,1366,true);
  await page.locator('.store-header__brand').click();await expect(page).toHaveURL(/\/$/);await checkHeaderState(page,1366,false);
});

test('header butterflies animate behind controls and respect reduced motion',async({page})=>{
  await mock(page);await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1366,height:900});await page.goto('/');
  const panel=page.locator('.store-header__panel'), butterfly=panel.locator('.header-hero-butterfly').first(), wing=butterfly.locator('.numeric-butterfly__wing').first();
  await expect(panel.locator('.public-header__butterflies')).toHaveAttribute('translate','no');
  expect(await panel.locator('.public-header__butterflies').evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');
  expect(await panel.evaluate(el=>getComputedStyle(el).transitionDuration)).toContain('0.26s');
  const transform=await butterfly.evaluate(el=>getComputedStyle(el).transform);
  await expect.poll(()=>butterfly.evaluate(el=>getComputedStyle(el).transform)).not.toBe(transform);
  await panel.hover();expect(await wing.evaluate(el=>getComputedStyle(el).animationPlayState)).toBe('running');
  await page.locator('[data-store-more]').click();await expect(page.getByRole('menuitem',{name:'Contact',exact:true})).toBeVisible();await page.keyboard.press('Escape');
  await page.setViewportSize({width:375,height:812});
  await page.evaluate(()=>window.scrollTo({top:120,behavior:'instant'}));
  await expect(panel).toHaveCSS('border-top-left-radius','24px');
  await expect(page.locator('.store-header')).toHaveCSS('padding-top','12px');
  await expect(panel.locator('.store-header__menu')).toBeVisible();
  await expect(panel.locator('.store-header__auth')).toBeHidden();
  expect(await panel.evaluate(el=>getComputedStyle(el).transitionDuration)).toContain('0.26s');
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect(panel).toHaveCSS('border-top-left-radius','0px');
  await expect(page.locator('.store-header')).toHaveCSS('padding-top','0px');
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await butterfly.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  expect(await wing.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  expect(await panel.evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
});

test('comparison badge stays visible and literal through header scrolling and language changes',async({page})=>{
  await mock(page);await page.addInitScript(()=>localStorage.setItem('vnw_compare','[1,2]'));
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1366,height:900});await page.goto('/');
  const header=page.locator('.store-header__panel'), compare=header.locator('a[href="/compare"]');
  for(const code of ['hi','ml','en']) {
    await header.locator('.public-language-button').click();
    await page.getByRole('dialog').getByRole('button',{name:new RegExp(names[code])}).click();
    await expect(page.locator('html')).toHaveAttribute('lang',code);
    for(const width of [375,1366]) {
      await page.setViewportSize({width,height:900});
      for(const scrolled of [false,true]) {
        await checkHeaderState(page,width,scrolled);
        await expect(compare.locator('.store-header__count')).toHaveText('2');
        await expect(compare.locator('.store-header__count')).toBeVisible();
      }
    }
  }
  await compare.click();await expect(page).toHaveURL(/\/compare/);
});

test('desktop More contains just two direct text links and account controls retain their destinations',async({page})=>{
  await mock(page);await page.setViewportSize({width:1366,height:900});await page.goto('/');
  const primary=page.locator('[data-primary-navigation]');await expect(primary.locator(':scope > a')).toHaveText(['Home','Family Pack','Corporate Pack','Numerology']);
  await expect(page.locator('[data-store-more] > svg')).toHaveCount(1);
  await expect(page.locator('[data-store-more] > .store-header__chevron')).toBeVisible();
  await page.locator('[data-store-more]').click();await expect(page.getByRole('menuitem')).toHaveCount(2);
  await page.getByRole('menuitem',{name:'Contact',exact:true}).click();await expect(page).toHaveURL(/\/about/);
  await expect(page.getByRole('menu')).toHaveCount(0);await expect(page.locator('.store-header__menu')).toBeHidden();
  await page.addInitScript(()=>{localStorage.setItem('token','test-token');localStorage.setItem('user',JSON.stringify({id:1,name:'Customer',email:'customer@example.test',role:'CUSTOMER'}));});
  await page.goto('/');await page.locator('[data-store-account]').click();
  await expect(page.locator('.store-header__submenu a[href="/orders"]')).toBeVisible();
  await expect(page.locator('.store-header__submenu a[href="/cart"]')).toBeVisible();
  await expect(page.locator('.store-header__submenu a[href="/wishlist"]')).toBeVisible();
});

test('right drawer supports language changes, repeated cycles, and releases its lock when resized to desktop',async({page})=>{
  await mock(page);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:375,height:900});await page.goto('/');
  for(let cycle=0;cycle<3;cycle++) {
    await page.locator('.store-header__menu').click();const drawer=page.locator('.public-header__drawer');await expect(drawer).toBeVisible();
    if(cycle===0) {
      await drawer.locator('.public-language-button').click();await page.getByRole('dialog').last().getByRole('button',{name:/हिंदी/}).click();
      await expect(page.locator('html')).toHaveAttribute('lang','hi');await expect(drawer).toBeVisible();
    }
    if(cycle===2) {
      await page.setViewportSize({width:1366,height:900});await expect(drawer).toHaveCount(0);await expect(page.locator('.store-header__menu')).toBeHidden();
    } else await drawer.locator('[data-store-drawer-close]').click();
    await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.body).overflow)).not.toBe('hidden');
  }
});
test('compact hero preserves all artwork and Lucky Pick content in populated and empty states',async({page},info)=>{
  await mock(page,true); await page.emulateMedia({reducedMotion:'reduce'}); await page.goto('/');
  for(const width of widths) {
    await page.setViewportSize({width,height:900});
    await expect(page.locator('.brand-stage__number-plaque')).toHaveCount(8);
    await expect(page.locator('.brand-stage__slogan')).toBeVisible();
    await expect(page.locator('.deal-card-motion[data-position="active"] a[href="/number/1"]')).toHaveText('9876543210');
    await expect(page.locator('.deal-hero-card__purchase')).toBeVisible();
    const art=await page.locator('.home-hero__art').boundingBox();
    const slogan=await page.locator('.brand-stage__slogan').boundingBox();
    expect(slogan!.y).toBeGreaterThanOrEqual(art!.y + art!.height);
    expect(art!.width).toBeLessThanOrEqual(width>=1024?529:421);
    if(width>=1024) expect((await page.locator('.home-hero').boundingBox())!.height).toBeLessThan(650);
    if(width===1366) await page.screenshot({path:info.outputPath('compact-populated-hero.png')});
  }
});
