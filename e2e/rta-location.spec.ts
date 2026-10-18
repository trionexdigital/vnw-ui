import { expect, test, type Page } from '@playwright/test';

const languages = ['en','hi','mr','hg','gu','bn','pa','ta','te','kn','ml','or'];
const widths = [320,375,768,1366,1920];
const inventory = Array.from({length:14},(_,i)=>({number_id:i+1,number_value:`987654${String(i).padStart(4,'0')}`,display_number:`987654${String(i).padStart(4,'0')}`,mrp:1000,offer_price:900,discount_pct:10,status:'AVAILABLE',stock:1,rtp_status:'RTA'}));
async function mock(page:Page){
  const requests:any[]=[];
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
  await page.route('**/vipnumberworld/**',async route=>{
    const url=route.request().url(),payload=route.request().postDataJSON()||{};
    let data:unknown=[];
    if(url.endsWith('/numbers/list')||url.endsWith('/numbers/ai-search')){
      requests.push(payload);
      const eligible=payload.rtp_status==='RTA'?(payload.show_all_rta?inventory:payload.pin_code==='400001'?inventory.slice(0,9):[]):[];
      const page=Number(payload.page||1),limit=Number(payload.limit||12);
      data={items:eligible.slice((page-1)*limit,page*limit),total:eligible.length,pages:Math.ceil(eligible.length/limit)};
    }else if(url.endsWith('/site/settings'))data={};
    else if(url.endsWith('/site/languages/catalog'))data={language:payload.language,translations:{}};
    else if(url.endsWith('/site/location/pincode'))data={pin_code:'400001'};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:1,info:'OK',data})});
  });
  return requests;
}

for(const signedIn of [false,true])test(`${signedIn?'customer':'guest'}: first visit, local RTA, show all, pagination and search share one preference`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const requests=await mock(page);
  await page.addInitScript(signed=>{
    localStorage.removeItem('vnw_language');localStorage.removeItem('vnw_location_prompt_seen');
    localStorage.removeItem('vnw_pin_code');sessionStorage.removeItem('vnw_show_all_rta');
    if(signed){localStorage.setItem('token','rta-browser-test');localStorage.setItem('user',JSON.stringify({id:8,name:'Test Customer',email:'test@example.com',role:'CUSTOMER'}));}
  },signedIn);
  await page.goto('/');
  await expect(page.getByRole('dialog')).toContainText('Choose your language');
  await page.getByRole('dialog').getByRole('button',{name:'English EN',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Choose your location');
  await page.locator('[data-location-pin]').fill('400001');
  await page.getByRole('button',{name:'Save PIN code',exact:true}).click();
  const shelf=page.locator('#home-rta');
  await expect(shelf.getByTestId('number-card')).toHaveCount(7);
  expect(await shelf.evaluate(el=>el.previousElementSibling?.classList.contains('home-readiness'))).toBe(true);
  await shelf.getByRole('button',{name:/Show 7 more/}).click();
  await expect(shelf.getByTestId('number-card')).toHaveCount(9);
  await shelf.getByRole('button',{name:'Change PIN code'}).click();
  await page.locator('[data-location-pin]').fill('500001');
  await page.getByRole('button',{name:'Save PIN code',exact:true}).click();
  await expect(shelf.getByTestId('number-card')).toHaveCount(0);
  await shelf.getByRole('button',{name:'Show all numbers',exact:true}).click();
  await expect(shelf.getByTestId('number-card')).toHaveCount(7);
  await shelf.getByRole('button',{name:/Show 7 more/}).click();
  await expect(shelf.getByTestId('number-card')).toHaveCount(14);
  await shelf.getByRole('link',{name:'View all',exact:true}).click();
  await expect(page).toHaveURL(/\/shop\?rtp_status=RTA/);
  await expect(page.getByTestId('number-card')).toHaveCount(12);
  expect(requests.at(-1).show_all_rta).toBe(true);
  await page.getByRole('button',{name:'Show numbers for my PIN',exact:true}).click();
  await expect(page.getByTestId('number-card')).toHaveCount(0);
  await page.getByRole('button',{name:'Show all RTA numbers',exact:true}).click();
  await expect(page.getByTestId('number-card')).toHaveCount(12);
  await page.getByRole('button',{name:'Next page',exact:true}).click();
  await expect(page.getByTestId('number-card')).toHaveCount(2);
  await page.getByRole('button',{name:'Change PIN code',exact:true}).click();
  await page.locator('[data-location-pin]').fill('400001');
  await page.getByRole('button',{name:'Save PIN code',exact:true}).click();
  await expect(page.getByTestId('number-card')).toHaveCount(9);
  expect(new URL(page.url()).searchParams.has('page')).toBe(false);
  await page.getByRole('button',{name:'Browse numbers',exact:true}).click();
  await expect(page.getByTestId('number-card')).toHaveCount(0);
  expect(requests.at(-1).rtp_status).toBeUndefined();
  expect(errors).toEqual([]);
});

test('RTA section and location dialog fit all 12 locales at required viewport widths',async({page},testInfo)=>{
  test.setTimeout(240_000);
  await mock(page);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{localStorage.setItem('vnw_location_prompt_seen','1');localStorage.setItem('vnw_pin_code','400001');});
  for(const lang of languages){
    await page.goto(`/?lang=${lang}`);
    await expect(page.locator('#home-rta [data-testid="number-card"]')).toHaveCount(7);
    if(lang!=='en')await expect(page.locator('#home-rta-title')).not.toHaveText('Numbers ready to activate in minutes');
    for(const width of widths){
      await page.setViewportSize({width,height:900});
      await page.locator('[data-location-button]').click();
      const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog).toHaveCSS('opacity','1');
      await expect(page.locator('[data-location-pin]')).toHaveValue('400001');
      expect((await dialog.locator('button').first().boundingBox())!.width).toBeGreaterThanOrEqual(36);
      expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
      const bounds=await dialog.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width+1);
      if(lang==='en'||(lang==='ta'&&width===320))await page.screenshot({path:testInfo.outputPath(`location-${lang}-${width}.png`)});
      await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      const actions=await page.locator('.store-header__actions').boundingBox();expect(actions!.x+actions!.width).toBeLessThanOrEqual(width+1);
      await page.locator('#home-rta').scrollIntoViewIfNeeded();
      expect(await page.locator('#home-rta-title').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
      if(lang==='en')await page.locator('#home-rta').screenshot({path:testInfo.outputPath(`rta-${lang}-${width}.png`)});
      await page.evaluate(()=>scrollTo(0,0));
    }
    // Exercise SPA navigation and return without remounting language/location providers.
    await page.locator('#home-rta .home-discovery-view-all').click();
    await expect(page).toHaveURL(/\/shop/);
    await expect(page.getByTestId('number-card')).toHaveCount(9);
    await page.locator('.store-header__brand').click();
    await expect(page.locator('#home-rta [data-testid="number-card"]')).toHaveCount(7);
    await page.setViewportSize({width:320,height:900});
    await page.locator('[data-location-button]').click();
    await page.locator('[data-location-pin]').fill('000001');
    await page.getByRole('dialog').locator('button[type="submit"]').click();
    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
    expect(await page.getByRole('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await page.locator('[data-location-pin]').fill('500001');
    await page.getByRole('dialog').locator('button[type="submit"]').click();
    await expect(page.locator('#home-rta [data-rta-show-all]')).toBeVisible();
    await page.locator('#home-rta [data-rta-show-all]').click();
    await expect(page.locator('#home-rta [data-testid="number-card"]')).toHaveCount(7);
    await expect(page.locator('#home-rta [data-rta-local-only]')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.locator('[data-location-button]').click();
    await page.locator('[data-location-pin]').fill('400001');
    await page.getByRole('dialog').locator('button[type="submit"]').click();
  }
  expect(errors).toEqual([]);
});
