<template>
  <view class="empty">
    <view class="paper"><ui-icon name="document" :size="82" tone="brand" /></view>
    <text class="empty-title">{{ title }}</text>
    <text v-if="description" class="empty-desc">{{ description }}</text>
  </view>
</template>

<script>export default { props: { title: { type: String, default: '暂无相关数据' }, description: { type: String, default: '' } } }</script>

<style scoped>
.empty { min-height: 760rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.paper { width: 150rpx; height: 150rpx; border-radius: 42rpx; display: flex; align-items: center; justify-content: center; background: linear-gradient(145deg,#eef3ff,#dce7fb); box-shadow: 0 24rpx 60rpx rgba(93,128,169,.12); }
.empty-title { margin-top: 48rpx; font-size: 28rpx; color: var(--text); }
.empty-desc { margin-top: 14rpx; font-size: 24rpx; color: var(--muted); }
</style>
