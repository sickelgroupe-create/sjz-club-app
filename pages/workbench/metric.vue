<template>
  <view :class="['app-page','metric-page',{dark}]">
    <ui-header :title="title" back/>
    <view v-if="summary" class="metric-summary">
      <text class="section-title">{{title}} · {{summary.total}} 笔</text>
      <text v-if="isMoney" class="amount">¥{{money(summary.amount)}}</text>
      <text class="muted">{{description}}</text>
    </view>
    <view v-for="order in rows" :key="order.id" class="metric-order" @tap="openOrder(order)">
      <view class="row"><text class="muted order-no">{{order.orderNo}}</text><text>{{statusName(order.status)}}</text></view>
      <text class="order-title">{{order.productName}}</text>
      <text class="muted">{{order.skuName}} × {{order.qty}}</text>
      <view class="row"><text class="muted">{{formatTime(order.createdAt)}}</text><text class="amount">{{isMoney?'本单金额':'订单金额'}} ¥{{money(order.amount)}}</text></view>
      <text class="detail-link">查看订单详情 ›</text>
    </view>
    <ui-page-status v-if="error||loading&&!summary" :loading="loading" title="明细加载失败" :description="error" @retry="retry"/>
    <ui-empty v-else-if="summary&&!rows.length" title="暂无相关明细" description="符合条件的订单会实时显示在这里"/>
    <view v-if="summary?.hasMore&&!error" class="load-more" @tap="load(false)">{{loading?'加载中…':'加载更多'}}</view>
  </view>
</template>
<script>
import {api} from '@/services/api'
import {isDark} from '@/utils/app'
export default {
  data(){return{dark:false,type:'total',summary:null,rows:[],page:0,loading:false,error:''}},
  computed:{
    title(){return({today:'今日订单',total:'累计订单',expected:'预计收益明细',turnover:'营业额明细',fees:'平台佣金明细',income:'实际收入明细'})[this.type]||'工作台明细'},
    isMoney(){return !['today','total'].includes(this.type)},
    description(){if(this.type==='today')return '按服务端营业日期 '+this.formatTime(this.summary.businessDate)+' 统计，与今日订单卡片一致';if(this.type==='expected')return '待接单、已接单和服务中订单，按当前服务方比例 '+this.summary.providerRate+'% 逐笔预估；不是可提现余额，最终以结算为准。';if(['fees','income'].includes(this.type))return '仅统计已结算且未冲正的订单。';return '与工作台卡片统计口径一致，点击订单可查看完整流转信息。'}
  },
  onLoad(q){this.dark=isDark();this.type=q.type||'total'},
  onShow(){this.load(true)},
  onReachBottom(){if(this.summary?.hasMore)this.load(false)},
  methods:{
    money(v){return Number(v||0).toFixed(2)},formatTime(v){return this.displayDateTime(v)},
    statusName(v){return({unpaid:'待付款',pending:'待接单',accepted:'已接单',serving:'服务中',completed:'已完成',cancelled:'已关闭',refunding:'退款中',refunded:'已退款'})[v]||'未知状态'},
    retry(){this.load(!this.summary)},
    async load(reset){if(this.loading)return;this.loading=true;this.error='';const page=reset?1:this.page+1;try{const result=await api.getWorkbenchMetric(this.type,page);this.rows=reset?result.rows:[...this.rows,...result.rows.filter(r=>!this.rows.some(old=>old.id===r.id))];this.summary=result;this.page=page}catch(e){this.error=e.message||'请稍后重试'}finally{this.loading=false}},
    openOrder(order){uni.navigateTo({url:'/pages/workbench/order-detail?id='+order.id})}
  }
}
</script>
<style scoped>
.metric-page{padding-bottom:40rpx}.metric-summary,.metric-order{margin:22rpx 28rpx;padding:28rpx;border-radius:24rpx;background:var(--surface);box-shadow:var(--shadow-card);display:flex;flex-direction:column;gap:16rpx}.row{display:flex;justify-content:space-between;gap:18rpx;align-items:center;font-size:23rpx}.order-no{overflow-wrap:anywhere;min-width:0;flex:1}.row>text:last-child{flex-shrink:0}.order-title{font-size:28rpx;font-weight:700}.amount,.detail-link{color:var(--primary)}.metric-summary>.amount{font-size:38rpx;font-weight:800}.muted{color:var(--muted);font-size:23rpx;line-height:1.6}.detail-link{font-size:23rpx;text-align:right}.load-more{text-align:center;padding:26rpx;color:var(--primary)}
</style>
