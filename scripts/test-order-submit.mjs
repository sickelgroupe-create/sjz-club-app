import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const source=readFileSync(new URL('../pages/order/submit.vue',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/^import .*$/m,'').replace('export default','page =');
const goods={id:1,name:'测试商品',playerId:7,playerName:'绑定打手',skus:[{id:2,name:'规格',price:19.9}]};
function harness(overrides={}){
  const messages=[],redirects=[],requests=[];
  const api={getProduct:async()=>goods,getPlayers:async()=>[],newRequestId:()=> 'fixed-order-key',quoteOrder:async()=>({payableAmount:19.9,coupons:[]}),createOrder:async body=>{requests.push(body);return{id:8}},...overrides};
  const context={api,isDark:()=>false,uni:{showToast:m=>messages.push(m.title),redirectTo:r=>redirects.push(r.url)}};
  vm.createContext(context);vm.runInContext(source,context);
  const definition=context.page,state=definition.data();
  Object.entries(definition.methods).forEach(([key,fn])=>state[key]=fn.bind(state));
  return{state,messages,requests,redirects,load:q=>definition.onLoad.call(state,q)};
}
test('ordinary buyer can submit without a business identity',async()=>{
  const h=harness();await h.load({id:1,sku:2});h.state.form.gameId='G';h.state.form.gameName='普通买家';
  h.state.form.phone='13800138000';await h.state.create();assert.equal(h.requests.length,1);assert.equal(h.requests[0].form.phone,'13800138000');assert.equal(h.redirects[0],'/pages/order/payment?id=8');
});
test('bound player quote failure retains loaded form and assignment',async()=>{
  const h=harness({quoteOrder:async()=>{throw new Error('绑定打手当前暂停接单')}});
  h.state.form.gameId='keep-me';await h.load({id:1,sku:2});
  assert.equal(h.state.product.id,1);assert.equal(h.state.form.gameId,'keep-me');assert.equal(h.state.loading,false);assert.match(h.messages[0],/暂停接单/);
  h.state.form.gameName='买家';await h.state.create();assert.equal(h.requests.length,0);
});
test('first quote uses binding without fetching a player list',async()=>{
  const queried=[];let lists=0;
  const h=harness({getPlayers:async()=>{lists++;throw Error('unneeded')},quoteOrder:async q=>{queried.push(q.playerId);return{payableAmount:1}}});
  await h.load({id:1,sku:2,playerId:7});
  assert.equal(queried[0],7);assert.equal(lists,0);assert.equal(h.state.selectedPlayer.id,7);
});
test('retry succeeds when the bound player becomes available',async()=>{
  let offline=true;const h=harness({quoteOrder:async q=>{assert.equal(q.playerId,7);if(offline)throw new Error('打手暂停');return{payableAmount:19.9}}});
  await h.load({id:1,sku:2});offline=false;await h.state.refreshQuote();
  assert.equal(h.state.quoteError,'');assert.ok(h.state.quote);h.state.form.gameId='G';h.state.form.gameName='买家';h.state.form.phone='13800138000';await h.state.create();assert.equal(h.requests[0].playerId,7);
});
test('missing or invalid phone cannot create an order',async()=>{
 for(const phone of ['', '123', 'abcdefghijk']){
  const h=harness();await h.load({id:1,sku:2});Object.assign(h.state.form,{gameId:'G',gameName:'买家',phone});
  await h.state.create();assert.equal(h.requests.length,0);assert.match(h.messages.at(-1),/联系电话/);
 }
});
test('coupon failure retains the fixed player and is handled without unhandled rejection',async()=>{
  const h=harness({quoteOrder:async()=>{throw new Error('服务不可用')}});await h.load({id:1,sku:2,playerId:7});
  await h.state.selectCoupon(null);assert.equal(h.state.selectedPlayer.id,7);assert.ok(h.state.product);assert.equal(h.state.quote,null);
});
test('product failure still uses the retry page',async()=>{
  const h=harness({getProduct:async()=>{throw new Error('商品已下架')}});await h.load({id:1,sku:2});assert.equal(h.state.product,null);assert.equal(h.state.loadError,'商品已下架');
});
test('a service rebound to another player cannot silently substitute the selected player',async()=>{
 const h=harness();await h.load({id:1,sku:2,playerId:99});assert.equal(h.state.product,null);assert.match(h.state.loadError,/更换负责打手/);assert.equal(h.requests.length,0);
});
