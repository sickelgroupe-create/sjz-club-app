import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import {test} from 'node:test'
import assert from 'node:assert/strict'
const source=readFileSync(new URL('../pages/order/detail.vue',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'').replace('export default','page =')
function harness(channel){const calls=[];const ctx={orderReview:{},occupancyClock:{},uni:{showModal:x=>calls.push(['modal',x]),navigateTo:x=>calls.push(['navigate',x])}};vm.createContext(ctx);vm.runInContext(source,ctx);return{calls,run:()=>ctx.page.methods.applyAfterSale.call({orderId:123,order:{paymentChannel:channel}})}}
test('Apple aftersale explains external refund before navigation',()=>{const h=harness('apple_iap');h.run();assert.equal(h.calls.length,1);assert.equal(h.calls[0][0],'modal');assert.match(h.calls[0][1].content,/Apple/);assert.match(h.calls[0][1].content,/不代表款项已退回/);h.calls[0][1].success({confirm:true});assert.equal(h.calls[1][1].url,'/pages/service/customer?orderId=123')})
test('Apple explanation cancellation does not navigate or submit refund',()=>{const h=harness('apple_iap');h.run();h.calls[0][1].success({confirm:false});assert.equal(h.calls.length,1)})
test('ordinary payment retains existing customer-service route',()=>{const h=harness('virtual_wechat');h.run();assert.equal(h.calls.length,1);assert.equal(h.calls[0][0],'navigate');assert.equal(h.calls[0][1].url,'/pages/service/customer?orderId=123')})
