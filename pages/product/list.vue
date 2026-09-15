<template>
  <view :class="['app-page', { dark }]">
    <ui-header :title="title" back />
    <view class="search-wrap"><ui-search :value="keyword" placeholder="搜索商品或服务" @input="keyword=$event" @confirm="load" /></view>
    <ui-filter-bar :value="sort" :items="sorts" @input="changeSort" />
    <view class="grid"><ui-product-card v-for="item in list" :key="item.id" :product="item" /></view>
    <ui-empty v-if="!list.length" title="没有找到相关商品" description="换个关键词试试" />
  </view>
</template>
<script>
import { api } from '@/services/api'; import { isDark } from '@/utils/app'
export default {
  data(){return{dark:false,title:'商品列表',category:'',hot:false,keyword:'',sort:'default',list:[],page:1,pageSize:20,hasMore:false,loading:false,sorts:[{key:'default',label:'默认'},{key:'sales',label:'销量'},{key:'price',label:'价格'},{key:'views',label:'浏览'},{key:'reviews',label:'评价数'}]}},
  onLoad(q){this.dark=isDark();this.category=q.category||'';this.hot=q.hot==='true';this.title=this.decodeTitle(q.title);this.load()},
  onReachBottom(){if(this.hasMore&&!this.loading)this.load(false)},
  methods:{
    decodeTitle(value){if(!value)return'商品列表';try{return decodeURIComponent(value)}catch(error){return value}},
    async load(reset=true){if(this.loading)return;if(reset){this.page=1;this.list=[]}this.loading=true;try{const result=await api.getProductPage({category:this.category,hot:this.hot,keyword:this.keyword,sort:this.sort,page:this.page,pageSize:this.pageSize});this.list=reset?result.items:[...this.list,...result.items];this.hasMore=!!result.hasMore;this.page=Number(result.page||this.page)+1}catch(e){uni.showToast({title:e.message||'商品加载失败',icon:'none'})}finally{this.loading=false}},
    changeSort(key){this.sort=key;this.load(true)}
  }
}
</script>
<style scoped>.search-wrap{margin:18rpx 28rpx}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20rpx;padding:20rpx 28rpx}</style>
