import { expect, test } from '@playwright/test';

const viewports = [{width:360,height:800},{width:768,height:1024},{width:1280,height:800}];
const product = { accessory_id:1,slug:'vnw-fast-charger',name:'VNW 20W Fast Charger',brand:'VNW',model:'C20',sku:'VNW-C20',category:'Chargers',mrp:1299,offer_price:999,discount_pct:23,stock:6,reserved_stock:0,available_stock:6,short_description:'Compact fast charging for everyday use.',description:'A dependable charger for compatible devices.',highlights:['20W fast output','Compact design'],specifications:[{label:'Output',value:'20W'}],warranty:'6 month warranty',status:'ACTIVE',primary_image_id:null,images:[] };

async function mockApi(page: import('@playwright/test').Page) {
  await page.route('http://localhost:3002/vipnumberworld/**', async route => {
    const url=route.request().url(); let data:any=[];
    if(url.endsWith('/site/settings')) data={SITE_TITLE:'VIP Number World',CONTACT_EMAIL:'support@example.test',POLICY_EFFECTIVE_DATE:'17 August 2026'};
    if(url.endsWith('/accessories/list')) data={items:[product],total:1,page:1,limit:12,facets:[{brand:'VNW',category:'Chargers'}]};
    if(url.endsWith('/accessories/detail')) data=product;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:1,info:'OK',data})});
  });
}

for(const viewport of viewports){
  test(`legal and accessory screens fit ${viewport.width}px`,async({page})=>{await page.setViewportSize(viewport);await mockApi(page);await page.goto('/refund-policy');await expect(page.getByRole('heading',{name:'Refund, Cancellation and Return Policy'})).toBeVisible();await expect(page.getByRole('button',{name:/Accessory issue returns/})).toHaveAttribute('aria-expanded','true');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);await page.goto('/accessories');await expect(page.getByRole('link',{name:'VNW 20W Fast Charger'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);await page.getByRole('link',{name:'VNW 20W Fast Charger'}).click();await expect(page.getByRole('heading',{name:'VNW 20W Fast Charger'})).toBeVisible();await expect(page.getByText('7-day issue support')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);});
}

test('header and legal navigation retain readable hover contrast', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockApi(page);
  await page.goto('/terms-and-conditions');

  const familyPack = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Family Pack' });
  await familyPack.hover();
  const headerColors = await familyPack.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(headerColors.color).not.toBe(headerColors.background);

  const tocLink = page.getByRole('complementary').getByRole('link', { name: '1. Acceptance and accounts' });
  await tocLink.hover();
  const tocColors = await tocLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(tocColors.color).not.toBe(tocColors.background);
});
