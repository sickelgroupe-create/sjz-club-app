import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import {test} from 'node:test'

const gateSource=readFileSync(new URL('../services/wechat-binding.js',import.meta.url),'utf8').replaceAll('export function','function')
function gate(route='pages/order/submit',pending=true){const calls=[],storage=new Map(pending?[['wechatBindingRequired',true]]:[]),context={getCurrentPages:()=>[{route}],uni:{getStorageSync:k=>storage.get(k),reLaunch:o=>calls.push(o.url)}};vm.createContext(context);vm.runInContext(gateSource,context);return{calls,context}}
test('pending binding cannot enter checkout or workbench by direct navigation',()=>{for(const route of ['pages/order/submit','pages/workbench/index','pages/profile/index']){const h=gate(route);assert.equal(h.context.enforceWechatBinding(),true);assert.deepEqual(h.calls,['/pages/login/index'])}})
test('login and mandatory legal documents remain reachable during binding',()=>{for(const route of ['pages/login/index','pages/common/document']){const h=gate(route);assert.equal(h.context.enforceWechatBinding(),false);assert.equal(h.calls.length,0)}})
test('bound users retain existing navigation',()=>{const h=gate('pages/order/submit',false);assert.equal(h.context.enforceWechatBinding(),false)})

const requestSource=readFileSync(new URL('../services/request.js',import.meta.url),'utf8').replace(/^import .*$/gm,'').replace(/export /g,'')
test('financial binding prompt does not lock full password sessions out of ordinary pages',()=>{
 const h=gate('pages/wallet/recharge');const s=new Map([['accountSessionFull',true],['wechatBindingRequired',true]]);
 h.context.uni.getStorageSync=k=>s.get(k);h.context.uni.removeStorageSync=k=>s.delete(k);h.context.uni.navigateTo=o=>h.calls.push(o.url);
 assert.equal(h.context.enforceWechatBinding(),true);assert.deepEqual(h.calls,['/pages/account/bind']);assert.equal(s.has('wechatBindingRequired'),false);
 assert.equal(h.context.enforceWechatBinding(),false);
})
test('unbound full password session clears only WeChat navigation restriction',()=>{
 const h=transport();h.context.saveSession({accessToken:'full',wechatBound:false,wechatBindingRequired:false,phoneBound:false});
 assert.equal(h.storage.has('wechatBindingRequired'),false);assert.equal(h.storage.get('accountSessionFull'),true);assert.equal(h.storage.get('phoneBindingRequired'),true);
})
function transport(code=4601){const storage=new Map([['token','binding-token'],['refreshToken','limited-refresh']]),calls=[],context={API_BASE_URL:'https://isolated.invalid/app',API_ORIGIN:'https://isolated.invalid',getCurrentPages:()=>[{route:'pages/login/index'}],enforceWechatBinding:()=>calls.push('binding-gate'),uni:{getStorageSync:k=>storage.get(k),setStorageSync:(k,v)=>storage.set(k,v),removeStorageSync:k=>storage.delete(k),request:o=>{calls.push(o.url);o.success({statusCode:403,data:{code,msg:'请先完成微信绑定'}})},navigateTo:()=>calls.push('login')}};vm.createContext(context);vm.runInContext(requestSource,context);return {storage,calls,context}}
test('business binding denial cannot auto-refresh into full login',async()=>{const h=transport();await assert.rejects(h.context.request({url:'/orders',method:'POST'}),/绑定/);assert.equal(h.storage.get('wechatBindingRequired'),true);assert.equal(h.storage.get('token'),'binding-token');assert.deepEqual(h.calls,['https://isolated.invalid/app/orders','binding-gate'])})
test('server-issued limited session persists restriction across restart',()=>{const h=transport();h.context.saveSession({accessToken:'limited',wechatBound:false});assert.equal(h.storage.get('wechatBindingRequired'),true);h.context.saveSession({accessToken:'full',wechatBound:true});assert.equal(h.storage.has('wechatBindingRequired'),false);assert.equal(h.storage.get('token'),'full')})
