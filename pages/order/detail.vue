<template>
  <view :class="['app-page','order-detail-page',{dark}]">
    <ui-header title="订单详情" back />
    <template v-if="order">
      <view class="status-card">
        <view :class="['status-icon','status-'+order.status]"><ui-icon :name="statusIcon" :size="48"/></view>
        <view class="status-copy"><text class="status-title">{{statusLabel(order.status)}}</text><text>{{statusDescription}}</text></view>
      </view>

      <view class="card goods-card">
        <image :src="order.product.image" mode="aspectFill"/>
        <view class="goods-copy"><text class="goods-name">{{order.product.name}}</text><text class="muted">{{order.sku.name}} × {{order.qty}}</text><text class="price">¥{{money(order.total)}}</text></view>
      </view>

      <view class="card detail-card">
        <text class="section-title">订单信息</text>
        <view class="detail-row"><text>订单号</text><text selectable>{{order.orderNo}}</text></view>
        <view class="detail-row"><text>创建时间</text><text>{{displayDateTime(order.createdAt || '-')}}</text></view>
        <view class="detail-row"><text>游戏ID</text><text>{{order.gameId || '-'}}</text></view>
        <view class="detail-row"><text>游戏昵称</text><text>{{order.gameNickname || '-'}}</text></view>
        <view class="detail-row"><text>联系电话</text><text>{{order.contactPhone || '未填写'}}</text></view>
        <view class="detail-row"><text>支付方式</text><text>{{paymentMethod}}</text></view>
        <view v-if="order.paidAt" class="detail-row"><text>支付时间</text><text>{{displayDateTime(order.paidAt)}}</text></view>
        <view v-if="order.paymentExpiresAt&&order.status==='unpaid'" class="detail-row"><text>支付截止</text><text>{{displayDateTime(order.paymentExpiresAt)}}</text></view>
        <view v-if="order.remark" class="detail-row remark-row"><text>订单备注</text><text>{{order.remark}}</text></view>
      </view>

      <view class="card flow-card">
        <text class="section-title">订单流转</text>
        <view class="timeline">
          <view v-for="(item,index) in timelineItems" :key="item.id||index" :class="['timeline-item',{current:index===timelineItems.length-1}]">
            <view class="timeline-axis"><view class="timeline-dot"/><view v-if="index<timelineItems.length-1" class="timeline-line"/></view>
            <view class="timeline-copy"><view><text class="timeline-title">{{statusLabel(item.toStatus)}}</text><text class="timeline-time">{{displayDateTime(item.createdAt || order.createdAt)}}</text></view><text class="timeline-note">{{item.note || operatorLabel(item.operatorType)}}</text></view>
          </view>
        </view>
      </view>

      <view class="amount-card"><text>实付金额</text><text class="price">¥{{money(order.total)}}</text></view>
      <view v-if="order.review" class="card"><text class="section-title">我的评价 · {{order.review.rating}} 星</text><text style="display:block;white-space:pre-wrap;margin-top:16rpx">{{order.review.content}}</text><text class="muted">{{displayDateTime(order.review.createdAt)}}</text></view>
      <view class="bottom-actions"><view v-if="order.canReview&&!order.reviewed" class="primary-btn" @tap="openReview(order)">立即评价</view><view v-if="order.status==='unpaid'&&Number(order.remainingSeconds)>0" class="primary-btn" @tap="pay">立即支付</view><view v-if="order.status==='unpaid'" class="secondary-btn" @tap="cancelPayment">{{cancelling?'正在关闭…':'取消付款'}}</view><view v-if="canAfterSale" class="secondary-btn" @tap="applyAfterSale">联系客服协调退款</view><view class="secondary-btn" @tap="backToList">返回订单列表</view></view>
    </template>
    <ui-page-status v-else :loading="loading" title="订单详情加载失败" :description="error" @retry="load"/>
    
    <view v-if="reviewDialog" class="sheet-mask" @tap="!reviewSubmitting&&(reviewDialog=false)"><view class="review-sheet" @tap.stop><text class="section-title">评价本次服务</text><view class="stars"><view v-for="n in 5" :key="n" :class="{on:n<=reviewForm.rating}" @tap="reviewForm.rating=n"><text :style="{color:n<=reviewForm.rating?'#ffad2f':'#cbd5e1',fontSize:'42rpx'}">{{n<=reviewForm.rating?'★':'☆'}}</text></view></view><text class="muted">当前评分：{{reviewForm.rating}} 星</text><textarea v-model="reviewForm.content" maxlength="500" placeholder="请填写真实的服务体验"/><text v-if="reviewError" class="error">{{reviewError}}</text><view class="primary-btn" @tap="submitReview">{{reviewSubmitting?'提交中…':'提交评价'}}</view></view></view>
  </view>
</template>

<script>
import { api } from '@/services/api'
import { isDark } from '@/utils/app'
import { orderReview } from '@/services/order-review'
import { occupancyClock } from '@/services/occupancy-clock.mjs'
export default {
  mixins:[occupancyClock,orderReview],
  data(){return{dark:false,orderId:'',order:null,loading:true,error:'',cancelling:false}},
  computed:{
    timelineItems(){const logs=this.order?.logs||[];return logs.length?logs:[{toStatus:this.order?.status,note:'当前订单状态',createdAt:this.order?.createdAt,operatorType:'system'}]},
    paymentMethod(){return this.displayPaymentMethod(this.order?.paymentMethod)},
    statusIcon(){return({unpaid:'clock',pending:'receipt-clock',accepted:'clipboard-check',serving:'gamepad',completed:'check-circle',refunding:'refresh',refunded:'wallet',cancelled:'x'})[this.order?.status]||'info'},
    statusDescription(){if(this.order?.occupiedSeconds!=null)return '接单中，暂时无法服务其他订单 · 已接单 '+this.occupiedText(this.order.occupiedSeconds);return({unpaid:'订单正在等待支付',pending:'订单已支付，等待接单',accepted:'服务人员已经接单',serving:'订单正在服务中',completed:'本次订单已经完成',refunding:'退款正在处理中',refunded:'订单款项已退款',cancelled:'订单已经关闭'})[this.order?.status]||'请查看下方流转记录'}
    ,canAfterSale(){return['pending','accepted','serving','completed'].includes(this.order?.status)}
  },
  onLoad(q){this.dark=isDark();this.orderId=q.id||''},
  onShow(){this.load()},
  methods:{
    money(value){return Number(value||0).toFixed(2)},
    statusLabel(status){return({unpaid:'待付款',pending:'待接单',accepted:'已接单',serving:'服务中',refunding:'退款中',completed:'已完成',refunded:'已退款',cancelled:'已关闭'})[status]||status||'-'},
    operatorLabel(type){return({user:'用户操作',provider:'服务方操作',admin:'后台操作',system:'系统处理'})[type]||'状态已更新'},
    async load(){if(!this.orderId){this.error='缺少订单编号';this.loading=false;return}this.loading=true;this.error='';try{this.order=await api.getOrder(this.orderId)}catch(e){this.order=null;this.error=e.message||'订单不存在或无权查看'}finally{this.loading=false}},
    async cancelPayment(){if(this.cancelling||this.order?.status!=='unpaid')return;this.cancelling=true;try{const choice=await new Promise(resolve=>uni.showModal({title:'取消付款',content:'取消后将直接关闭订单，不能继续支付。确定取消吗？',success:resolve,fail:()=>resolve({confirm:false})}));if(!choice.confirm)return;await api.cancelOrder(this.orderId);await this.load();uni.showToast({title:'订单已关闭',icon:'success'})}catch(e){uni.showToast({title:e.message||'关闭失败，请重试',icon:'none'});await this.load()}finally{this.cancelling=false}},
    pay(){uni.navigateTo({url:'/pages/order/payment?id='+this.orderId})},
    applyAfterSale(){if(this.order?.paymentChannel==='apple_iap'){uni.showModal({title:'苹果支付退款说明',content:'苹果支付需由您向Apple申请退款，最终结果由Apple处理。联系客服或平台同意售后不代表款项已退回。',confirmText:'联系客服',success:result=>{if(result.confirm)uni.navigateTo({url:'/pages/service/customer?orderId='+this.orderId})}});return}uni.navigateTo({url:'/pages/service/customer?orderId='+this.orderId})},
    backToList(){uni.redirectTo({url:'/pages/order/list?status=all'})}
  }
}
</script>

<style scoped>
.order-detail-page{padding-bottom:44rpx}.status-card{margin:22rpx 28rpx;padding:30rpx;display:flex;align-items:center;gap:22rpx;border-radius:26rpx;background:linear-gradient(135deg,#fff7e9,#ffe2ad);box-shadow:0 10rpx 30rpx rgba(167,110,24,.1)}.status-icon{width:86rpx;height:86rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.8);color:#ec9b17}.status-cancelled,.status-refunded{color:var(--muted)}.status-completed{color:#16a266}.status-copy{display:flex;flex-direction:column;gap:8rpx;color:var(--muted);font-size:22rpx}.status-title{color:var(--text);font-size:34rpx;font-weight:900}.card{margin:20rpx 28rpx 0;padding:26rpx;border-radius:24rpx;background:var(--surface);box-shadow:var(--shadow-card)}.goods-card{display:flex;gap:22rpx}.goods-card image{width:146rpx;height:146rpx;flex-shrink:0;border-radius:18rpx;background:var(--surface-soft)}.goods-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:12rpx}.goods-name{font-size:28rpx;font-weight:800}.muted{color:var(--muted);font-size:23rpx}.price{color:var(--primary);font-size:29rpx;font-weight:900}.detail-card .section-title,.flow-card .section-title{display:block;margin-bottom:16rpx}.detail-row{min-height:76rpx;display:flex;align-items:center;justify-content:space-between;gap:24rpx;border-bottom:1rpx solid var(--line);color:var(--muted);font-size:22rpx}.detail-row:last-child{border-bottom:0}.detail-row text:last-child{max-width:450rpx;color:var(--text);text-align:right;word-break:break-all}.remark-row{align-items:flex-start;padding:20rpx 0}.timeline{padding-top:8rpx}.timeline-item{display:flex;min-height:102rpx}.timeline-axis{width:34rpx;display:flex;flex-direction:column;align-items:center}.timeline-dot{width:17rpx;height:17rpx;margin-top:8rpx;border:5rpx solid #d6dbe6;border-radius:50%;background:#fff}.timeline-line{width:2rpx;flex:1;background:#e3e6ed}.timeline-item.current .timeline-dot{border-color:var(--primary)}.timeline-copy{min-width:0;flex:1;padding:0 0 28rpx 12rpx}.timeline-copy>view{display:flex;align-items:center;justify-content:space-between;gap:16rpx}.timeline-title{font-size:26rpx;font-weight:800}.timeline-time,.timeline-note{color:var(--muted);font-size:21rpx}.timeline-note{display:block;margin-top:8rpx}.amount-card{margin:20rpx 28rpx 0;padding:26rpx;display:flex;align-items:center;justify-content:space-between;border-radius:24rpx;background:var(--surface);font-size:25rpx}.bottom-actions{margin:26rpx 28rpx;display:flex;flex-direction:column;gap:16rpx}.secondary-btn{height:84rpx;display:flex;align-items:center;justify-content:center;border:2rpx solid var(--line);border-radius:44rpx;color:var(--text);font-size:26rpx}
.sheet-mask{position:fixed;z-index:200;inset:0;display:flex;align-items:flex-end;background:rgba(0,0,0,.55)}.review-sheet{width:100%;padding:34rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));border-radius:28rpx 28rpx 0 0;background:var(--surface)}.stars{display:flex;justify-content:center;gap:12rpx;margin:28rpx}.stars>view{opacity:.25}.stars .on{opacity:1;color:#ffad2f}.review-sheet textarea{box-sizing:border-box;width:100%;height:190rpx;padding:22rpx;border-radius:18rpx;background:var(--surface-soft);color:var(--text)}.review-sheet .primary-btn{margin-top:26rpx}.error{display:block;margin:12rpx;color:var(--primary);font-size:22rpx}
</style>
