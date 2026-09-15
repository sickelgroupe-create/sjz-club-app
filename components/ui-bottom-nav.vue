<template>
  <view class="bottom-nav">
    <navigator v-for="item in items" :key="item.key" :url="item.url" open-type="reLaunch" hover-class="tap-active" :class="['nav-item', 'nav-' + item.key, { active: active === item.key }]" @tap="beforeNavigate(item)">
      <ui-icon :name="active === item.key && item.key === 'profile' ? 'user-active' : item.icon" :size="46" :tone="active === item.key ? 'primary' : 'default'" />
      <view v-if="item.key==='messages'&&unread>0" class="nav-badge">{{unread>99?'99+':unread}}</view>
      <text class="nav-text">{{ item.label }}</text>
    </navigator>
  </view>
</template>

<script>
import { api } from '@/services/api'
export default {
  props: { active: { type: String, default: 'home' } },
  data() {
    return { unread: 0, items: [
      { key: 'home', label: '店铺', icon: 'home', url: '/pages/index/index' },
      { key: 'zones', label: '专区', icon: 'gamepad', url: '/pages/zones/index' },
      { key: 'players', label: '挑人', icon: 'user-search', url: '/pages/players/index' },
      { key: 'messages', label: '消息', icon: 'message-circle', url: '/pages/messages/index' },
      { key: 'profile', label: '我的', icon: 'user', url: '/pages/profile/index' }
    ] }
  },
  mounted(){this.refreshUnread();uni.$on('club-messages-changed',this.refreshUnread)},
  beforeUnmount(){uni.$off('club-messages-changed',this.refreshUnread)},
  methods:{
    refreshUnread(){if(!uni.getStorageSync('token')){this.unread=0;return}api.getUnreadCount().then(r=>{this.unread=Number(r.count||0)}).catch(()=>{})},
    beforeNavigate(item){
      if(item.key!=='home'||this.active==='home')return
      const app=getApp()
      if(!app.globalData)app.globalData={}
      app.globalData.noticeTriggerToken=`tab-home-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    }
  }
}
</script>

<style scoped>
.bottom-nav { position: fixed; z-index: 80; left: 0; right: 0; bottom: 0; height: calc(var(--tab-height) + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom); display: flex; background: var(--tab-surface); border-top: 1rpx solid var(--line); box-shadow: 0 -8rpx 30rpx rgba(33,47,78,.045); }
.nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--muted); }
.nav-text { margin-top: 7rpx; font-size: 22rpx; }
.active { color: var(--primary); }
.nav-item{position:relative}.nav-badge{position:absolute;top:8rpx;left:calc(50% + 12rpx);min-width:28rpx;height:28rpx;padding:0 6rpx;display:flex;align-items:center;justify-content:center;border:3rpx solid var(--tab-surface);border-radius:18rpx;background:var(--primary);color:#fff;font-size:17rpx;line-height:28rpx}
</style>
