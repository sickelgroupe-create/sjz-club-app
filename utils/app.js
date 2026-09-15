import generatedPages from '@/generated/page-routes.json'

export const routes = { home: '/pages/index/index', zones: '/pages/zones/index', players: '/pages/players/index', messages: '/pages/messages/index', profile: '/pages/profile/index' }
export function go(url, mode = 'navigateTo') { if (url) uni[mode]({ url }) }
export function isDark() { return uni.getStorageSync('theme') === 'dark' }
export function requireLogin(next) {
  if (uni.getStorageSync('token')) return true
  uni.setStorageSync('loginNext', next || '')
  go('/pages/login/index')
  return false
}
const knownPages = new Set(generatedPages)
export function validMiniProgramUrl(value) {
  const url = String(value || '')
  return url.startsWith('/pages/') && knownPages.has(url.split('?')[0])
}
