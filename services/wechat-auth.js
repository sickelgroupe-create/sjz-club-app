export function wechatCode() {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    uni.login({ provider: 'weixin', success: result => result.code ? resolve(result.code) : reject(new Error('微信未返回登录凭证')), fail: () => reject(new Error('微信授权失败，请重试')) })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new Error('请在微信小程序中使用微信登录'))
    // #endif
  })
}
