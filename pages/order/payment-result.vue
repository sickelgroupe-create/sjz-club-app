<template>
  <view :class="['app-page','result-page',{dark}]">
    <ui-header title="支付结果" back />
    <view class="result-card">
      <view :class="['result-icon',view.tone]"><ui-icon :name="view.icon" :size="72"/></view>
      <text class="result-title">{{view.title}}</text>
      <text class="result-copy">{{message || view.copy}}</text>
      <view v-if="order" class="summary">
        <view><text>订单号</text><text>{{order.orderNo}}</text></view>
        <view><text>支付金额</text><text class="price">¥{{money(order.total)}}</text></view>
        <view><text>订单状态</text><text>{{statusText}}</text></view>
        <view v-if="canRetry"><text>剩余支付时间</text><text>{{remainingText}}</text></view>
      </view>
      <view class="actions">
        <view v-if="canRetry" class="primary-btn" @tap="retry">重新支付</view>
        <view class="secondary-btn" @tap="orders">查看订单</view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/services/api'
import { isDark } from '@/utils/app'
export default {
  data(){return{dark:false,orderId:'',status:'checking',message:'',order:null}},
  computed:{
    view(){return({checking:{title:'支付结果确认中',copy:'请稍后查看订单状态，勿重复付款',icon:'clock',tone:'cancelled'},unpaid:{title:'尚未确认付款',copy:'请在订单详情核对付款状态，如已付款请勿重复支付',icon:'clock',tone:'cancelled'},success:{title:'支付成功',copy:'付款已确认，请查看订单最新服务状态',icon:'check-circle',tone:'success'},failed:{title:'支付失败',copy:'本次支付未完成，您可以在订单超时前重新支付',icon:'x',tone:'failed'},cancelled:{title:'订单已取消',copy:'请在订单详情查看处理结果',icon:'minus',tone:'cancelled'},refunding:{title:'退款处理中',copy:'退款尚未确认完成，请查看售后进度',icon:'clock',tone:'cancelled'},refunded:{title:'订单已退款',copy:'请查看订单退款详情',icon:'check-circle',tone:'success'},expired:{title:'订单已关闭',copy:'支付等待已超过30分钟，订单已自动关闭',icon:'clock',tone:'expired'}})[this.status]||{title:'支付结果确认中',copy:'请在订单详情核对最新状态',icon:'info',tone:'cancelled'}},
    canRetry(){return this.order&&this.order.status==='unpaid'&&Number(this.order.remainingSeconds)>0&&this.status==='unpaid'},
    remainingText(){const value=Number(this.order?.remainingSeconds||0);return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`},
    statusText(){return({unpaid:'待付款',pending:'待接单',accepted:'已接单',serving:'服务中',completed:'已完成',cancelled:'已取消',refunding:'退款中',refunded:'已退款'})[this.order?.status]||'待确认'}
  },
  onLoad(q){this.dark=isDark();this.orderId=q.id||'';this.status='checking';this.message='';this.load()},
  methods:{
    money(value){return Number(value||0).toFixed(2)},
    decodeMessage(value){let decoded=String(value||'');for(let index=0;index<3;index++){try{const next=decodeURIComponent(decoded);if(next===decoded)break;decoded=next}catch(e){break}}return decoded},
    async load(){this.status='checking';this.message='';try{this.order=await api.getOrder(this.orderId);if(this.order.status==='cancelled')this.status=this.order.cancelReason==='payment_timeout'?'expired':'cancelled';else if(['pending','accepted','serving','completed'].includes(this.order.status))this.status='success';else if(['unpaid','refunding','refunded'].includes(this.order.status))this.status=this.order.status}catch(e){this.order=null;this.status='checking';this.message='暂时无法确认支付结果，请稍后查看订单，勿重复付款'}},
    retry(){uni.redirectTo({url:'/pages/order/payment?id='+this.orderId})},
    orders(){uni.redirectTo({url:'/pages/order/detail?id='+this.orderId})}
  }
}
</script>

<style scoped>
.result-page{padding-bottom:50rpx}.result-card{margin:50rpx 28rpx;padding:54rpx 34rpx 38rpx;display:flex;flex-direction:column;align-items:center;border-radius:28rpx;background:var(--surface);box-shadow:var(--shadow-card)}.result-icon{width:132rpx;height:132rpx;display:flex;align-items:center;justify-content:center;border-radius:50%}.result-icon.success{background:#e7f9ee}.result-icon.failed{background:#fff0f3}.result-icon.cancelled{background:#f1f3f6}.result-icon.expired{background:#fff3e4}.result-title{margin-top:28rpx;font-size:36rpx;font-weight:900}.result-copy{max-width:560rpx;margin-top:15rpx;color:var(--muted);font-size:23rpx;line-height:36rpx;text-align:center;word-break:break-word}.summary{width:100%;margin-top:38rpx;padding:8rpx 26rpx;border-radius:22rpx;background:var(--surface-soft)}.summary>view{min-height:78rpx;display:flex;align-items:center;justify-content:space-between;border-bottom:1rpx solid var(--line);color:var(--muted);font-size:22rpx}.summary>view:last-child{border-bottom:0}.summary text:last-child{max-width:390rpx;color:var(--text);text-align:right}.actions{width:100%;margin-top:38rpx;display:flex;flex-direction:column;gap:18rpx}.secondary-btn{height:84rpx;display:flex;align-items:center;justify-content:center;border:2rpx solid var(--line);border-radius:44rpx;color:var(--text);font-size:27rpx}
</style>
