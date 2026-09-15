// This client gate is only navigation guidance; the server enforces binding again.
export function enforceWechatBinding() {
  if(uni.getStorageSync('authMode')==='standalone')return false
  const wechatRequired = uni.getStorageSync('wechatBindingRequired')
  const phoneRequired = uni.getStorageSync('phoneBindingRequired')
  if (!wechatRequired && !phoneRequired) return false
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const route = page?.route || ''
  if (!route || route === 'pages/common/document') return false
  if (wechatRequired) {
    if(uni.getStorageSync('accountSessionFull')) {
      uni.removeStorageSync('wechatBindingRequired')
      if(route==='pages/account/bind')return false
      uni.navigateTo({url:'/pages/account/bind'})
      return true
    }
    if (route === 'pages/login/index') return false
    uni.reLaunch({ url: '/pages/login/index' })
  } else {
    if (!['pages/order/submit', 'pages/order/payment'].includes(route)) return false
    return enforcePhoneBinding()
  }
  return true
}

export function enforcePhoneBinding() {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (page?.route === 'pages/account/bind') return false
  if (page?.route) {
    const options = page.options || {}
    const query = Object.keys(options).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(options[key])).join('&')
    uni.setStorageSync('loginNext', '/' + page.route + (query ? '?' + query : ''))
  }
  uni.reLaunch({ url: '/pages/account/bind?requiredPhone=1' })
  return true
}
