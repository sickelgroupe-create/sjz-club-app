<template>
  <view class="notice-mask">
    <view class="notice-card" @tap.stop>
      <view class="notice-head"><text>公告</text><view class="notice-close" @tap="$emit('close')"><ui-icon name="x" :size="38" tone="muted" /></view></view>
      <scroll-view class="notice-body" scroll-y @tap="$emit('view')">
        <image v-if="config.image" class="notice-image" :src="config.image" mode="widthFix" />
        <view v-else class="notice-copy">
          <text class="notice-title">{{config.slogan || config.title}}</text>
          <text class="notice-subtitle">{{config.subtitle}}</text>
          <text v-for="(line,index) in body" :key="index">{{line}}</text>
        </view>
      </scroll-view>
      <view class="notice-foot" @tap="$emit('view')"><text>点击查看公告详情</text><text class="arrow">›</text></view>
    </view>
  </view>
</template>

<script>
export default {
  emits:['close','view'],
  props:{config:{type:Object,required:true}},
  computed:{body(){return this.config.body||[]}}
}
</script>

<style scoped>
.notice-mask{position:fixed;z-index:999;inset:0;display:flex;align-items:center;justify-content:center;padding:50rpx;background:rgba(0,0,0,.68)}.notice-card{width:100%;max-width:650rpx;max-height:860rpx;overflow:hidden;border-radius:28rpx;background:#fff;box-shadow:0 24rpx 70rpx rgba(0,0,0,.28);animation:notice-slide-in .34s cubic-bezier(.2,.8,.2,1)}.notice-head{height:96rpx;padding:0 28rpx;display:flex;align-items:center;border-bottom:1rpx solid #edf0f4}.notice-head>text{padding:7rpx 13rpx;border-radius:8rpx;background:#fff0f3;color:#ff4d68;font-size:22rpx}.notice-close{margin-left:auto;padding:12rpx}.notice-body{height:650rpx;padding:26rpx 28rpx 0}.notice-image{width:100%;display:block}.notice-copy{min-height:560rpx;padding:46rpx 34rpx;display:flex;flex-direction:column;gap:24rpx;background:linear-gradient(160deg,#111,#24180b);color:#e8d49a}.notice-title{font-size:42rpx;font-weight:900}.notice-subtitle{font-size:26rpx}.notice-copy>text:not(.notice-title):not(.notice-subtitle){font-size:24rpx;line-height:1.7}.notice-foot{height:82rpx;display:flex;align-items:center;justify-content:center;gap:12rpx;color:#c5c9d1;font-size:23rpx;background:rgba(255,255,255,.97)}.arrow{font-size:36rpx;transform:rotate(-90deg)}@keyframes notice-slide-in{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}
</style>
