import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import {test} from 'node:test'
const full=readFileSync(new URL('../pages/order/payment.vue',import.meta.url),'utf8')
const source=full.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'').replace('export default','page =')
function harness({requestPayment='success'}={}){
 const redirects=[],calls=[]
 const api={getOrder:async()=>({id:8,status:'unpaid',remainingSeconds:120,total:1,product:{},sku:{}}),getWallet:async()=>({balance:0}),payOrder:async()=>{calls.push('prepay');return{requestPayment:{timeStamp:'1',nonceStr:'n',package:'prepay_id=p',signType:'RSA',paySign:'s'}}},syncWechatPayment:async()=>{calls.push('sync');return{order:{status:'pending'}}}}
 const uni={redirectTo:o=>redirects.push(o.url),reLaunch:o=>redirects.push(o.url),requestPayment:o=>requestPayment==='success'?o.success({}):o.fail({errMsg:'requestPayment:fail cancel'})}
 const context={api,isDark:()=>false,uni,clearInterval,setInterval:()=>1};vm.createContext(context);vm.runInContext(source,context)
 const def=context.page,state=def.data();Object.entries(def.methods).forEach(([k,fn])=>state[k]=fn.bind(state));state.order={id:8,status:'unpaid',total:1};state.orderId='8';state.remaining=120;state.requestKey='fixed';return{state,calls,redirects,api,def,uni}
}
test('real WeChat checkout invokes requestPayment then server-side query',async()=>{const h=harness();await h.state.pay();assert.deepEqual(h.calls,['prepay','sync']);assert.match(h.redirects[0],/status=success/)})
test('buyer cancellation keeps unpaid order instead of reporting payment failure',async()=>{const h=harness({requestPayment:'cancel'});await h.state.pay();assert.deepEqual(h.calls,['prepay']);assert.equal(h.redirects.length,0);assert.equal(h.state.error,'已取消微信支付')})
test('production payment page contains no simulated outcome controls',()=>{assert.ok(!full.includes('模拟微信支付结果'));assert.ok(!full.includes('模拟成功'))})

test('payment keeps the chosen channel even when the row selection changes while awaiting prepay',async()=>{const h=harness();h.api.payOrder=async()=>{h.calls.push('prepay');h.state.method='balance';return{requestPayment:{package:'prepay_id=p'}}};await h.state.pay();assert.deepEqual(h.calls,['prepay','sync']);assert.match(h.redirects[0],/status=success/)})
test('returning from native payment does not race a second order load',()=>{const h=harness();h.state.paying=true;let loads=0;h.state.loadOrder=()=>loads++;h.def.onShow.call(h.state);assert.equal(loads,0)})
test('cancelled payment can be requested again without claiming payment success',async()=>{const h=harness({requestPayment:'cancel'});await h.state.pay();await h.state.pay();assert.deepEqual(h.calls,['prepay','prepay']);assert.equal(h.redirects.length,0);assert.equal(h.state.paying,false)})
test('server-confirmed payment during channel switch never triggers a second payment',async()=>{const h=harness();h.api.payOrder=async()=>({order:{status:'pending'}});h.uni.requestPayment=()=>{throw Error('must not pay twice')};await h.state.pay();assert.match(h.redirects[0],/status=success/);assert.equal(h.calls.length,0)})
test('paid orders held for refund review open order details, not a false payment failure',async()=>{const h=harness();h.api.payOrder=async()=>({order:{status:'refunding'}});await h.state.pay();assert.equal(h.redirects[0],'/pages/order/detail?id=8');assert.equal(h.calls.length,0)})
