<template>
  <view class="page-state">
    <view v-if="loading" class="spinner"></view>
    <text class="status-title">{{ loading ? '正在加载内容' : title }}</text>
    <text v-if="!loading" class="status-copy">{{ description }}</text>
    <view v-if="!loading" class="retry" hover-class="tap-active" @tap="$emit('retry')">重新加载</view>
  </view>
</template>

<script>
export default {
  emits: ['retry'],
  props: {
    loading: { type: Boolean, default: false },
    title: { type: String, default: '内容加载失败' },
    description: { type: String, default: '请检查网络后重新加载' }
  }
}
</script>

<style scoped>
.spinner { width: 54rpx; height: 54rpx; margin-bottom: 24rpx; border: 6rpx solid var(--line); border-top-color: var(--primary); border-radius: 50%; animation: spin .8s linear infinite; }
.status-title { color: var(--text); font-size: 29rpx; font-weight: 700; }
.status-copy { margin-top: 14rpx; font-size: 24rpx; }
.retry { margin-top: 34rpx; padding: 18rpx 42rpx; border-radius: 36rpx; background: var(--primary); color: #fff; font-size: 26rpx; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
