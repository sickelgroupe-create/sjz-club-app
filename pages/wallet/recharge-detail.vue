<template>
  <view :class="['app-page',{dark}]">
    <ui-header title="充值详情" back/>
    <view v-if="order.id" class="result-card">
      <view :class="['result-icon','result-'+order.status]"><ui-icon :name="order.status==='success'?'check':'wallet'" :size="52"/></view>
      <text class="result-title">{{statusName(order.status)}}</text>
      <text class="amount">¥{{money(order.amount)}}</text>
      <view class="details">
        <view><text>充值单号</text><text selectable>{{order.rechargeNo}}</text></view>
        <view><text>赠送金额</text><text>¥{{money(order.bonusAmount)}}</text></view>
        <view><text>实际入账</text><text>¥{{money(order.status==='success'?order.creditedAmount:0)}}</text></view>
        <view><text>创建时间</text><text>{{displayDateTime(order.createdAt||'-')}}</text></view>
        <view><text>支付时间</text><text>{{displayDateTime(order.paidAt||'-')}}</text></view>
        <view><text>支付流水号</text><text selectable>{{order.transactionNo||'-'}}</text></view>
      </view>
      <view v-for="gift in order.rewards||[]" :key="gift.couponName" class="mock-tip">{{gift.couponName}} × {{gift.quantity}}：{{gift.status==='issued'?'已发放至我的优惠券':order.status==='success'?'待补发，请联系客服':'支付成功后发放'}}</view>
      <text class="mock-tip">{{order.paymentMode==='wechat'?'支付结果以微信确认及钱包实际入账为准。':'历史充值记录'}}</text>
      <button v-if="order.paymentMode==='wechat' && order.status==='created'" :loading="busy" :disabled="busy" @tap="pay">继续支付</button>
      <button :disabled="busy" @tap="refresh">刷新支付结果</button>
    </view>
  </view>
</template>
<script>
import { api } from '@/services/api'
import { payRecharge } from '@/services/recharge'
import { isDark } from '@/utils/app'
export default {
  data(){return{dark:false,id:null,order:{},busy:false}},
  onLoad(q){this.dark=isDark();this.id=q.id},
  onShow(){if(this.id&&!this.busy)this.refresh()},
  methods:{
    money(v){return Number(v||0).toFixed(2)},
    statusName(s){return({created:'待支付',success:'充值成功',failed:'支付失败',cancelled:'支付已取消'})[s]||s},
    async refresh(){
      if(this.busy)return
      this.busy=true
      try{
        this.order=await api.getRecharge(this.id)
        if(this.order.paymentMode==='wechat'&&this.order.status==='created'){
          const result=await api.syncWechatRecharge(this.id)
          this.order=result.order||this.order
        }
      }catch(e){uni.showToast({title:e.message||'充值详情加载失败',icon:'none'})}finally{this.busy=false}
    },
    async pay(){
      if(this.busy)return
      this.busy=true
      try{const result=await payRecharge(this.id);uni.showToast({title:result.message,icon:result.success?'success':'none'})}
      catch(e){uni.showToast({title:e.message||'支付失败',icon:'none'})}
      finally{this.busy=false;await this.refresh()}
    }
  }
}
</script>
<style scoped>.result-card{margin:28rpx;padding:44rpx 30rpx;border-radius:28rpx;background:var(--surface);box-shadow:var(--shadow-card);text-align:center}.result-icon{width:96rpx;height:96rpx;margin:0 auto 20rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#f0f1f2;color:var(--muted)}.result-success{background:#e7f7ef;color:#0aa861}.result-title{display:block;font-size:34rpx;font-weight:900}.amount{display:block;margin:14rpx 0 36rpx;font-size:55rpx;font-weight:900}.details{border-top:1rpx solid var(--line)}.details view{min-height:82rpx;display:flex;align-items:center;justify-content:space-between;gap:24rpx;border-bottom:1rpx solid var(--line);font-size:23rpx}.details view text:first-child{color:var(--muted)}.details view text:last-child{max-width:68%;text-align:right;word-break:break-all}.mock-tip{display:block;margin-top:28rpx;color:#b08032;font-size:21rpx;line-height:34rpx}</style>
