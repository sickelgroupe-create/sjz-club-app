<template>
  <view :class="['app-page','profile-page',{dark}]">
    <view class="profile-hero" :style="{ paddingTop: heroTop + 'px' }">
      <image class="profile-bg" :src="profileBackground" mode="aspectFill" />
      <view v-if="loggedIn" class="profile-user"><ui-user-card :avatar="profile.avatar" :name="user.nickname" badge="OD" :uid="user.id" :experience="user.experience" :gender="user.gender" :level="user.level" :personality="personality" @avatar-tap="editProfile" /></view>
      <view v-else class="guest-card">
        <view class="guest-avatar"><ui-icon name="user" :size="68" tone="muted" /></view>
        <view class="guest-copy"><text class="guest-title">登录后查看个人中心</text><text>订单、钱包和收藏数据会在这里展示</text></view>
        <navigator class="guest-login" url="/pages/login/index" hover-class="tap-active">立即登录</navigator>
      </view>
    </view>
    <view class="profile-content">
      <view class="orders-card">
        <view class="card-head"><text class="section-title">陪玩订单</text><navigator url="/pages/order/list?status=all" hover-class="tap-active"><text>全部</text><ui-icon name="chevron-right" :size="26"/></navigator></view>
        <view class="order-shortcuts">
          <navigator v-for="item in orderItems" :key="item.key" :url="'/pages/order/list?status=' + item.key" hover-class="tap-active">
            <view :class="['order-icon',item.tone]"><ui-icon :name="item.icon" :size="40"/></view><text>{{item.label}}</text>
          </navigator>
        </view>
      </view>
      <view class="menu-card"><ui-icon-grid :items="menu" /></view>
    </view>
    <ui-bottom-nav active="profile" />
  </view>
</template>
<script>
import { api } from '@/services/api'
import { isDark } from '@/utils/app'
export default {
  data() { return { dark:false,loggedIn:false,user:{nickname:'',id:'',experience:0,gender:'',level:''},profile:{avatar:''},personality:'',heroTop:28,profileBackground:'/static/images/profile-space-v2.jpg',
    orderItems:[{key:'unpaid',label:'待付款',icon:'wallet',tone:'green'},{key:'pending',label:'待接单',icon:'receipt-clock',tone:'orange'},{key:'accepted',label:'已接单',icon:'clipboard-check',tone:'blue'},{key:'review',label:'待评论',icon:'message-circle',tone:'green'}],
    menu:[{label:'优惠券',icon:'coupon',url:'/pages/common/collection?type=coupons'},{label:'打手入驻',icon:'user-plus',url:'/pages/apply/index?type=player'},{label:'收藏商品',icon:'heart',url:'/pages/common/collection?type=favorites'},{label:'我的钱包',icon:'wallet',url:'/pages/wallet/index'},{label:'我的售后',icon:'receipt-clock',url:'/pages/aftersale/list'},{label:'通知设置',icon:'bell',url:'/pages/settings/notifications'},{label:'关于我们',icon:'info',url:'/pages/common/document?type=about'}] } },
  onShow(){const system=uni.getSystemInfoSync();this.heroTop=(system.statusBarHeight||20)+58;this.dark=isDark();this.loggedIn=!!uni.getStorageSync('token');const cached=uni.getStorageSync('user')||{};this.user=cached;this.profile=cached;const p=uni.getStorageSync('preferences')||{};this.personality=p.personality?p.personality.toUpperCase()+'人认证':'个人认证';if(this.loggedIn)api.getProfile().then(user=>{this.user=user;this.profile=user;if(user.userType==='player')this.menu=this.menu.map(item=>item.label==='打手入驻'?{...item,label:'陪玩工作台',url:'/pages/workbench/index'}:item);if(user.userType==='merchant')this.menu=this.menu.map(item=>item.label==='商家入驻'?{...item,label:'商家工作台',url:'/pages/workbench/index'}:item)}).catch(()=>{})},
  methods:{editProfile(){if(this.loggedIn)uni.navigateTo({url:'/pages/profile/edit'})}}
}
</script>
<style scoped>
.profile-page{padding-bottom:calc(128rpx + env(safe-area-inset-bottom));background:#f4f5f7}.profile-hero{position:relative;min-height:455rpx;padding:0 32rpx 68rpx;display:flex;align-items:flex-end;overflow:hidden;background:linear-gradient(150deg,#263e83,#8a7cd7)}.profile-bg{position:absolute;z-index:0;top:0;right:0;bottom:0;left:0;width:100%;height:100%}.profile-hero ui-user-card,.guest-card{position:relative;z-index:1}.guest-card{width:100%;display:flex;align-items:center;gap:18rpx;color:#fff}.guest-avatar{width:112rpx;height:112rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.88)}.guest-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:8rpx;font-size:21rpx}.guest-title{font-size:28rpx;font-weight:700}.guest-login{padding:14rpx 22rpx;border-radius:30rpx;background:rgba(255,255,255,.2);color:#fff;font-size:23rpx}.profile-content{position:relative;margin-top:-42rpx;padding:0 28rpx 30rpx}.orders-card,.menu-card{padding:26rpx;border-radius:24rpx;background:#fff;box-shadow:0 10rpx 34rpx rgba(41,55,90,.05)}.menu-card{margin-top:20rpx}.card-head{display:flex;align-items:center;justify-content:space-between}.card-head navigator{display:flex;align-items:center;color:var(--muted);font-size:23rpx}.order-shortcuts{display:grid;grid-template-columns:repeat(4,1fr);margin-top:28rpx}.order-shortcuts navigator{display:flex;flex-direction:column;align-items:center;gap:12rpx;color:var(--text);font-size:23rpx}.order-icon{width:74rpx;height:74rpx;display:flex;align-items:center;justify-content:center;border-radius:50%}.order-icon.green{background:#e8f9ee}.order-icon.orange{background:#fff0e6}.order-icon.blue{background:#ebf0ff}.menu-card{padding:28rpx 18rpx}
.profile-user{position:relative;z-index:1;width:100%}
</style>
