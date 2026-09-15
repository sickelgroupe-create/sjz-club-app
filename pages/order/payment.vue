<template>
  <view :class="['app-page','payment-page',{dark}]">
    <ui-header title="订单支付" back />
    <template v-if="order">
      <view class="countdown-card">
        <view><text class="countdown-label">等待支付</text><text class="countdown-tip">请在30分钟内完成支付</text></view>
        <text :class="['countdown',{urgent:remaining<=300}]">{{countdownText}}</text>
      </view>

      <view class="card order-card">
        <view class="order-number"><text>订单编号</text><text>{{order.orderNo}}</text></view>
        <view class="goods">
          <image :src="order.product.image" mode="aspectFill"/>
          <view><text class="goods-name">{{order.product.name}}</text><text class="muted">{{order.player?order.player.name+' · ':''}}{{order.sku.name}}</text><text class="price">¥{{money(order.total)}}</text></view>
          <text>x{{order.qty}}</text>
        </view>
        <view class="detail-row"><text>创建时间</text><text>{{displayDateTime(order.createdAt || '-')}}</text></view>
        <view class="detail-row"><text>联系人</text><text>{{order.contactName || '未填写'}}</text></view>
        <view class="detail-row"><text>联系电话</text><text>{{order.contactPhone || '未填写'}}</text></view>
        <view class="total">应付金额：<text class="price">¥{{money(order.total)}}</text></view>
      </view>

      <view class="pay-card">
        <text class="pay-title">选择支付方式</text>
        <view :class="['pay-row',{selected:method==='wechat'}]" @tap="method='wechat'">
          <view class="pay-icon wechat"><ui-icon name="wechat" :size="38"/></view>
          <view class="option-copy"><text>微信支付</text><text>使用微信安全支付</text></view>
          <view :class="['radio',{checked:method==='wechat'}]"><ui-icon v-if="method==='wechat'" name="check" :size="22"/></view>
        </view>
        <view :class="['pay-row',{selected:method==='balance'}]" @tap="method='balance'">
          <view class="pay-icon balance"><ui-icon name="wallet" :size="38"/></view>
          <view class="option-copy"><text>余额支付</text><text>可用余额 ¥{{money(walletBalance)}}</text></view>
          <view :class="['radio',{checked:method==='balance'}]"><ui-icon v-if="method==='balance'" name="check" :size="22"/></view>
        </view>
      </view>

      <view v-if="order.status==='unpaid'" class="cancel-payment" @tap="cancelPayment">{{cancelling?'正在关闭…':'取消付款并关闭订单'}}</view>
      <text v-if="error" class="error">{{error}}</text>
      <view class="paybar">
        <view><text class="paybar-label">合计</text><text class="price">¥{{money(order.total)}}</text></view>
        <view :class="['pay-btn',{disabled:paying||remaining<=0}]" @tap="pay">{{paying?'处理中…':remaining<=0?'订单已超时':'立即支付'}}</view>
      </view>
    </template>
    <ui-page-status v-else :loading="loading" title="订单加载失败" :description="error" @retry="loadOrder"/>
  </view>
</template>

<script>
import { api } from '@/services/api'
import { requestVirtualPayment } from '@/services/virtual-payment'
import { isDark } from '@/utils/app'
export default {
  data(){return{dark:false,order:null,orderId:'',loading:true,paying:false,cancelling:false,error:'',method:'wechat',requestKey:'',remaining:0,timer:null,walletBalance:0}},
  computed:{countdownText(){const value=Math.max(0,this.remaining);return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`}},
  onLoad(q){this.dark=isDark();this.orderId=q.id||'';this.newRequestKey()},
  onShow(){if(!this.orderId||this.paying)return;this.loadOrder();this.loadWallet()},
  onUnload(){this.stopTimer()},
  methods:{
    money(value){return Number(value||0).toFixed(2)},
    newRequestKey(){this.requestKey=`order-pay-${this.orderId}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`},
    stopTimer(){if(this.timer){clearInterval(this.timer);this.timer=null}},
    startTimer(){this.stopTimer();if(this.remaining<=0)return;this.timer=setInterval(()=>{this.remaining=Math.max(0,this.remaining-1);if(this.remaining===0){this.stopTimer();this.loadOrder()}},1000)},
    async loadWallet(){try{const wallet=await api.getWallet();this.walletBalance=wallet.balance||0}catch(e){}},
    async loadOrder(){
      this.loading=true;this.error=''
      try{
        this.order=await api.getOrder(this.orderId)
        this.remaining=Number(this.order.remainingSeconds||0)
        if(this.order.status!=='unpaid'){
          if(this.order.cancelReason==='payment_timeout')this.goResult('expired')
          else if(['pending','accepted','serving','completed'].includes(this.order.status))this.goResult('success')
          else uni.reLaunch({url:'/pages/order/list?status='+encodeURIComponent(this.order.status||'all')})
          return
        }
        this.startTimer()
      }catch(e){this.order=null;this.error=e.message||'请返回订单列表重新选择'}finally{this.loading=false}
    },
    goResult(status,message=''){uni.redirectTo({url:`/pages/order/payment-result?id=${this.orderId}&status=${status}&message=${encodeURIComponent(message)}`})},
    async cancelPayment(){if(this.paying||this.cancelling||this.order?.status!=='unpaid')return;this.cancelling=true;try{const choice=await new Promise(resolve=>uni.showModal({title:'关闭订单',content:'确认取消付款并关闭订单？',success:resolve,fail:()=>resolve({confirm:false})}));if(!choice.confirm)return;await api.cancelOrder(this.orderId);this.stopTimer();uni.redirectTo({url:'/pages/order/detail?id='+this.orderId})}catch(e){this.error=e.message||'关闭订单失败';await this.loadOrder()}finally{this.cancelling=false}},
    async confirmWechatPayment(){
      let lastError=null
      for(let attempt=0;attempt<5;attempt+=1){
        try{
          const synced=await api.syncWechatPayment(this.orderId)
          if(['pending','accepted','serving','completed'].includes(synced.order?.status))return true
          if(['CLOSED','REVOKED','PAYERROR'].includes(synced.tradeState))break
        }catch(e){lastError=e}
        if(attempt<4)await new Promise(resolve=>setTimeout(resolve,800))
      }
      await this.loadOrder()
      if(['pending','accepted','serving','completed'].includes(this.order?.status))return true
      this.error=lastError?.message||'支付结果确认中，请稍后在订单列表查看'
      return false
    },
    async pay(){
      if(this.paying||this.cancelling||!this.order||this.remaining<=0)return
      const method=this.method
      this.paying=true;this.error=''
      try{
        const result=await api.payOrder(this.orderId,method,'success',this.requestKey)
        if(['pending','accepted','serving','completed'].includes(result.order?.status)){this.goResult('success');return}
        if(['refunding','refunded'].includes(result.order?.status)){uni.redirectTo({url:'/pages/order/detail?id='+this.orderId});return}
        if(result.expired){this.goResult('expired');return}
        if(method==='wechat'){
          if(result.requestVirtualPayment) await requestVirtualPayment(result.requestVirtualPayment)
          else await new Promise((resolve,reject)=>uni.requestPayment({...result.requestPayment,success:resolve,fail:reject}))
          if(await this.confirmWechatPayment())this.goResult('success')
          return
        }
        const status=['pending','accepted','serving','completed'].includes(result.order?.status)?'success':(result.payment?.status||'failed')
        this.goResult(status)
      }catch(e){
        const message=e.errMsg||e.message||'支付请求失败'
        if(message.includes('cancel')){await this.loadOrder();this.error='已取消微信支付'}
        else this.goResult('failed',message)
      }finally{this.paying=false}
    }
  }
}
</script>

<style scoped>
.cancel-payment{margin:24rpx 28rpx;padding:24rpx;text-align:center;border:1rpx solid var(--line);border-radius:44rpx;background:var(--surface);color:var(--muted)}.payment-page{padding-bottom:154rpx}.countdown-card{margin:22rpx 28rpx;padding:24rpx 28rpx;display:flex;align-items:center;justify-content:space-between;border-radius:24rpx;background:linear-gradient(120deg,#fff8e8,#ffe4b1);box-shadow:0 10rpx 28rpx rgba(191,126,23,.08)}.countdown-card>view{display:flex;flex-direction:column;gap:7rpx}.countdown-label{font-size:28rpx;font-weight:800}.countdown-tip{color:#95682d;font-size:21rpx}.countdown{color:#db7920;font-size:40rpx;font-weight:900;letter-spacing:2rpx}.countdown.urgent{color:var(--primary)}.order-card{padding:0;overflow:hidden}.order-number,.detail-row{padding:21rpx 28rpx;display:flex;align-items:center;justify-content:space-between;border-bottom:1rpx solid var(--line);color:var(--muted);font-size:22rpx}.order-number text:last-child,.detail-row text:last-child{max-width:430rpx;color:var(--text);text-align:right}.goods{display:flex;align-items:center;gap:18rpx;padding:26rpx 28rpx}.goods image{width:138rpx;height:138rpx;border-radius:16rpx}.goods>view{min-width:0;flex:1;display:flex;flex-direction:column;gap:9rpx}.goods-name{font-size:27rpx;font-weight:700}.total{padding:24rpx 28rpx;text-align:right;border-top:1rpx solid var(--line)}.pay-card,.outcome-card{margin:22rpx 28rpx;border-radius:24rpx;background:var(--surface);overflow:hidden;box-shadow:var(--shadow-card)}.pay-title{display:block;padding:25rpx 28rpx;font-weight:800;border-bottom:1rpx solid var(--line)}.pay-row{min-height:112rpx;padding:0 28rpx;display:flex;align-items:center;gap:17rpx;border-bottom:1rpx solid var(--line)}.pay-row:last-child{border-bottom:0}.pay-row.selected{background:var(--surface-soft)}.pay-icon{width:58rpx;height:58rpx;border-radius:18rpx;display:flex;align-items:center;justify-content:center}.pay-icon.wechat{background:#e6f8ed}.pay-icon.balance{background:#fff1e2}.option-copy{flex:1;display:flex;flex-direction:column;gap:6rpx}.option-copy text:first-child{font-size:27rpx;font-weight:700}.option-copy text:last-child{color:var(--muted);font-size:21rpx}.radio{width:36rpx;height:36rpx;border:2rpx solid #c9cdd2;border-radius:50%;display:flex;align-items:center;justify-content:center}.radio.checked{border-color:var(--primary);background:var(--primary)}.outcome-card{padding:25rpx 28rpx}.outcome-card>text{font-size:24rpx;font-weight:700}.outcome-options{display:grid;grid-template-columns:repeat(3,1fr);gap:14rpx;margin-top:20rpx}.outcome-options view{height:64rpx;display:flex;align-items:center;justify-content:center;border:1rpx solid var(--line);border-radius:34rpx;color:var(--muted);font-size:22rpx}.outcome-options view.active{border-color:var(--primary);background:var(--primary-soft);color:var(--primary)}.error{display:block;margin:14rpx 32rpx;color:var(--primary);font-size:23rpx}.paybar{position:fixed;z-index:80;left:0;right:0;bottom:0;height:calc(116rpx + env(safe-area-inset-bottom));padding:0 24rpx 0 30rpx;display:flex;align-items:center;gap:26rpx;background:var(--surface);box-shadow:0 -8rpx 28rpx rgba(33,47,78,.06)}.paybar>view:first-child{margin-right:auto;display:flex;align-items:baseline;gap:10rpx}.paybar-label{color:var(--muted);font-size:22rpx}.paybar .price{font-size:34rpx}.pay-btn{min-width:230rpx;height:84rpx;display:flex;align-items:center;justify-content:center;border-radius:44rpx;background:var(--primary);color:#fff;font-size:28rpx;font-weight:700;box-shadow:var(--shadow-button)}.pay-btn.disabled{opacity:.48;box-shadow:none}
</style>
