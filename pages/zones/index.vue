<template>
  <view :class="['app-page', { dark }]">
    <ui-header title="商品专区" />
    <view class="zone-body">
      <scroll-view class="zone-menu" scroll-y>
        <view v-for="item in categories" :key="item.id" :class="['zone-tab', { active: active === item.id }]" @tap="selectCategory(item)">{{ item.name }}</view>
      </scroll-view>
      <scroll-view class="zone-content" scroll-y>
        <view class="zone-head"><text class="section-title">{{ activeName }}</text><navigator class="more" :url="listUrl" hover-class="tap-active"><text>更多</text><ui-icon name="chevron-right" :size="25"/></navigator></view>
        <navigator v-for="item in products" :key="item.id" class="zone-product" :url="'/pages/product/detail?id=' + item.id" hover-class="tap-active">
          <image :src="item.image" mode="aspectFill" />
          <view class="zone-info"><text class="zone-name">{{ item.name }}</text><text class="muted">{{ item.subtitle }}</text><view><text class="price">¥{{ item.price.toFixed(2) }}</text></view></view>
        </navigator>
        <ui-empty v-if="!products.length" title="当前专区暂无商品" description="可以切换其他专区看看" />
      </scroll-view>
    </view>
    <ui-bottom-nav active="zones" />
  </view>
</template>
<script>
import { api } from '@/services/api'
import { isDark } from '@/utils/app'
export default {
  data() { return { dark: false, categories: [], active: '', products: [] } },
  computed: {
    activeName() { const item = this.categories.find(i => i.id === this.active); return item ? item.name : '商品专区' },
    listUrl() { return '/pages/product/list?category=' + this.active + '&title=' + encodeURIComponent(this.activeName) }
  },
  onLoad() { this.dark = isDark(); api.getHome().then(data=>{this.categories=data.categories.filter(i=>i.id!=='service');this.active=this.categories[0]?.id||'';this.load()}).catch(e=>uni.showToast({title:e.message||'分类加载失败，请重试',icon:'none'})) }, onShow() { this.dark = isDark() },
  methods: {
    load() { api.getProducts({ category: this.active }).then(list => { this.products = list }).catch(e=>uni.showToast({title:e.message||'商品加载失败，请重试',icon:'none'})) },
    selectCategory(item) { this.active = item.id; this.load() }
  }
}
</script>
<style scoped>
.app-page{padding-bottom:calc(var(--tab-height) + env(safe-area-inset-bottom))}.zone-body{height:calc(100vh - 132rpx - env(safe-area-inset-bottom));display:flex;padding-top:18rpx}.zone-menu{width:178rpx;height:100%;padding:10rpx 0;background:var(--surface);border-radius:0 24rpx 24rpx 0;box-shadow:var(--shadow-card)}.zone-tab{min-height:88rpx;display:flex;align-items:center;padding:18rpx 20rpx;border-left:6rpx solid transparent;color:var(--muted);font-size:24rpx}.zone-tab.active{border-color:var(--primary);color:var(--text);background:linear-gradient(90deg,var(--primary-soft),transparent);font-weight:700}.zone-content{flex:1;height:100%;margin-left:18rpx;padding:0 22rpx 36rpx}.zone-head{padding:28rpx 0;display:flex;justify-content:space-between;align-items:center}.more{display:flex;align-items:center;color:var(--muted);font-size:23rpx}.zone-product{display:flex;gap:18rpx;margin-bottom:20rpx;padding:18rpx;border-radius:22rpx;background:var(--surface);color:var(--text);box-shadow:var(--shadow-card)}.zone-product image{width:146rpx;height:146rpx;border-radius:16rpx}.zone-info{min-width:0;flex:1;display:flex;flex-direction:column;justify-content:space-around}.zone-name{font-size:27rpx;font-weight:700}.zone-info .muted{font-size:22rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.zone-info .old-price{margin:0 18rpx 0 0}.zone-info .price{float:right}
</style>
