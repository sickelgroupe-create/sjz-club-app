import { API_BASE_URL, API_ORIGIN } from './config'
import { enforceWechatBinding, enforcePhoneBinding } from './wechat-binding'

let refreshPromise = null

function currentPath() {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (!page) return '/pages/index/index'
  const options = page.options || {}
  const params = Object.keys(options).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(options[key])}`).join('&')
  return `/${page.route}${params ? '?' + params : ''}`
}

function rawRequest(options, token) {
  return new Promise((resolve, reject) => uni.request({
    url: API_BASE_URL + options.url,
    method: options.method || 'GET',
    data: options.data || {},
    header: {
      'content-type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.header || {})
    },
    timeout: options.timeout || 15000,
    success: resolve,
    fail: error => reject(Object.assign(new Error('网络连接失败，请检查网络后重试'), { cause: error }))
  }))
}

export function saveSession(data) {
  const accessToken = data.accessToken || data.token
  if (accessToken) {
    uni.setStorageSync('token', accessToken)
    uni.setStorageSync('refreshToken', data.refreshToken || '')
  }
  if (typeof data.wechatBindingRequired === 'boolean') {
    uni.setStorageSync('accountSessionFull',!data.wechatBindingRequired)
    if(data.wechatBindingRequired) uni.setStorageSync('wechatBindingRequired',true)
    else uni.removeStorageSync('wechatBindingRequired')
  } else if (typeof data.wechatBound === 'boolean') {
    if (data.wechatBound) uni.removeStorageSync('wechatBindingRequired')
    else uni.setStorageSync('wechatBindingRequired', true)
  }
  if (data.user) uni.setStorageSync('user', data.user)
  if (typeof data.phoneBound === 'boolean') {
    if (data.phoneBound) uni.removeStorageSync('phoneBindingRequired')
    else uni.setStorageSync('phoneBindingRequired', true)
  }
  if(data.authMode==='standalone') {
    uni.setStorageSync('authMode','standalone')
    uni.removeStorageSync('wechatBindingRequired')
    uni.removeStorageSync('phoneBindingRequired')
  }
  return data
}

async function refreshAccessToken() {
  const refreshToken = uni.getStorageSync('refreshToken')
  if (!refreshToken) throw new Error('登录状态已失效')
  if (!refreshPromise) {
    refreshPromise = rawRequest({ url: '/auth/refresh', method: 'POST', data: { refreshToken } }, '')
      .then(response => {
        if (response.statusCode !== 200 || response.data?.code !== 200) throw new Error(response.data?.msg || '登录状态已失效')
        return saveSession(response.data.data)
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

function redirectToLogin() {
  uni.removeStorageSync('accountSessionFull')
  uni.removeStorageSync('phoneBindingRequired')
  uni.removeStorageSync('wechatBindingRequired')
  uni.removeStorageSync('token')
  uni.removeStorageSync('refreshToken')
  uni.removeStorageSync('user')
  const path = currentPath()
  if (!path.startsWith('/pages/login/')) {
    uni.setStorageSync('loginNext', path)
    uni.navigateTo({ url: '/pages/login/index' })
  }
}

export async function request(options, retried = false) {
  const token = options.auth === false ? '' : uni.getStorageSync('token')
  let response = await rawRequest(options, token)
  if (response.data?.code === 4602) {
    uni.setStorageSync('phoneBindingRequired',true)
    enforcePhoneBinding()
    throw new Error(response.data.msg || '请先授权绑定手机号')
  }
  if (response.data?.code === 4601) {
    uni.setStorageSync('wechatBindingRequired',true)
    enforceWechatBinding()
    throw new Error(response.data.msg || '请先完成微信绑定')
  }
  if (response.statusCode === 401 || response.data?.code === 401) {
    if (!retried && options.auth !== false && !options.url.startsWith('/auth/')) {
      try { await refreshAccessToken(); return request(options, true) } catch (_) { redirectToLogin() }
    } else if (options.auth !== false) redirectToLogin()
    throw new Error(response.data?.msg || '请先登录')
  }
  if (response.statusCode < 200 || response.statusCode >= 300) throw new Error(response.data?.msg || `请求失败(${response.statusCode})`)
  if (response.data?.code !== undefined && response.data.code !== 200) throw new Error(response.data.msg || '操作失败')
  return response.data?.data !== undefined ? response.data.data : response.data
}

export function uploadFile(filePath) {
  return new Promise((resolve, reject) => uni.uploadFile({
    url: API_BASE_URL + '/files', filePath, name: 'file',
    header: { Authorization: `Bearer ${uni.getStorageSync('token') || ''}` },
    success: response => {
      try {
        const payload = JSON.parse(response.data)
        if (payload.code === 4602) { uni.setStorageSync('phoneBindingRequired',true); enforceWechatBinding(); reject(new Error(payload.msg)); return }
        if (payload.code === 4601) { uni.setStorageSync('wechatBindingRequired',true); enforceWechatBinding(); reject(new Error(payload.msg)); return }
        if (response.statusCode === 401 || payload.code === 401) { redirectToLogin(); reject(new Error(payload.msg || '请先登录')); return }
        if (payload.code !== 200) { reject(new Error(payload.msg || '上传失败')); return }
        resolve(resolveAssetUrl(payload.data.url))
      } catch (error) { reject(error) }
    }, fail: reject
  }))
}

export function resolveAssetUrl(url) {
  if (!url || /^(https?:|data:|wxfile:|blob:)/.test(url)) return url
  return url.startsWith('/profile/') ? API_ORIGIN + url : url
}


export function uploadVoiceFile(filePath, seconds) {
  return new Promise((resolve,reject)=>uni.uploadFile({
    url:API_BASE_URL+'/voice-files',filePath,name:'file',formData:{seconds:String(seconds)},
    header:{Authorization:`Bearer ${uni.getStorageSync('token')||''}`},
    success:response=>{try{const payload=JSON.parse(response.data);if(payload.code===4602){uni.setStorageSync('phoneBindingRequired',true);enforceWechatBinding();throw new Error(payload.msg)}if(payload.code===4601){uni.setStorageSync('wechatBindingRequired',true);enforceWechatBinding();throw new Error(payload.msg)}if(response.statusCode===401){redirectToLogin();throw new Error('登录已失效，请重新登录后录制')}
      if(response.statusCode<200||response.statusCode>=300||payload.code!==200)throw new Error(payload.msg||'录音上传失败');
      resolve({...payload.data,url:resolveAssetUrl(payload.data.url)})
    }catch(e){reject(e)}},fail:()=>reject(new Error('录音上传失败，请检查网络后重新录制'))
  }))
}
