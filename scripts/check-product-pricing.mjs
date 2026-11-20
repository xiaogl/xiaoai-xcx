// Run from repository root: node scripts/check-product-pricing.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {randomUUID} from 'node:crypto';
import {initStock,trade} from '../lib/trade.mjs';

const XA = {};
runInNewContext(readFileSync(new URL('../js/product-pricing.js',import.meta.url),'utf8'),{window:{XA}});
const p = {id:'price-test',title:'价格校验',price:100,listPrice:140,strikePrice:120,member:true,
  pricingMode:'自定义会员价',memberPrice:96,silverPrice:90,goldPriceDiscount:8,diamondPrice:70,plusPrice:65,
  specs:[{options:[{t:'标准',d:0},{t:'大份',d:10}]}],stock:100};
initStock([p]);
const state={catalog:{products:[p]},orders:[]};
for(const [level,plus,expected] of [[1,false,106],[2,false,100],[3,false,88],[4,false,80],[3,true,75]]) {
  const q=XA.productPricing.quote(p,10,level,plus);
  assert.equal(q.price,expected);
  assert.equal(q.list,150);
  assert.equal(q.strike,130);
  const order=trade(state,{action:'pay',key:randomUUID(),items:[{pid:p.id,opts:[1],qty:1}],level,plus,plusFee:0,amount:expected});
  assert.equal(order.items[0].price,q.price);
  assert.equal(order.amount,expected);
}
assert.equal(XA.productPricing.quote(p,10,0,false).price,110);
assert.equal(XA.productPricing.quote({...p,pricingMode:undefined},10,2,false).price,104.5);
assert.equal(XA.productPricing.valid({...p,goldPrice:70},[10]),false);
assert.equal(XA.productPricing.valid({...p,plusPrice:-1},[10]),false);
console.log('通过：独立挂牌/划线价、会员固定价/折扣、等级继承、Plus择优、规格差价、游客价、旧折扣、订单金额校验');

// Optional UI check: pass the URL of a running local preview and make Playwright available.
if(process.argv[2]) {
  const {createRequire}=await import('node:module');
  const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || undefined});
  try {
    const page=await browser.newPage();
    const url=new URL(process.argv[2]);
    url.searchParams.set('demo',randomUUID());
    await page.goto(url.href);
    await page.waitForFunction(()=>window.XA?.current?.());
    await page.evaluate(()=>{
      const p=XA.data.products[0];
      Object.assign(p,{price:100,listPrice:140,strikePrice:120,member:true,pricingMode:'自定义会员价',goldPriceDiscount:8});
      XA.state.loggedIn=true;
      XA.state.user.growth=3500;
      XA.state.plus=null;
      XA.go('product?id='+p.id);
    });
    await page.locator('#view del').filter({hasText:'120'}).waitFor();
    assert.match(await page.locator('#view').innerText(),/挂牌价 ¥140/);
    await page.evaluate(()=>XA.act.sku(XA.data.products[0].id,'buy'));
    assert.match(await page.locator('#skuBody').innerText(),/80/);
    assert.match(await page.locator('#skuBody').innerText(),/挂牌价 ¥140/);
    url.pathname='/admin/';
    await page.goto(url.href);
    await page.evaluate(()=>ADM.editRecord('product',XA.data.products[0].id));
    await page.getByRole('button',{name:'价格设置',exact:true}).click();
    await page.locator('[data-path=member]').check();
    await page.locator('[data-path=pricingMode]').selectOption('自定义会员价');
    const mode=page.locator('[data-price-mode=goldPrice]');
    await mode.selectOption('discount');
    await page.locator('[data-path=goldPriceDiscount]').fill('8.5');
    await mode.selectOption('fixed');
    assert.equal(await page.locator('[data-path=goldPriceDiscount]').count(),0);
    await page.locator('[data-path=goldPrice]').fill('85');
    await mode.selectOption('inherit');
    assert.equal(await page.locator('[data-path=goldPrice]').count(),0);
    console.log('通过：Chrome 后台按等级切换继承、固定价、折数');
    console.log('通过：Chrome 商品详情与规格选择显示挂牌价、划线价、黄金会员折扣价');
  } finally {
    await browser.close();
  }
}
