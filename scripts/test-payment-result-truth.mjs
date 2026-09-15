import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import {test} from 'node:test'
import assert from 'node:assert/strict'
const source=readFileSync(new URL('../pages/order/payment-result.vue',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'').replace('export default','page =')
function harness(getOrder){const ctx={api:{getOrder},isDark:()=>false};vm.createContext(ctx);vm.runInContext(source,ctx);const def=ctx.page,state=def.data();for(const [name,fn] of Object.entries(def.methods))state[name]=fn.bind(state);return{def,state}}
test('URL success is ignored before a backend response',()=>{const {def,state}=harness(()=>new Promise(()=>{}));def.onLoad.call(state,{id:'1',status:'success',message:'支付成功'});assert.equal(state.status,'checking');assert.equal(state.message,'')})
test('backend unpaid cannot be overwritten by previous success',async()=>{const {state}=harness(async()=>({status:'unpaid',remainingSeconds:30}));state.status='success';await state.load();assert.equal(state.status,'unpaid')})
test('network failure never preserves a success result',async()=>{const {state}=harness(async()=>{throw Error('network')});state.status='success';await state.load();assert.equal(state.status,'checking');assert.equal(state.order,null)})
test('backend paid result clears stale failure wording',async()=>{const {state}=harness(async()=>({status:'serving'}));state.message='失败';await state.load();assert.equal(state.status,'success');assert.equal(state.message,'')})
test('refund processing and completed are distinct',async()=>{for(const status of ['refunding','refunded']){const {state}=harness(async()=>({status}));await state.load();assert.equal(state.status,status)}})
test('unknown backend state remains unconfirmed and never displays raw code',async()=>{const {state,def}=harness(async()=>({status:'new_internal_state'}));await state.load();assert.equal(state.status,'checking');assert.equal(def.computed.statusText.call(state),'待确认')})
test('timeout and user cancellation remain distinct',async()=>{for(const reason of ['payment_timeout','user_cancelled']){const {state}=harness(async()=>({status:'cancelled',cancelReason:reason}));await state.load();assert.equal(state.status,reason==='payment_timeout'?'expired':'cancelled')}})
test('only backend-confirmed unpaid orders can retry',async()=>{const {state,def}=harness(async()=>({status:'unpaid',remainingSeconds:30}));assert.ok(!def.computed.canRetry.call(state));await state.load();assert.ok(def.computed.canRetry.call(state))})
