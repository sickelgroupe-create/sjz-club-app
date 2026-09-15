import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import {test} from 'node:test'

const rechargeSource=readFileSync(new URL('../services/recharge.js',import.meta.url),'utf8').replace(/^import .*$/gm,'').replace('export async function','async function')
function payment({cancel=false,status='success',expired=false,queryError=false}={}){
 const calls=[]
 const api={prepayRecharge:async()=>({expired,requestPayment:{package:'prepay_id=fixture'}}),syncWechatRecharge:async()=>{calls.push('server-query');if(queryError)throw Error('offline');return {order:{status},tradeState:status==='success'?'SUCCESS':'NOTPAY'}}}
 const context={api,uni:{requestPayment:o=>{calls.push('request-payment');cancel?o.fail({errMsg:'cancel'}):o.success({})}},setTimeout:f=>f()}
 vm.createContext(context);vm.runInContext(rechargeSource,context);return {pay:context.payRecharge,calls}
}
test('recharge success requires confirmed server status',async()=>{const h=payment();assert.equal((await h.pay(8)).success,true);assert.deepEqual(h.calls,['request-payment','server-query'])})
test('frontend success alone cannot report credited funds',async()=>{const h=payment({status:'created'});const result=await h.pay(8);assert.equal(result.success,false);assert.match(result.message,/确认中/);assert.equal(h.calls.filter(x=>x==='server-query').length,4)})
test('cancel racing a successful callback still reports server-confirmed success',async()=>{const h=payment({cancel:true});assert.equal((await h.pay(8)).success,true)})
test('cancel without a successful payment leaves retry information',async()=>{const h=payment({cancel:true,status:'created'});const result=await h.pay(8);assert.equal(result.success,false);assert.match(result.message,/取消/)} )
test('network uncertainty never reports successful recharge',async()=>{const h=payment({queryError:true});assert.equal((await h.pay(8)).success,false)})
test('expired recharge never opens payment',async()=>{const h=payment({expired:true});assert.equal((await h.pay(8)).success,false);assert.deepEqual(h.calls,[])})

const loginSource=readFileSync(new URL('../pages/login/index.vue',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'').replace('export default','page =')
function login(register=false,limited=false){
 const calls=[],api={phoneRegister:async p=>{calls.push(['register',p])},passwordLogin:async p=>{calls.push(['login',p]);return {wechatBindingRequired:limited}},getBindings:async()=>({wechatBound:false}),bindWechat:async code=>{calls.push(['bind',code]);return {wechatBound:true}}}
 const storage=new Map();const context={api,wechatCode:async()=> 'fresh-real-login-code',uni:{showModal:o=>o.complete(),getStorageSync:k=>storage.get(k),setStorageSync:(k,v)=>storage.set(k,v),removeStorageSync:k=>storage.delete(k)},isDark:()=>false}
 vm.createContext(context);vm.runInContext(loginSource,context);const page=context.page,s=page.data();for(const [k,f]of Object.entries(page.methods))s[k]=f.bind(s)
 Object.assign(s,{mode:register?'register':'password',phone:'13800000000',password:register?'Password123':'legacy',confirmPassword:'Password123',agreed:true,done:()=>calls.push(['done'])});return {s,calls,api,storage,context}
}
test('phone registration requires native verified code and then binds current WeChat',async()=>{const h=login(true);await h.s.registerPhone({detail:{code:'verified-code'}});assert.deepEqual(h.calls.map(x=>x[0]),['register','bind','done']);assert.deepEqual(Object.keys(h.calls[0][1]).sort(),['password','phone','phoneCode']);assert.equal(h.calls[0][1].phoneCode,'verified-code')})
test('registration without phone authorization cannot create an account',async()=>{const h=login(true);await h.s.submit();assert.equal(h.calls.length,0);assert.match(h.s.error,/授权/)})
test('refused phone registration authorization cannot create an account',async()=>{const h=login(true);await h.s.registerPhone({detail:{errMsg:'deny'}});assert.equal(h.calls.length,0);assert.match(h.s.error,/授权/)})
test('existing password login does not impose new-password rules without requiring WeChat',async()=>{const h=login();await h.s.submit();assert.deepEqual(h.calls.map(x=>x[0]),['login','done'])})
test('failed WeChat binding never enters app and retains limited retry state',async()=>{const h=login(false,true);h.api.bindWechat=async()=>{throw Error('微信绑定失败')};await h.s.submit();assert.equal(h.calls.some(c=>c[0]==='done'),false);assert.equal(h.s.bindingPending,true);assert.equal(h.storage.get('wechatBindingRequired'),true);assert.match(h.s.error,/绑定失败/)})
test('retry binds the same registered account without registering or logging in again',async()=>{const h=login(true);h.api.bindWechat=async()=>{throw Error('网络中断')};await h.s.registerPhone({detail:{code:'verified-code'}});h.api.bindWechat=async()=>({wechatBound:true});await h.s.wechatSubmit();assert.deepEqual(h.calls.map(c=>c[0]),['register','done']);assert.equal(h.s.bindingPending,false);assert.equal(h.storage.has('wechatBindingRequired'),false)})
test('binding conflict cannot silently switch to another WeChat account',async()=>{const h=login(false,true);h.api.bindWechat=async()=>({mergeRequired:true});await h.s.submit();assert.equal(h.calls.some(c=>c[0]==='done'),false);assert.equal(h.s.bindingPending,true);assert.match(h.s.error,/不能绑定/)})
test('ambiguous binding response must not authorize navigation',async()=>{const h=login(false,true);h.api.bindWechat=async()=>({});await h.s.submit();assert.equal(h.calls.some(c=>c[0]==='done'),false);assert.match(h.s.error,/尚未绑定成功/)})
test('native WeChat login failure leaves phone session restricted',async()=>{const h=login(false,true);h.context.wechatCode=async()=>{throw Error('微信授权失败')};await h.s.submit();assert.deepEqual(h.calls.map(c=>c[0]),['login']);assert.equal(h.storage.get('wechatBindingRequired'),true)})
test('switching accounts clears limited credentials instead of merging accounts',async()=>{const h=login();h.s.bindingPending=true;h.storage.set('token','limited');h.storage.set('wechatBindingRequired',true);h.s.setMode('password');assert.equal(h.s.bindingPending,false);assert.equal(h.storage.has('token'),false);assert.equal(h.calls.length,0)})
