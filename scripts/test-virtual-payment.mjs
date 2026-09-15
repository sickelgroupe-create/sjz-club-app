import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { test } from 'node:test'
import assert from 'node:assert/strict'
const context = { Promise, Error }
vm.createContext(context)
vm.runInContext(readFileSync(new URL('../services/virtual-payment.js', import.meta.url), 'utf8').replace('export function', 'function'), context)
const params = { mode: 'short_series_goods', signData: '{"env":1}', paySig: 'a'.repeat(64), signature: 'b'.repeat(64) }
test('native virtual payment receives exact signed body, not reserialized data', async () => {
  let calls = 0
  await context.requestVirtualPayment(params, { requestVirtualPayment: p => { calls++; assert.equal(p.signData, params.signData); p.success({}) } })
  assert.equal(calls, 1)
})
test('unsupported client fails instead of falling back to ordinary payment', async () => {
  await assert.rejects(context.requestVirtualPayment(params, {}), /不支持/)
})
test('cancel is recognizable by the checkout page', async () => {
  await assert.rejects(context.requestVirtualPayment(params, { requestVirtualPayment: p => p.fail({ errCode: -2 }) }), /cancel/)
})
test('invalid signature never invokes native payment', async () => {
  await assert.rejects(context.requestVirtualPayment({ ...params, paySig: '' }, { requestVirtualPayment: () => assert.fail('must not call') }), /参数不完整/)
})
test('expired session has an actionable error', async () => {
  await assert.rejects(context.requestVirtualPayment(params, { requestVirtualPayment: p => p.fail({ errCode: -15007 }) }), /登录已过期/)
})
