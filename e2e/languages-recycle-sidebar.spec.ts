import { test, expect, type Page } from '@playwright/test';
test.setTimeout(180000);
const names: Record<string,string>={en:'English',hi:'हिंदी',mr:'मराठी',hg:'Hinglish',gu:'ગુજરાતી',bn:'বাংলা',pa:'ਪੰਜਾਬੀ',ta:'தமிழ்',te:'తెలుగు',kn:'ಕನ್ನಡ',ml:'മലയാളം',or:'ଓଡ଼ିଆ'};
const homes: Record<string,string>={hi:'होम',mr:'मुख्यपृष्ठ',hg:'Home',gu:'હોમ',bn:'হোম',pa:'ਹੋਮ',ta:'முகப்பு',te:'హోమ్',kn:'ಮುಖಪುಟ',ml:'ഹോം',or:'ହୋମ୍'};
const buy: Record<string,string>={hi:'अभी खरीदें',mr:'आता खरेदी करा',hg:'Abhi khareedein',gu:'હમણાં ખરીદો',bn:'এখন কিনুন',pa:'ਹੁਣ ਖਰੀਦੋ',ta:'இப்போது வாங்குங்கள்',te:'ఇప్పుడే కొనండి',kn:'ಈಗ ಖರೀದಿಸಿ',ml:'ഇപ്പോൾ വാങ്ങുക',or:'ଏବେ କିଣନ୍ତୁ'};
const samples=[1,2].map((id)=>({number_id:id,number_value:String(9876543210+id-1),display_number:String(9876543210+id-1),title_label:'VIP Number',badge:'PREMIUM',mrp:39999,offer_price:19999.50,discount_pct:50,status:'AVAILABLE',stock:1,rtp_status:'RTA',visibility_type:'ONLINE',numerology_sum:45,categories:[{slug:'mirror',name:'Mirror'}]}));
async function mock(page:Page,admin=false) {
  // Keep browser regressions independent of the optional external font stylesheet.
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
  const calls:any[]=[];let recycled:any[]=[],inventory=[...samples];
  if(admin) await page.addInitScript(()=>{localStorage.setItem('token','test-admin');localStorage.setItem('user',JSON.stringify({id:1,name:'Administrator',email:'admin@example.test',role:'ADMIN',permissions:['*']}));});
  await page.route('**/vipnumberworld/**',async route=>{
    const url=route.request().url(),p=route.request().postDataJSON()||{};calls.push({url,p});let data:any=[];
    if(url.endsWith('/site/languages/catalog'))data={language:p.language,translations:p.language==='hi'?{'New admin question':'नया प्रशासनिक प्रश्न','New admin answer':'नया प्रशासनिक उत्तर'}:{}};
    else if(url.endsWith('/site/settings')) data={};
    else if(url.endsWith('/auth/me'))data={user_id:1,full_name:'Administrator',email:'admin@example.test',role:'ADMIN'};
    else if(url.endsWith('/numbers/list') || url.endsWith('/prebooks/catalog'))data={items:inventory,total:inventory.length,page:p.page||1};
    else if(url.endsWith('/numbers/detail'))data=samples[0];
    else if(url.endsWith('/numbers/similar'))data={source:samples[0],items:samples.slice(1),total:1,page:1,limit:12};
    else if(url.endsWith('/site/faqs'))data=[{faq_id:1,question:'New admin question',answer:'New admin answer',category:'Support',sort_order:0,is_active:true}];
    else if(url.endsWith('/site/deals-of-day'))data={items:[],source:'CURATED'};
    else if(url.endsWith('/site/family-packs'))data=[{pack_id:'family',title:'All Mixed',pack_type:'MIXED',size:2,total_price:39999,is_available:true,numbers:samples}];
    else if(url.endsWith('/categories/list'))data=[{slug:'mirror',name:'Mirror',number_count:2}];
    else if(url.endsWith('/numbers/delete/validate'))data={total:4,unique_valid:3,invalid:[{input:'bad',reason:'Invalid number'}],not_found:['9000000000'],duplicates:[],already_deleted:[],blocked:[],eligible:inventory,validation_token:'test-token'};
    else if(url.endsWith('/numbers/delete')) {recycled=inventory.map(n=>({...n,deleted_at:'2026-10-12T00:00:00Z',status_before_delete:n.status,stock_before_delete:n.stock,can_permanently_delete:true}));inventory=[];data={count:recycled.length};}
    else if(url.endsWith('/numbers/recycle/list'))data={items:recycled,total:recycled.length,page:p.page||1};
    else if(url.endsWith('/numbers/recycle/restore')){inventory=recycled.filter(n=>p.number_ids.includes(n.number_id));recycled=recycled.filter(n=>!p.number_ids.includes(n.number_id));data={count:p.number_ids.length};}
    else if(url.endsWith('/numbers/recycle/permanent-delete')){recycled=recycled.filter(n=>!p.number_ids.includes(n.number_id));data={count:p.number_ids.length};}
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:1,info:'OK',data})});
  });
  return calls;
}

test('first visit offers 12 native languages, persists selection and translates lazy screens and admin content',async({page},info)=>{
  await page.addInitScript(()=>{if(!sessionStorage.getItem('first-visit-tested')){localStorage.removeItem('vnw_language');sessionStorage.setItem('first-visit-tested','1');}});const calls=await mock(page);await page.setViewportSize({width:375,height:844});await page.goto('/shop');
  const modal=page.getByRole('dialog',{name:'Choose your language'});await expect(modal).toBeVisible();
  for(const name of Object.values(names))await expect(modal.getByRole('button',{name:new RegExp(name)})).toBeVisible();
  await page.screenshot({path:info.outputPath('language-popup-mobile.png')});
  await modal.getByRole('button',{name:/हिंदी/}).click();await expect(modal).toBeHidden();await expect(page.locator('html')).toHaveAttribute('lang','hi');await expect(page.locator('.reference-card__buy').first()).toHaveText('अभी खरीदें');
  expect(await page.evaluate(()=>localStorage.getItem('vnw_language'))).toBe('hi');
  await page.locator('footer a[href="/refund-policy"]').click();await expect(page.locator('.legal-page h1')).toHaveText('रिफंड और रद्द करने की नीति');
  expect(calls.some(c=>c.url.endsWith('/site/languages/catalog')&&c.p.language==='hi')).toBe(true);
  expect(calls.filter(c=>c.url.includes('/languages/catalog')).every(c=>!('texts' in c.p))).toBe(true);
  await page.goto('/faq');await expect(page.getByText('नया प्रशासनिक प्रश्न',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Choose language',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:/English/}).click();await expect(page.getByText('New admin question',{exact:true})).toBeVisible();
});

test('all 12 language choices work across mobile and desktop, retain digits and fit cards',async({page},info)=>{
  const calls=await mock(page);await page.goto('/shop');
  for(const code of Object.keys(names).filter(c=>c!=='en')) {
    await page.getByRole('button',{name:'Choose language',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:new RegExp(names[code])}).click();await expect(page.locator('.reference-card__buy').first()).toHaveText(buy[code]);
    for(const width of [320,375,1440,1920]) {
      await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth),`${code} page at ${width}`).toBeLessThanOrEqual(1);
      expect(await page.locator('.public-header__panel').evaluate(e=>e.scrollWidth-e.clientWidth),`${code} header at ${width}`).toBeLessThanOrEqual(1);
      const card=page.getByTestId('number-card').first();await expect(card.locator('.reference-card__number-link')).toHaveText('9876543210');
      expect(await card.evaluate(e=>Array.from(e.querySelectorAll<HTMLElement>('button,span,div')).filter(c=>c.clientWidth>0&&c.scrollWidth>c.clientWidth+2&&!c.classList.contains('reference-card__digits')).map(c=>c.className)),`${code} card at ${width}`).toEqual([]);
    }
  }
  expect(new Set(calls.filter(c=>c.url.endsWith('/site/languages/catalog')).map(c=>c.p.language)).size).toBe(11);
  expect(calls.some(c=>c.url.endsWith('/site/translate'))).toBe(false);
  await page.setViewportSize({width:375,height:844});await page.screenshot({path:info.outputPath('translated-shop-mobile.png'),fullPage:true});
});

test('translated SPA navigation, drawer cycles and catalog authorization stay error-free',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
  const headers:string[]=[];
  page.on('request',request=>{if(request.url().endsWith('/site/languages/catalog'))headers.push(request.headers()['authorization']||'');});
  await mock(page);await page.goto('/?lang=mr');
  await expect(page.locator('html')).toHaveAttribute('lang','mr');
  await page.setViewportSize({width:1366,height:900});
  const header=page.locator('.public-header__panel');
  const initial=await header.boundingBox();
  await expect(page.locator('[data-primary-navigation]')).toBeVisible();
  for(const locale of ['hi','ml','ta','mr','en','mr']){
    await page.getByRole('button',{name:'Choose language',exact:true}).first().click();
    await page.getByRole('dialog').getByRole('button',{name:new RegExp(names[locale])}).click();
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    expect((await header.boundingBox())?.height).toBe(initial?.height);
    await expect(page.locator('[data-primary-navigation]')).toBeVisible();
    await page.locator('header a[href="/compare"]').click();
    await expect(page).toHaveURL(/\/compare/);await expect(page.locator('main')).not.toBeEmpty();
    await page.locator('header a[href="/"]').first().click();await expect(page).toHaveURL(/\/$/);
    await page.locator('header a[href="/family-pack"]').click();await expect(page).toHaveURL(/\/family-pack/);
    await page.locator('header a[href="/"]').first().click();
  }
  for(const width of [320,375,768,1366,1920]){
    await page.setViewportSize({width,height:844});
    expect(await header.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('header a[href="/register"]')).toHaveCSS('background-image',/linear-gradient/);
    if(width>=1200) {
      await expect(page.getByRole('button',{name:'Open navigation menu'})).toBeHidden();
      await expect(page.locator('.public-header__drawer')).toHaveCount(0);
      continue;
    }
    for(let i=0;i<3;i++){
      await page.getByRole('button',{name:'Open navigation menu'}).click();
      const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
      const auth=dialog.locator('.store-drawer__auth');
      expect(await auth.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
      await expect(auth.locator('a[href="/register"]')).toHaveCSS('background-image',/linear-gradient/);
      const scroll=dialog.locator('.store-drawer__scroll');
      await scroll.evaluate(e=>{e.scrollTop=e.scrollHeight;});
      expect(await scroll.evaluate(e=>e.scrollHeight<=e.clientHeight || e.scrollTop>0)).toBe(true);
      await dialog.getByRole('button',{name:'Close navigation menu'}).click();await expect(dialog).toBeHidden();
      await expect.poll(()=>page.locator('body').getAttribute('data-scroll-locked')).toBeNull();
    }
  }
  expect(headers.length).toBeGreaterThan(0);expect(headers.every(h=>/^[a-f0-9]{32}$/.test(h))).toBe(true);
  expect(errors).toEqual([]);
  await page.setViewportSize({width:375,height:844});await page.screenshot({path:info.outputPath('consistent-marathi-header.png')});
});

test('changing language keeps search drafts, filters and inventory requests intact',async({page})=>{
  const calls=await mock(page);await page.goto('/shop?lang=en');
  await expect(page.locator('.reference-card__buy').first()).toBeVisible();
  const input=page.locator('main input[placeholder="e.g. mirror number ending in 786 under ₹30,000"]');
  await input.fill('mirror ending in 786');
  const listings=calls.filter(c=>c.url.endsWith('/numbers/list')).length;
  await page.getByRole('button',{name:'Choose language',exact:true}).first().click();
  await page.getByRole('dialog').getByRole('button',{name:/मराठी/}).click();
  await expect(page.locator('html')).toHaveAttribute('lang','mr');
  await expect(input).toHaveCount(0);
  await expect(page.locator('main input').first()).toHaveValue('mirror ending in 786');
  expect(calls.filter(c=>c.url.endsWith('/numbers/list')).length).toBe(listings);
  await expect(page.locator('.reference-card__buy').first()).toHaveText(buy.mr);
  await page.setViewportSize({width:375,height:844});
  await page.getByRole('button',{name:'Open navigation menu'}).click();
  const drawer=page.getByRole('dialog');
  await drawer.getByRole('button',{name:'Choose language',exact:true}).click();
  await page.getByRole('dialog').last().getByRole('button',{name:/മലയാളം/}).click();
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button',{name:'Close navigation menu'}).click();
  await expect.poll(()=>page.locator('body').getAttribute('data-scroll-locked')).toBeNull();
});

test('inventory validates batch deletion, confirms recycle, selects and restores, and permanently deletes only from recycle',async({page},info)=>{
  const calls=await mock(page,true);await page.goto('/admin/numbers');await page.getByRole('button',{name:'Delete',exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.getByLabel('Mobile numbers').fill('9876543210,9876543211\nbad\n9000000000');await dialog.getByRole('button',{name:'Validate',exact:true}).click();
  await expect(dialog.getByText('Ready to recycle',{exact:true})).toBeVisible();await expect(dialog.getByText('bad: Invalid number')).toBeVisible();await dialog.getByRole('button',{name:'Delete 2 numbers',exact:true}).click();
  await expect(dialog).toHaveAccessibleName('Confirm moving numbers to Recycle');expect(calls.some(c=>c.url.endsWith('/numbers/delete'))).toBe(false);await dialog.getByRole('button',{name:'Confirm delete',exact:true}).click();await expect(dialog).toBeHidden();
  await page.getByRole('link',{name:'Recycle',exact:true}).click();await expect(page.getByRole('heading',{name:'Recycle',exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'Select 9876543210',exact:true}).check();await expect(page.getByText('1 selected',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Select all on this page',exact:true}).click();await expect(page.getByText('2 selected',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Deselect all',exact:true}).click();await expect(page.getByText('0 selected',{exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('recycle-desktop.png'),fullPage:true});
  await page.getByRole('button',{name:'Select all on this page',exact:true}).click();await page.getByRole('button',{name:'Restore selected',exact:true}).click();await page.getByRole('button',{name:'Confirm restore',exact:true}).click();await expect(page.getByRole('dialog')).toBeHidden();await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('link',{name:'Numbers',exact:true}).last().click();await expect(page.locator('main').getByText('9876543210',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Delete',exact:true}).click();await page.getByLabel('Mobile numbers').fill('9876543210,9876543211');await page.getByRole('button',{name:'Validate',exact:true}).click();await page.getByRole('button',{name:'Delete 2 numbers',exact:true}).click();await page.getByRole('button',{name:'Confirm delete',exact:true}).click();await page.getByRole('link',{name:'Recycle',exact:true}).click();await page.getByRole('button',{name:'Select all on this page',exact:true}).click();await page.getByRole('button',{name:'Permanently delete selected',exact:true}).click();await expect(page.getByRole('dialog')).toHaveAccessibleName('Confirm permanent deletion');await page.getByRole('button',{name:'Permanently delete',exact:true}).click();await expect(page.getByRole('dialog')).toBeHidden();
  expect(calls.find(c=>c.url.endsWith('/numbers/delete'))?.p).toMatchObject({confirm:true,validation_token:'test-token'});expect(calls.find(c=>c.url.endsWith('/numbers/recycle/permanent-delete'))?.p).toMatchObject({number_ids:[1,2],confirm:true});
});

test('admin sidebar retains desktop DOM and mobile drawer scrolls and animates smoothly on repeated toggles',async({page},info)=>{
  const calls=await mock(page,true);await page.addInitScript(()=>localStorage.setItem('vnw_language','hi'));await page.goto('/admin/numbers');
  await page.locator('aside nav').evaluate(e=>(e as HTMLElement).dataset.identity='stable');
  for(let i=0;i<4;i++){await page.getByRole('button',{name:'Toggle sidebar',exact:true}).click();await expect(page.locator('aside nav')).toHaveAttribute('data-identity','stable');}
  await page.setViewportSize({width:375,height:600});
  for(let i=0;i<4;i++) {
    await page.getByRole('button',{name:'Open sidebar',exact:true}).click();const drawer=page.getByRole('dialog',{name:'Account navigation'});await expect(drawer).toBeVisible();await expect.poll(async()=>Math.round((await drawer.boundingBox())!.x)).toBe(0);
    await expect(page.locator('body')).toHaveAttribute('data-scroll-locked','1');await drawer.locator('nav').evaluate(e=>e.scrollTop=e.scrollHeight);expect(await drawer.locator('nav').evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
    if(i===0)await page.screenshot({path:info.outputPath('admin-drawer-mobile.png')});
    await drawer.getByRole('button',{name:'Close sidebar',exact:true}).click();await expect(drawer).toBeHidden();await expect(page.locator('body')).not.toHaveAttribute('data-scroll-locked');
  }
  expect(calls.filter(c=>c.url.endsWith('/site/languages/catalog'))).toEqual([]);await expect(page.locator('html')).toHaveAttribute('lang','en');
});

test('family selection controls are compact and VIP label is removed without changing selection totals',async({page})=>{
  await mock(page);await page.setViewportSize({width:375,height:844});await page.goto('/family-pack');const card=page.getByTestId('family-pack-card').first();await expect(card).toBeVisible();await expect(card.getByText('VIP NUMBER',{exact:true})).toHaveCount(0);const button=card.locator('.reference-family__select').first();expect((await button.boundingBox())!.width).toBeCloseTo(22,2);expect((await button.boundingBox())!.height).toBeCloseTo(22,2);await expect(card.locator('.reference-family__total')).toHaveText('₹39,999');await button.click();await expect(card.locator('.reference-family__total')).toHaveText('₹19,999.50');
});

test('public routes including all legal and authentication screens retain the language after reload',async({page})=>{
  await mock(page);await page.setViewportSize({width:375,height:844});await page.goto('/shop?lang=ml');await expect(page.locator('.reference-card__buy').first()).toHaveText(buy.ml);
  for(const route of ['/','/categories','/premium-numbers','/newly-added-vip-numbers','/number/1','/number/1/similar','/numerology','/how-it-works','/family-pack','/corporate-numbers','/faq','/about','/cart','/pre-book','/terms-and-conditions','/privacy-policy','/refund-policy','/delivery-fulfilment-policy','/cookie-policy','/mnp-activation-policy','/disclaimer','/grievance-redressal','/login','/register']) {
    await page.goto(route);await expect(page.locator('html')).toHaveAttribute('lang','ml');await expect(page.locator('body')).toContainText(/ഹോം|സ്റ്റോറിലേക്ക് മടങ്ങുക/);await expect(page.getByRole('dialog',{name:'Choose your language'})).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth),route).toBeLessThanOrEqual(1);
  }
});

test('bundled languages work with app catalog offline, make no provider calls, and restore English safely',async({page})=>{
  const providerCalls:string[]=[];page.on('request',request=>{if(/translation\.googleapis|translate\.google/.test(request.url()))providerCalls.push(request.url());});
  await mock(page);await page.route('**/site/languages/catalog',route=>route.abort());await page.goto('/shop?lang=hi');await expect(page.locator('.reference-card__buy').first()).toHaveText(buy.hi);await expect(page.locator('.reference-card__number-link').first()).toHaveText('9876543210');
  await page.getByRole('button',{name:'Choose language',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:/English/}).click();await expect(page.locator('.reference-card__buy').first()).toHaveText('Buy Now');expect(providerCalls).toEqual([]);
});

test('admin edits drafts, publishes them and sees the published catalog in the storefront',async({page},info)=>{
  test.setTimeout(45000);await mock(page,true);let translation='होम',published='होम',revision=1;const calls:any[]=[];
  await page.route('**/admin/languages/**',async route=>{
    const url=route.request().url(),p=route.request().postDataJSON();calls.push({url,p});let data:any={};
    if(url.endsWith('/list'))data={language:p.language,items:[{source_hash:'home',source:'Home',context:'shared/layout/PublicLayout.tsx',translation,published_text:published,revision}],total:1,page:1,limit:25,version:'v'+revision,summary:{total:1,published:1,missing:0,drafts:translation!==published?1:0}};
    if(url.endsWith('/save')){translation=p.translation;revision++;data={saved:1};}
    if(url.endsWith('/publish')){published=translation;revision++;data={published:1};}
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:1,data})});
  });
  await page.route('**/site/languages/catalog',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:1,data:{language:'hi',translations:{Home:published}}})}));
  await page.goto('/admin/languages');await expect(page.getByRole('combobox',{name:'Language',exact:true})).toBeVisible();await page.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Translation',{exact:true}).fill('नया होम');await page.getByRole('button',{name:'Save draft',exact:true}).click();await expect(page.getByRole('dialog')).toBeHidden();expect(published).toBe('होम');
  await page.getByRole('button',{name:'Publish drafts',exact:true}).click();await page.getByRole('button',{name:'Confirm publish',exact:true}).click();await expect(page.getByRole('dialog')).toBeHidden();expect(calls.find(c=>c.url.endsWith('/save')).p).toMatchObject({language:'hi',source:'Home',translation:'नया होम',revision:1});expect(calls.find(c=>c.url.endsWith('/publish')).p).toMatchObject({language:'hi',version:'v2',confirm:true});
  await page.setViewportSize({width:375,height:844});await page.screenshot({path:info.outputPath('admin-languages-mobile.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
  await page.goto('/shop?lang=hi');await expect(page.locator('body')).toContainText('नया होम');await expect(page.locator('.reference-card__buy').first()).toHaveText(buy.hi);
});

test('Recycle pages on the server, resets selection, and protects purchase history in the responsive table',async({page})=>{
  const calls=await mock(page,true);
  await page.route('**/admin/numbers/recycle/list',async route=>{const p=route.request().postDataJSON();calls.push({url:route.request().url(),p});const all=Array.from({length:40},(_,index)=>({...samples[0],number_id:index+1,number_value:String(9000000000+index),display_number:String(9000000000+index),deleted_at:'2026-10-12T00:00:00Z',status_before_delete:'AVAILABLE',can_permanently_delete:index!==2,permanent_delete_reason:index===2?'Order, pre-book or dealer purchase history must be retained.':null}));await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:1,data:{items:all.slice((p.page-1)*p.limit,p.page*p.limit),total:40,page:p.page,limit:p.limit}})});});
  await page.goto('/admin/numbers/recycle');await page.getByRole('checkbox',{name:'Select 9000000000',exact:true}).check();await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page.getByText('0 selected',{exact:true})).toBeVisible();await expect(page.getByRole('checkbox',{name:'Select 9000000025',exact:true})).toBeVisible();expect(calls.at(-1).p).toMatchObject({page:2,limit:25});
  await page.getByRole('combobox',{name:'Rows per page',exact:true}).click();await page.getByRole('option',{name:'500',exact:true}).click();await expect(page.getByRole('checkbox')).toHaveCount(40);expect(calls.at(-1).p).toMatchObject({page:1,limit:500});
  await page.getByRole('button',{name:'Select all on this page',exact:true}).click();await expect(page.getByRole('button',{name:'Permanently delete selected',exact:true})).toBeDisabled();await page.getByRole('checkbox',{name:'Select 9000000002',exact:true}).uncheck();await expect(page.getByRole('button',{name:'Permanently delete selected',exact:true})).toBeEnabled();
  for(const width of [320,375,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);}
});
