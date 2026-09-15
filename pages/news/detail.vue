<template>
  <view class="app-page dark detail-page"><ui-header :title="article.title" back /><image class="cover" :src="article.image" mode="aspectFill"/><view class="article"><text class="lead">{{ article.subtitle }}</text><text v-for="(p,i) in article.body" :key="i" class="paragraph" :style="paragraphStyle">{{ p }}</text></view></view>
</template>
<script>
import { api } from '@/services/api'
export default {
  data(){return{article:{title:'资讯详情',subtitle:'',image:'',body:[],bodyStyle:{}}}},
  computed:{paragraphStyle(){const s=this.article.bodyStyle||{};return{color:s.color||'#a9a9a9',fontSize:(s.size||27)+'rpx',lineHeight:(s.lineHeight||48)+'rpx'}}},
  onLoad(q){const loader=String(q.announcement)==='1'?api.getAnnouncement(q.id):api.getArticle(q.id);loader.then(article=>{this.article={...this.article,...article,subtitle:article.subtitle||'',body:Array.isArray(article.body)?article.body:[]}}).catch(e=>uni.showToast({title:e.message||'内容加载失败',icon:'none'}))}
}
</script>
<style scoped>.detail-page{padding-bottom:60rpx;background:#050505}.cover{width:calc(100% - 56rpx);height:390rpx;margin:18rpx 28rpx;border-radius:8rpx}.article{padding:0 30rpx 50rpx}.lead{display:block;margin:4rpx 0 40rpx;color:#d3d3d3;font-size:29rpx;line-height:46rpx;font-weight:700}.paragraph{display:block;margin-bottom:34rpx;color:#a9a9a9;font-size:27rpx;line-height:48rpx}</style>
