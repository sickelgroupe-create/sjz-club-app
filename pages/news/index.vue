<template>
  <view class="app-page dark news-page">
    <ui-header title="首页" />
    <view class="search-wrap"><ui-search :value="keyword" placeholder="搜索资讯内容" @input="keyword=$event" /></view>
    <view class="news-list">
      <navigator v-for="(item,index) in filtered" :key="item.id" :url="'/pages/news/detail?id=' + item.id" hover-class="tap-active" :class="['news-card', 'style-' + index]">
        <image :src="item.image" mode="aspectFill" />
        <view class="news-overlay"><text class="news-title" :style="{ color: item.titleColor, fontSize: item.titleSize + 'rpx' }">{{ item.title }}</text><text class="news-sub">{{ item.subtitle }}</text></view>
      </navigator>
    </view>
    <ui-bottom-nav active="news" />
  </view>
</template>
<script>
import { api } from '@/services/api'
export default {
  data(){return{keyword:'',news:[]}},
  computed:{filtered(){return this.news.filter(n=>!this.keyword||n.title.includes(this.keyword)||n.subtitle.includes(this.keyword))}},
  onLoad(){api.getPromotions('newsCards').then(items=>{this.news=items.filter(i=>i.enabled).sort((a,b)=>a.sort-b.sort)}).catch(e=>uni.showToast({title:e.message||'资讯加载失败，请重试',icon:'none'}))}
}
</script>
<style scoped>
.news-page{background:#0a0c12}.search-wrap{margin:18rpx 28rpx}.news-list{padding:0 28rpx}.news-card{position:relative;display:block;height:250rpx;margin-bottom:20rpx;border-radius:22rpx;overflow:hidden;background:#171717;box-shadow:0 12rpx 36rpx rgba(0,0,0,.18)}.news-card image{width:100%;height:100%}.news-overlay{position:absolute;top:0;right:0;bottom:0;left:0;display:flex;flex-direction:column;justify-content:center;padding:36rpx;background:linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.08));color:#fff}.news-title{max-width:600rpx;font-weight:900;line-height:1.18;text-shadow:0 4rpx 4rpx rgba(0,0,0,.5)}.news-sub{margin-top:14rpx;font-size:23rpx}.style-1{height:132rpx}.style-1 .news-overlay{background:linear-gradient(110deg,rgba(249,206,60,.94),rgba(255,138,42,.9))}.style-1 .news-title{color:#111!important;text-shadow:none}.style-1 .news-sub{display:none}.style-2{height:112rpx}.style-2 .news-sub{display:none}
</style>
