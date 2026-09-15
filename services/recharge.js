import { api } from './api'

export async function payRecharge(id) {
  const prepay = await api.prepayRecharge(id)
  if (prepay.paid) return { success: true, message: '充值成功' }
  if (prepay.expired) return { success: false, message: '充值订单已超时，请重新选择金额创建充值单' }
  let cancelled = false
  let paymentError = ''
  try {
    await new Promise((resolve, reject) => uni.requestPayment({ ...prepay.requestPayment, success: resolve, fail: reject }))
  } catch (error) {
    paymentError = error.errMsg || error.message || '未完成微信支付'
    cancelled = paymentError.includes('cancel')
  }
  // Cancellation can race the notification; only the server decides the outcome.
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const result = await api.syncWechatRecharge(id)
      if (result.order?.status === 'success') return { success: true, message: '充值成功' }
      if (cancelled) return { success: false, message: '已取消微信支付，可在充值记录中继续支付' }
      if (['CLOSED', 'REVOKED', 'PAYERROR'].includes(result.tradeState)) return { success: false, message: '该笔支付未完成，请查看充值详情' }
    } catch (_) { /* Notifications can still complete the order. */ }
    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 800))
  }
  return { success: false, message: cancelled ? '已取消微信支付' : paymentError || '支付结果确认中，请稍后查看充值记录，请勿重复充值' }
}
