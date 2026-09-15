<template>
  <view :class="['app-page','aftersale-list',{dark}]">
    <ui-header title="我的售后" back />
    <view v-if="loading" class="empty">售后记录加载中…</view>
    <view v-else-if="error" class="empty"><text>{{error}}</text><view class="retry" @tap="load">重新加载</view></view>
    <view v-else-if="!items.length" class="empty">暂无售后记录</view>
    <view v-else class="records">
      <view v-for="item in items" :key="item.id" class="record" @tap="open(item)">
        <view class="record-head"><text>{{item.productName||'订单售后'}}</text><text :class="['status',tone(item.status)]">{{statusName(item.status)}}</text></view>
        <view class="line"><text>售后单号</text><text>{{item.aftersaleNo||item.aftersale_no}}</text></view>
        <view class="line"><text>订单号</text><text>{{item.orderNo||'-'}}</text></view>
        <view class="line"><text>退款金额</text><text class="money">¥{{money(item.refundAmount)}}</text></view>
        <view class="record-foot"><text>{{displayDateTime(item.appliedAt||item.updatedAt)}}</text><ui-icon name="chevron-right" :size="26"/></view>
      </view>
    </view>
  </view>
</template>
<script>
import{api}from'@/services/api';import{isDark}from'@/utils/app'
export default{data(){return{dark:false,loading:true,error:'',items:[]}},onShow(){this.dark=isDark();this.load()},methods:{money(v){return Number(v||0).toFixed(2)},statusName(v){return({applied:'待服务方处理',provider_approved:'服务方已同意',provider_rejected:'服务方已拒绝',platform_reviewing:'平台审核中',approved:'平台已通过',rejected:'平台已驳回',refunded:'已退款',cancelled:'已取消'})[v]||v||'-'},tone(v){if(v==='refunded')return'success';if(['rejected','provider_rejected','cancelled'].includes(v))return'danger';return'warning'},async load(){this.loading=true;this.error='';try{this.items=await api.getAfterSales()}catch(e){this.items=[];this.error=e.message||'售后记录加载失败'}finally{this.loading=false}},open(item){uni.navigateTo({url:'/pages/aftersale/detail?id='+item.id})}}}
</script>
<style scoped>.aftersale-list{padding-bottom:40rpx}.records{padding:22rpx 28rpx}.record{margin-bottom:20rpx;padding:26rpx;border-radius:24rpx;background:var(--surface);box-shadow:var(--shadow-card)}.record-head,.line,.record-foot{display:flex;align-items:center;justify-content:space-between;gap:18rpx}.record-head{padding-bottom:18rpx;border-bottom:1rpx solid var(--line);font-weight:800}.status{padding:8rpx 14rpx;border-radius:18rpx;font-size:21rpx}.status.warning{background:#fff4df;color:#c57a00}.status.success{background:#e8f8ee;color:#16884a}.status.danger{background:#fff0f2;color:#d94355}.line{margin-top:16rpx;color:var(--muted);font-size:23rpx}.line text:last-child{max-width:480rpx;text-align:right;color:var(--text)}.line .money{color:var(--primary);font-weight:800}.record-foot{margin-top:18rpx;color:var(--muted);font-size:21rpx}.empty{min-height:420rpx;padding:80rpx 30rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24rpx;color:var(--muted)}.retry{padding:15rpx 34rpx;border-radius:30rpx;background:var(--primary);color:#fff}</style>
