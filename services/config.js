export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/app'
export const API_ORIGIN = API_BASE_URL.replace(/\/app\/?$/, '')
export const USE_MOCK = false
export const RUNTIME_MODE = 'live'
export const ENDPOINTS = {
  phoneCode: '/auth/phone-code', phoneCodeLogin: '/auth/phone-code-login', phoneRegister: '/auth/phone-register', passwordLogin: '/auth/login', wechatLogin: '/auth/wechat-login', refresh: '/auth/refresh', logout: '/auth/logout',
  home: '/public/home', promotions: '/public/promotions', articles: '/public/articles', documents: '/public/documents',
  products: '/public/products', players: '/public/players', ranking: '/public/ranking', announcements: '/public/announcements', customerService: '/public/customer-service',
  orders: '/orders', profile: '/me', wallet: '/wallet', messages: '/messages',
  favorites: '/favorites', follows: '/follows', coupons: '/coupons', applications: '/applications',
  identity: '/identity', notifications: '/notification-settings', withdrawals: '/withdrawals', teenMode: '/teen-mode', recharges: '/recharges', files: '/files'
}
