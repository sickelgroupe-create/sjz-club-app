<script>
import {api} from './services/api'
import {enforceWechatBinding} from './services/wechat-binding'
export default {
  globalData: { noticeTriggerToken: '', noticeConsumedToken: '' },
  onLaunch() {
    this.globalData.noticeTriggerToken = `launch-${Date.now()}`
    this.globalData.noticeConsumedToken = ''
    if(api.sandbox){uni.setStorageSync('authMode','standalone');uni.removeStorageSync('wechatBindingRequired');uni.removeStorageSync('phoneBindingRequired')}
    const token=uni.getStorageSync('token')
    if(token)api.getBindings().then(state=>{
      if(uni.getStorageSync('token')!==token)return
      if(state.authMode==='standalone'){uni.setStorageSync('authMode','standalone');return}
      if(state.phoneBound===false)uni.setStorageSync('phoneBindingRequired',true)
      else if(state.phoneBound===true)uni.removeStorageSync('phoneBindingRequired')
      if(state.wechatBound!==true){uni.setStorageSync('wechatBindingRequired',true);enforceWechatBinding()}
      else enforceWechatBinding()
    }).catch(()=>{})
  }
}
</script>

<style lang="scss">
page { background: #f4f6f9; color: #171b24; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; }
view, text, image, input, textarea, scroll-view, swiper, swiper-item, navigator, button, picker, switch { box-sizing: border-box; }
button { margin: 0; padding: 0; border: 0; background: transparent; font: inherit; }
button::after { border: 0; }
.app-page {
  --brand: #556ee6; --brand-deep: #29428f; --brand-soft: #edf1ff;
  --primary: #f0445a; --primary-dark: #d9364d; --primary-soft: #fff0f3;
  --accent: #ff8a2a; --accent-soft: #fff2df; --gold: #e6a225; --success: #24c86b; --warning: #ff9a31; --danger: #f0445a;
  --bg: #f4f6f9; --surface: #fff; --surface-soft: #f8f9fb; --surface-raised: #fff;
  --text: #171b24; --text-secondary: #505866; --muted: #929aa7; --line: #eceff4;
  --page-x: 28rpx; --section-gap: 22rpx; --card-radius: 24rpx; --button-radius: 44rpx;
  --shadow-card: 0 10rpx 34rpx rgba(41, 55, 90, .06); --shadow-button: 0 10rpx 24rpx rgba(240, 68, 90, .2);
  --tab-height: 108rpx; --icon-size: 42rpx; --icon-filter: none; --tab-surface: rgba(255,255,255,.97);
  min-height: 100vh; padding-bottom: calc(132rpx + env(safe-area-inset-bottom)); background: var(--bg); color: var(--text);
}
.app-page.dark {
  --bg: #0e1117; --surface: #191d25; --surface-soft: #222733; --surface-raised: #20252f;
  --text: #f6f7fa; --text-secondary: #c8ccd4; --muted: #8e96a4; --line: #2b313d;
  --brand-soft: #242c54; --primary-soft: #3a2028; --accent-soft: #38291c; --shadow-card: 0 12rpx 40rpx rgba(0,0,0,.2);
  --icon-filter: brightness(0) invert(1); --tab-surface: rgba(8,10,15,.97);
}
.card, .ui-card { margin: var(--section-gap) var(--page-x); padding: 28rpx; border: 1rpx solid rgba(24,35,58,.025); border-radius: var(--card-radius); background: var(--surface); box-shadow: var(--shadow-card); }
.section-title, .ui-section-title { color: var(--text); font-size: 30rpx; font-weight: 700; line-height: 1.3; }
.section-subtitle { color: var(--muted); font-size: 23rpx; }
.muted { color: var(--muted); }
.price { color: var(--primary); font-weight: 800; }
.old-price { margin-left: 12rpx; color: var(--muted); text-decoration: line-through; font-size: 24rpx; }
.primary-btn, .ui-button { display: flex; align-items: center; justify-content: center; height: 88rpx; border-radius: var(--button-radius); background: var(--primary); color: #fff; box-shadow: var(--shadow-button); font-size: 29rpx; font-weight: 600; line-height: 1; }
.ui-button.secondary { border: 2rpx solid var(--primary); background: var(--surface); color: var(--primary); box-shadow: none; }
.ui-button.gold { background: linear-gradient(135deg,#f7b53b,#ff7f23); box-shadow: 0 10rpx 24rpx rgba(255,138,42,.24); }
.ui-button.disabled, .primary-btn.disabled { opacity: .48; box-shadow: none; }
.tap-active { opacity: .72; transform: scale(.985); }
.page-state { min-height: 520rpx; padding: 120rpx 50rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--muted); text-align: center; }
.form-card { margin: var(--section-gap) var(--page-x); padding: 0 28rpx; border: 1rpx solid rgba(24,35,58,.025); border-radius: var(--card-radius); background: var(--surface); box-shadow: var(--shadow-card); }
.form-row { display: flex; align-items: center; min-height: 104rpx; border-bottom: 1rpx solid var(--line); }
.form-row:last-child { border-bottom: 0; }
.form-label { width: 190rpx; color: var(--text-secondary); font-size: 27rpx; }
.form-input { flex: 1; color: var(--text); font-size: 27rpx; text-align: right; }
.ui-list { margin: var(--section-gap) var(--page-x); overflow: hidden; border-radius: var(--card-radius); background: var(--surface); box-shadow: var(--shadow-card); }
.ui-list-row { min-height: 104rpx; padding: 0 28rpx; display: flex; align-items: center; gap: 20rpx; border-bottom: 1rpx solid var(--line); }
.ui-list-row:last-child { border-bottom: 0; }
.ui-pill { display: inline-flex; align-items: center; justify-content: center; min-height: 38rpx; padding: 0 16rpx; border-radius: 20rpx; background: var(--brand-soft); color: var(--brand); font-size: 21rpx; }
.ui-sheet-mask { position: fixed; z-index: 200; top: 0; right: 0; bottom: 0; left: 0; display: flex; align-items: flex-end; background: rgba(8,12,24,.54); }
.ui-sheet { width: 100%; padding: 32rpx var(--page-x) calc(32rpx + env(safe-area-inset-bottom)); border-radius: 32rpx 32rpx 0 0; background: var(--surface); box-shadow: 0 -20rpx 60rpx rgba(7,13,30,.14); }
.safe-bottom { height: calc(20rpx + env(safe-area-inset-bottom)); }
.skeleton { position: relative; overflow: hidden; border-radius: 12rpx; background: var(--surface-soft); }
.skeleton::after { content: ''; position: absolute; top: 0; bottom: 0; left: -70%; width: 70%; background: linear-gradient(90deg,transparent,rgba(255,255,255,.72),transparent); animation: skeleton-move 1.25s infinite; }
@keyframes skeleton-move { to { left: 120%; } }
</style>
