import { ENDPOINTS } from './config'
import { wechatCode } from './wechat-auth'
import { request, saveSession, uploadFile, uploadVoiceFile, resolveAssetUrl } from './request'

const withAssets = value => {
  if (Array.isArray(value)) return value.map(withAssets)
  if (!value || typeof value !== 'object') return value
  const next = { ...value }
  for (const key of Object.keys(next)) {
    if (['image', 'avatar', 'avatarImage', 'logo', 'imageUrl', 'voiceUrl', 'audioUrl', 'qrImage'].includes(key)) next[key] = resolveAssetUrl(next[key])
    else if (typeof next[key] === 'object') next[key] = withAssets(next[key])
  }
  return next
}

const queryString = params => Object.keys(params || {}).filter(k => params[k] !== '' && params[k] !== undefined && params[k] !== null)
  .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')
// Public endpoints still receive an existing access token so server-side teen
// content rules cannot be bypassed by calling the URL directly. Anonymous users
// continue to work because request() only sends the header when a token exists.
const get = (url, params = {}, auth = 'optional') => {
  const query = queryString(params)
  return request({ url: `${url}${query ? '?' + query : ''}`, auth })
}
const idempotencyKey = () => `mp-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`

export const api = {
  sandbox: false,
  async getHome() { return withAssets(await get(ENDPOINTS.home)) },
  async getPromotions(scene) { return withAssets(await get(ENDPOINTS.promotions, { scene })) },
  async getArticle(id) { return withAssets(await get(`${ENDPOINTS.articles}/${id}`)) },
  getDocument(type) { return get(`${ENDPOINTS.documents}/${type}`) },
  async getProductPage(params = {}) { const data = await get(ENDPOINTS.products, params); return { ...data, items: withAssets(data.items || []) } },
  async getProducts(params = {}) { return (await this.getProductPage(params)).items },
  async getProduct(id) { return withAssets(await get(`${ENDPOINTS.products}/${id}`)) },
  async getPlayerPage(params = {}) {
    const data = await get(ENDPOINTS.players, params)
    return { ...data, items: withAssets(data.items || []) }
  },
  async getPlayers(params = {}) { return (await this.getPlayerPage(params)).items },
  async getPlayerOffers(id) { return withAssets(await get(`${ENDPOINTS.players}/${id}/services`)) },
  getRanking() { return get(ENDPOINTS.ranking) },
  getAnnouncement(id) { return get(`${ENDPOINTS.announcements}/${id}`).then(withAssets) },
  getCustomerService() { return get(ENDPOINTS.customerService).then(withAssets) },
  async phoneRegister(payload) { const session=saveSession(await request({ url: ENDPOINTS.phoneRegister, method: 'POST', data: payload, auth: false })); if(session.authMode!=='standalone')uni.setStorageSync('wechatBindingRequired',true); return session },
  async passwordLogin(payload) { return saveSession(await request({ url: ENDPOINTS.passwordLogin, method: 'POST', data: payload, auth: false })) },
  async wechatLogin(payload) { return saveSession(await request({ url: ENDPOINTS.wechatLogin, method: 'POST', data: payload, auth: false })) },
  getBindings() { return get('/auth/bindings', {}, true) },
  async bindPhone(phoneCode) { return saveSession(await request({url:'/auth/bind-phone',method:'POST',data:{phoneCode}})) },
  async bindWechat(code) { const result=await request({ url: '/auth/bind-wechat', method: 'POST', data: { code } }); if(result.accessToken)saveSession(result); return result },
  async resetPassword(data) { return saveSession(await request({ url: '/auth/reset-password', method: 'POST', data })) },
  async logout() { try { await request({ url: ENDPOINTS.logout, method: 'POST' }) } finally { uni.removeStorageSync('token'); uni.removeStorageSync('refreshToken'); uni.removeStorageSync('user'); uni.removeStorageSync('wechatBindingRequired'); uni.removeStorageSync('phoneBindingRequired') } },
  async getProfile() { const user = withAssets(await get(ENDPOINTS.profile, {}, true)); uni.setStorageSync('user', user); return user },
  async updateProfile(payload) { const user = withAssets(await request({ url: ENDPOINTS.profile, method: 'PUT', data: payload })); uni.setStorageSync('user', user); return user },
  uploadImage: uploadFile,
  uploadVoice: uploadVoiceFile,
  getRelationState(productId) { return get(`/relations/products/${productId}`, {}, true) },
  setFavorite(productId, target) { return request({ url: `${ENDPOINTS.favorites}/${productId}`, method: target ? 'PUT' : 'DELETE' }) },
  getFavorites() { return get(ENDPOINTS.favorites, {}, true).then(withAssets) },
  setFollow(shopId, target) { return request({ url: `${ENDPOINTS.follows}/${shopId}`, method: target ? 'PUT' : 'DELETE' }) },
  getFollows() { return get(ENDPOINTS.follows, {}, true).then(withAssets) },
  createPoster(productId) { return request({ url: `/posters/${productId}`, method: 'POST' }).then(withAssets) },
  getPosters() { return get('/posters', {}, true).then(withAssets) },
  getAvailableCoupons() { return get(ENDPOINTS.coupons + "/available", {}, true) },
  claimCoupon(id) { return request({url: ENDPOINTS.coupons + "/" + id + "/claim", method:'POST', data:{}, auth:true}) },
  getCoupons() { return get(ENDPOINTS.coupons, {}, true) },
  newRequestId(prefix = 'mp') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}` },
  quoteOrder(payload) { return request({ url: `${ENDPOINTS.orders}/quote`, method: 'POST', data: payload }) },
  createOrder(payload, clientRequestId) { return request({ url: ENDPOINTS.orders, method: 'POST', data: { ...payload, clientRequestId: clientRequestId || idempotencyKey() } }) },
  getOrders(status = 'all') { return get(ENDPOINTS.orders, { status }, true).then(withAssets) },
  getOrder(id) { return get(`${ENDPOINTS.orders}/${id}`, {}, true).then(withAssets) },
  payOrder(orderId, method = 'wechat', outcome = 'success', key) {
    if (method === 'wechat') return wechatCode().then(code => request({ url: `${ENDPOINTS.orders}/${orderId}/wechat-prepay`, method: 'POST', data: { idempotencyKey: key || idempotencyKey(), wechatCode: code } }))
    return request({ url: `${ENDPOINTS.orders}/${orderId}/balance-pay`, method: 'POST', data: { method, outcome, idempotencyKey: key || idempotencyKey() } })
  },
  syncWechatPayment(orderId) { return request({ url: `${ENDPOINTS.orders}/${orderId}/wechat-sync`, method: 'POST' }) },
  cancelOrder(orderId) { return request({ url: `${ENDPOINTS.orders}/${orderId}/cancel`, method: 'POST' }) },
  applyAfterSale(orderId, data, requestId) { return request({ url: `${ENDPOINTS.orders}/${orderId}/aftersales`, method: 'POST', data: { ...data, requestId: requestId || idempotencyKey() } }) },
  getAfterSales() { return get('/aftersales', {}, true) },
  getAfterSale(id) { return get(`/aftersales/${id}`, {}, true).then(withAssets) },
  confirmOrder(orderId, key) { return request({ url: `${ENDPOINTS.orders}/${orderId}/confirm`, method: 'POST', data: { idempotencyKey: key || idempotencyKey() } }) },
  reviewOrder(orderId, data) { return request({ url: `${ENDPOINTS.orders}/${orderId}/reviews`, method: 'POST', data }) },
  getMessages() { return get(ENDPOINTS.messages, {}, true) },
  readMessage(id) { return request({ url: `${ENDPOINTS.messages}/${id}/read`, method: 'PUT' }) },
  readAllMessages() { return request({ url: `${ENDPOINTS.messages}/read-all`, method: 'PUT' }) },
  getUnreadCount() { return get(`${ENDPOINTS.messages}/unread-count`, {}, true) },
  getWallet() { return get(ENDPOINTS.wallet, {}, true) },
  getTeenMode() { return get(ENDPOINTS.teenMode, {}, true) },
  enableTeenMode(password) { return request({ url: ENDPOINTS.teenMode, method: 'PUT', data: { password } }) },
  disableTeenMode(password) { return request({ url: `${ENDPOINTS.teenMode}/disable`, method: 'POST', data: { password } }) },
  getRechargeConfig() { return get(`${ENDPOINTS.recharges}/config`, {}, true) },
  createRecharge(data, key) { return request({ url: ENDPOINTS.recharges, method: 'POST', data: { ...data, idempotencyKey: key || idempotencyKey() } }) },
  getRecharges() { return get(ENDPOINTS.recharges, {}, true) },
  getRecharge(id) { return get(`${ENDPOINTS.recharges}/${id}`, {}, true) },
  prepayRecharge(id, key) { return request({ url: `${ENDPOINTS.recharges}/${id}/wechat-prepay`, method: 'POST', data: { idempotencyKey: key || idempotencyKey() } }) },
  syncWechatRecharge(id) { return request({ url: `${ENDPOINTS.recharges}/${id}/wechat-sync`, method: 'POST' }) },
  withdraw(amount, key) { return request({ url: ENDPOINTS.withdrawals, method: 'POST', data: { amount, idempotencyKey: key || idempotencyKey() } }) },
  getWithdrawals() { return get(ENDPOINTS.withdrawals, {}, true) },
  getWithdrawal(id) { return get(`${ENDPOINTS.withdrawals}/${id}`, {}, true) },
  submitIdentity(data) { return request({ url: ENDPOINTS.identity, method: 'POST', data }) },
  getIdentity() { return get(ENDPOINTS.identity, {}, true) },
  getNotificationSettings() { return get(ENDPOINTS.notifications, {}, true) },
  updateNotificationSettings(data) { return request({ url: ENDPOINTS.notifications, method: 'PUT', data }) },
  submitApplication(data) { return request({ url: ENDPOINTS.applications, method: 'POST', data }) },
  getApplications(type = '') { return get(ENDPOINTS.applications, { type }, true) },
  getApplication(id) { return get(`${ENDPOINTS.applications}/${id}`, {}, true) },
  getWorkbench() { return get('/workbench', {}, true).then(withAssets) },
  getWorkbenchMetric(type, page = 1) { return get('/workbench/metrics/' + type, { page }, true).then(withAssets) },
  getWorkbenchOrders(status = 'all') { return get('/workbench/orders', { status }, true).then(withAssets) },
  getWorkbenchOrder(id) { return get(`/workbench/orders/${id}`, {}, true).then(withAssets) },
  getWorkbenchAfterSale(id) { return get(`/workbench/aftersales/${id}`, {}, true).then(withAssets) },
  workbenchAfterSaleAction(id, action, note, key) { return request({ url: `/workbench/aftersales/${id}/actions`, method: 'POST', data: { action, note, idempotencyKey: key || idempotencyKey() } }) },
  workbenchOrderAction(orderId, action, key) { return request({ url: `/workbench/orders/${orderId}/actions`, method: 'POST', data: { action, idempotencyKey: key || idempotencyKey() } }) },
  updateAvailability(status) { return request({ url: '/workbench/availability', method: 'PUT', data: { status } }) },
  getWorkbenchProfile() { return get('/workbench/profile', {}, true).then(withAssets) },
  saveWorkbenchProfile(data) { return request({ url: '/workbench/profile', method: 'PUT', data }).then(withAssets) },
}
