<template>
  <navigator class="product" :url="detailUrl" hover-class="tap-active">
    <view class="cover-wrap">
      <image class="cover" :src="product.image" mode="aspectFill" />
      <text v-if="product.hot" class="hot">热门</text>
      <view class="cover-copy"><text class="cover-title">{{ product.name }}</text></view>
    </view>
    <view class="info">
      <text class="name">{{ product.name }}</text>
      <text class="subtitle">{{ product.subtitle }}</text>
      <view class="meta"><text>销量 {{ product.sales }}</text><text>浏览 {{ product.views }}</text></view>
      <view><text class="price">¥{{ product.price.toFixed(2) }}</text></view>
    </view>
  </navigator>
</template>

<script>
export default {
  props: { product: { type: Object, required: true } },
  computed: { detailUrl() { return '/pages/product/detail?id=' + this.product.id } }
}
</script>

<style scoped>
.product { display: block; overflow: hidden; border: 1rpx solid rgba(24,35,58,.03); border-radius: 20rpx; background: var(--surface); color: var(--text); box-shadow: var(--shadow-card); }
.cover-wrap { position: relative; height: 310rpx; overflow: hidden; background: #111; }
.cover { width: 100%; height: 100%; }
.hot { position: absolute; top: 10rpx; right: 10rpx; padding: 7rpx 12rpx; border-radius: 8rpx; background: #ff554c; color: #fff; font-size: 22rpx; }
.cover-copy { position: absolute; left: 0; right: 0; bottom: 0; padding: 44rpx 16rpx 14rpx; background: linear-gradient(transparent,rgba(0,0,0,.9)); }
.cover-title { color: #fff; font-size: 27rpx; font-weight: 800; }
.info { padding: 18rpx; }
.name { display: block; font-size: 27rpx; font-weight: 700; }
.subtitle { display: block; height: 64rpx; margin-top: 8rpx; color: var(--muted); font-size: 23rpx; line-height: 32rpx; overflow: hidden; }
.meta { display: flex; justify-content: space-between; margin: 12rpx 0; color: var(--muted); font-size: 22rpx; }
.price { font-size: 29rpx; }
</style>
