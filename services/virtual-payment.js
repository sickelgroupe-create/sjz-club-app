// A successful native dialog is not proof of settlement: callers must query the backend afterwards.
export function requestVirtualPayment(parameters, nativeApi = typeof wx === 'undefined' ? null : wx) {
  return new Promise((resolve, reject) => {
    if (!nativeApi || typeof nativeApi.requestVirtualPayment !== 'function') {
      reject(new Error('当前微信版本不支持虚拟支付，请更新微信后重试'))
      return
    }
    if (!parameters || parameters.mode !== 'short_series_goods' ||
        typeof parameters.signData !== 'string' || !/^[a-f0-9]{64}$/.test(parameters.paySig || '') ||
        !/^[a-f0-9]{64}$/.test(parameters.signature || '')) {
      reject(new Error('支付参数不完整，请重新发起支付'))
      return
    }
    const { mode, signData, paySig, signature } = parameters
    nativeApi.requestVirtualPayment({
      mode, signData, paySig, signature,
      success: resolve,
      fail: result => {
        const code = Number(result && result.errCode)
        if (code === -2 || /cancel/i.test(result && result.errMsg || '')) {
          const error = new Error('cancel')
          error.errCode = -2
          reject(error)
          return
        }
        const messages = {
          '-15007': '微信登录已过期，请重新登录后支付',
          '-15010': '商品支付配置尚未生效，请稍后重试',
          '-15011': '支付环境配置不正确，请联系客服',
          '-15014': '商品支付配置正在生效，请稍后重试',
          '-15020': '操作过快，请稍后查询订单状态'
        }
        reject(new Error(messages[String(code)] || '虚拟支付未完成，请查询订单状态后重试'))
      }
    })
  })
}
