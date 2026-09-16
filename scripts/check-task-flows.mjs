import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const errors = []
const requireText = (relative, snippets) => {
  const source = read(relative)
  for (const snippet of snippets) if (!source.includes(snippet)) errors.push(`${relative} 缺少：${snippet}`)
  return source
}

const pages = JSON.parse(read('pages.json')).pages.map(item => `/${item.path}`)
for (const route of ['/pages/order/payment', '/pages/order/payment-result', '/pages/order/detail', '/pages/service/customer', '/pages/settings/teen', '/pages/login/index']) {
  if (!pages.includes(route)) errors.push(`pages.json 未注册：${route}`)
}

requireText('App.vue', ['noticeTriggerToken', '`launch-${Date.now()}`'])
const bottom = requireText('components/ui-bottom-nav.vue', ["item.key!=='home'||this.active==='home'", 'tab-home-'])
if (bottom.includes("item.key==='home'&&this.active==='home'")) errors.push('首页重复点击不应产生公告触发令牌')
const home = requireText('pages/index/index.vue', ['noticeConsumedToken===token', 'global.noticeConsumedToken=token', 'class="operator-avatar"', 'operatorAvatar(item,index)', '/static/images/operators/operator-'])
if (/onHide\s*\([^)]*\)\s*\{[^}]*noticeConsumedToken/s.test(home)) errors.push('普通页面返回首页不得重置公告消费状态')
if (/<ui-icon\s+v-else[^>]*:name="item\.icon"/.test(home)) errors.push('首页功能入口仍在使用线性图标')

for (let index = 1; index <= 10; index++) {
  const name = `static/images/operators/operator-${String(index).padStart(2, '0')}.webp`
  const asset = path.join(root, name)
  if (!fs.existsSync(asset) || fs.statSync(asset).size < 4096) errors.push(`干员头像缺失或文件异常：${name}`)
}

requireText('pages/order/submit.vue', ["!/^1[3-9]\\d{9}$/.test(phone)", "'/pages/order/payment?id='+order.id", '联系电话（必填）'])
requireText('pages/order/payment.vue', ['请在30分钟内完成支付', '微信支付', '余额支付', 'remainingSeconds', 'api.payOrder(this.orderId,method', 'uni.requestPayment', 'api.syncWechatPayment'])
requireText('pages/order/payment-result.vue', ['重新支付', '查看订单', "this.order.cancelReason==='payment_timeout'?'expired':'cancelled'", "this.status='success'", 'decodeURIComponent(decoded)', "'/pages/order/detail?id='+this.orderId"])
requireText('pages/order/list.vue', ['@select="detail(item)"', "'/pages/order/detail?id='+item.id", '@tap.stop="pay(item)"'])
requireText('pages/order/detail.vue', ['订单详情', '订单流转', 'timelineItems', 'api.getOrder(this.orderId)', 'this.order?.logs'])

const profile = read('pages/profile/index.vue')
if (profile.includes('ranking-card') || profile.includes('消费排行榜')) errors.push('个人中心仍保留消费排行榜入口')

const teen = requireText('pages/settings/teen.vue', ['password.length===index-1', 'class="pin-caret"', "if(value.length===4)this.enable()", "@blur=\"pinFocused=false\""])
const caretCount = (teen.match(/class="pin-caret"/g) || []).length
if (caretCount !== 1) errors.push(`青少年页面应只有一个光标渲染节点，实际 ${caretCount}`)

const login = requireText('pages/login/index.vue', ["setMode('password')", "setMode('register')", 'api.phoneRegister', 'api.passwordLogin', 'api.bindWechat(await wechatCode())'])
requireText('services/wechat-auth.js', ["provider: 'weixin'", 'uni.login'])
if (/api\.phoneCodeLogin|requestPhoneCode|模拟验证码|验证码登录/.test(login)) errors.push('登录页不应保留验证码或模拟登录入口')
const recharge = requireText('pages/wallet/recharge.vue', ['微信支付充值', 'payRecharge(', 'api.createRecharge'])
requireText('services/recharge.js', ['uni.requestPayment', 'api.syncWechatRecharge', "result.order?.status === 'success'"])
if (/mockRecharge/.test(recharge)) errors.push('充值中心不能使用本地假充值数据')
requireText('services/config.js', ['USE_MOCK = false', "RUNTIME_MODE = 'live'"])
if (/api\.sandbox|mockRecharge/.test(recharge)) errors.push('充值页面不能依赖已退役的模拟环境')
requireText('pages/account/bind.vue', ['oldPassword', 'confirmPassword', 'wechatCode'])
const floatingCustomer = requireText('components/ui-floating-actions.vue', ['service.enabled && service.avatar', '/pages/service/customer', 'api.getCustomerService()'])
const customerPage = requireText('pages/service/customer.vue', ['service.enabled', '客服暂未配置', 'api.getCustomerService()'])
if (floatingCustomer.includes("avatar:'/static/images/customer-cartoon.png'")) errors.push('悬浮客服仍把头像写死在前端')
if (customerPage.includes("avatar:'/static/images/customer-cartoon.png'")) errors.push('客服页仍把头像写死在前端')

const allSource = [
  ...fs.readdirSync(path.join(root, 'pages'), { recursive: true, encoding: 'utf8' })
    .filter(name => name.endsWith('.vue')).map(name => read(path.join('pages', name))),
  read('components/ui-floating-actions.vue'), read('services/config.js')
].join('\n')
if (/自豪电竞俱乐部|自豪电竞/.test(allSource)) errors.push('前端源文件仍包含旧品牌名称')

const customerAsset = path.join(root, 'static/images/customer-cartoon.png')
if (!fs.existsSync(customerAsset) || fs.statSync(customerAsset).size < 1024) errors.push('卡通客服头像缺失或文件异常')

console.log(JSON.stringify({ passed: errors.length === 0, checks: 13, registeredPages: pages.length, errors }, null, 2))
if (errors.length) process.exit(1)
