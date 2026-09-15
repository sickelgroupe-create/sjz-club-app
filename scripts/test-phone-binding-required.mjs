import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
function harness(route='pages/profile/index'){
 const storage=new Map(),urls=[]
 const context={getCurrentPages:()=>[{route}],isDark:()=>false,uni:{
  getStorageSync:k=>storage.get(k),setStorageSync:(k,v)=>storage.set(k,v),removeStorageSync:k=>storage.delete(k),
  reLaunch:o=>urls.push(o.url),redirectTo:o=>urls.push(o.url),showToast:()=>{}
 }}
 vm.createContext(context)
 vm.runInContext(source('services/wechat-binding.js').replace(/export /g,''),context)
 return {context,storage,urls}
}
function page(h,path){
 vm.runInContext(source(path).match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'').replace('export default','page='),h.context)
 const p=h.context.page,s=p.data()
 for(const [k,v] of Object.entries(p.methods))s[k]=v.bind(s)
 return s
}
test('unbound phone can finish login and browse without authorization',()=>{
 const h=harness('pages/login/index'),s=page(h,'pages/login/index.vue')
 h.storage.set('phoneBindingRequired',true);h.storage.set('preferences',{});h.storage.set('loginNext','/pages/index/index')
 s.done();assert.deepEqual(h.urls,['/pages/index/index'])
})
test('already bound phone enters intended page without another authorization',()=>{
 const h=harness(),s=page(h,'pages/login/index.vue');h.storage.set('preferences',{});s.done()
 assert.deepEqual(h.urls,['/pages/profile/index'])
})
test('phone gate only intercepts checkout; profile, catalogue and customer service remain accessible',()=>{
 for(const route of ['pages/profile/index','pages/index/index','pages/product/detail','pages/service/customer','pages/order/submit','pages/order/payment','pages/account/bind','pages/common/document']){
  const h=harness(route);h.storage.set('phoneBindingRequired',true);h.context.enforceWechatBinding()
  assert.equal(h.urls.length,['pages/order/submit','pages/order/payment'].includes(route)?1:0)
 }
})
test('WeChat proof still takes priority over phone binding',()=>{
 const h=harness();h.storage.set('phoneBindingRequired',true);h.storage.set('wechatBindingRequired',true)
 h.context.enforceWechatBinding();assert.deepEqual(h.urls,['/pages/login/index'])
})
test('binding failure cannot continue; success keeps UID and returns to intended page',async()=>{
 const h=harness();h.context.api={bindPhone:async()=>{throw Error('用户拒绝授权')}}
 const s=page(h,'pages/account/bind.vue');s.requiredPhone=true;s.state={id:68}
 h.storage.set('preferences',{});h.storage.set('loginNext','/pages/order/submit?id=3')
 await s.bindPhone({detail:{code:'proof'}});assert.equal(h.urls.length,0)
 h.context.api.bindPhone=async()=>({id:68,phone:'13800138000',phoneBound:true})
 await s.bindPhone({detail:{code:'proof'}})
 assert.equal(s.state.id,68);assert.deepEqual(h.urls,['/pages/order/submit?id=3'])
})
test('server phone denial does not refresh or erase login',async()=>{
 const h=harness();h.context.API_BASE_URL='https://isolated.invalid';h.storage.set('token','wechat-session')
 h.context.uni.request=o=>o.success({statusCode:403,data:{code:4602,msg:'请先绑定手机号'}})
 vm.runInContext(source('services/request.js').replace(/^import .*$/gm,'').replace(/export /g,''),h.context)
 await assert.rejects(h.context.request({url:'/orders'}),/手机号/)
 assert.equal(h.storage.get('token'),'wechat-session');assert.equal(h.storage.get('phoneBindingRequired'),true)
})
test('phone gate follows server session and verified binding response',()=>{
 const h=harness();vm.runInContext(source('services/request.js').replace(/^import .*$/gm,'').replace(/export /g,''),h.context)
 h.context.saveSession({accessToken:'same-account',wechatBound:true,phoneBound:false,user:{id:68}})
 assert.equal(h.storage.get('phoneBindingRequired'),true)
 h.context.saveSession({id:68,phoneBound:true,wechatBound:true})
 assert.equal(h.storage.has('phoneBindingRequired'),false);assert.equal(h.storage.get('token'),'same-account')
})
