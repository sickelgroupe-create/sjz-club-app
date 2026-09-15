import {test} from 'node:test'
import assert from 'node:assert/strict'
import {displayDateTime,displayPaymentMethod} from '../utils/display.mjs'
test('payment display is Chinese and never leaks unknown internal codes',()=>{
 assert.equal(displayPaymentMethod('balance'),'余额支付');assert.equal(displayPaymentMethod('wechat'),'微信支付');assert.equal(displayPaymentMethod('new_provider'),'其他支付方式');assert.equal(displayPaymentMethod(null),'未支付')
})
test('local server dates keep the exact time and display seconds without T',()=>{
 for(const time of ['2026-09-07T15:58:56','2026-09-07 15:58:56','2026-09-07T15:58:56.123456'])assert.equal(displayDateTime(time),'2026年09月07日 15:58:56')
 assert.equal(displayDateTime('2026-09-07T15:58'),'2026年09月07日 15:58:00');assert.equal(displayDateTime('2026-09-07'),'2026年09月07日')
})
test('explicit zones display in China time without depending on device timezone',()=>{
 assert.equal(displayDateTime('2026-09-07T07:58:56Z'),'2026年09月07日 15:58:56')
 assert.equal(displayDateTime('2026-09-07T15:58:56+08:00'),'2026年09月07日 15:58:56')
 assert.equal(displayDateTime('2026-09-07T23:58:56-0400'),'2026年09月08日 11:58:56')
})
test('empty or invalid dates do not render Invalid Date, raw codes, or invented timestamps',()=>{
 for(const v of ['',null,undefined,'garbage','2026-02-30','2026-09-07T24:00:00'])assert.equal(displayDateTime(v),'-')
 assert.equal(displayDateTime('2026年09月07日 15:58:56'),'2026年09月07日 15:58:56')
})
