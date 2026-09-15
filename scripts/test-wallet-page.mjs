import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
function setup(type='player',balance='12.34',fail=false) {
  const notices=[],routes=[]
  const c={isDark:()=>false,api:{getWallet:async()=>{if(fail)throw Error('offline');return {balance}},getProfile:async()=>({userType:type})},uni:{getStorageSync:()=>({userType:type}),showToast:v=>notices.push(v),navigateTo:v=>routes.push(v)}}
  vm.createContext(c)
  const script=fs.readFileSync(new URL('../pages/wallet/index.vue',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]
  vm.runInContext(script.replace(/import[^;]+;/g,'').replace('export default','var page='),c)
  const s={...c.page.data()}
  Object.defineProperty(s,'isProvider',{get:()=>c.page.computed.isProvider.call(s)})
  for(const [k,f] of Object.entries(c.page.methods))s[k]=f.bind(s)
  return {s,notices,routes,show:async()=>{c.page.onShow.call(s);await new Promise(r=>setImmediate(r))}}
}
test('player wallet renders amount and opens withdrawal',async()=>{const t=setup();await t.show();assert.equal(t.s.isProvider,true);assert.equal(t.s.balance.toFixed(2),'12.34');t.s.goWithdraw();assert.equal(t.routes[0].url,'/pages/wallet/withdraw')})
test('customer has no withdrawal entry',async()=>{const t=setup('user',0);await t.show();assert.equal(t.s.isProvider,false);assert.equal(t.s.balance.toFixed(2),'0.00');t.s.goWithdraw();assert.equal(t.routes.length,0)})
test('wallet request failure is handled',async()=>{const t=setup('player',0,true);await t.show();assert.equal(t.notices.length,1)})
test('invalid amount cannot render NaN',async()=>{const t=setup('player','invalid');await t.show();assert.equal(t.notices.length,1);assert.equal(t.s.balance,0)})

