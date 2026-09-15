<template>
  <view :class="['app-page',{dark}]">
    <ui-header :title="service.name || '在线客服'" back/>
    <view v-if="order" class="qr-card"><text class="qr-title">联系客服协调退款</text><text selectable>订单号：{{order.orderNo}}</text><text>请向客服说明服务情况和退款诉求。退款以平台审核结果为准，不按接单时长自动扣算。</text><view class="green-band" @tap="applyRefund">提交退款协调申请</view></view>
    <view v-if="service.enabled" class="qr-card">
      <view class="service-icon"><image v-if="service.avatar" :src="service.avatar" mode="aspectFit"/><ui-icon v-else name="message-circle" :size="54"/></view>
      <text class="qr-title">{{service.onlineStatus==='online'?'客服在线':'客服暂时离线'}}</text>
      <image v-if="service.qrImage" class="qr-image" :src="service.qrImage" mode="aspectFit" show-menu-by-longpress @tap="contact"/>
      <view v-else class="contact-card"><image v-if="service.avatar" :src="service.avatar" mode="aspectFit"/><text>{{service.contactText}}</text></view>
      <view class="green-band" @tap="contact">{{service.contactText}}</view>
    </view>
    <view v-else class="unconfigured"><ui-icon name="message-circle" :size="64" tone="muted"/><text>客服暂未配置</text><text>请稍后再试</text></view>
  </view>
</template>
<script>
import { api } from '@/services/api'
import { isDark, validMiniProgramUrl } from '@/utils/app'
export default{
  data(){return{dark:false,order:null,orderId:'',service:{name:'在线客服',avatar:'',onlineStatus:'offline',contactText:'',qrImage:'',enabled:false}}},
  onLoad(q){this.dark=isDark();this.orderId=q?.orderId||'';if(this.orderId)api.getOrder(this.orderId).then(order=>{this.order=order}).catch(e=>uni.showToast({title:e.message||'订单加载失败',icon:'none'}));api.getCustomerService().then(data=>{this.service=data||this.service}).catch(e=>uni.showToast({title:e.message||'客服信息加载失败',icon:'none'}))},
  methods:{applyRefund(){if(this.order)uni.navigateTo({url:'/pages/aftersale/detail?orderId='+this.orderId})},contact(){if(this.service.qrImage){uni.previewImage({urls:[this.service.qrImage],current:this.service.qrImage});return}const page=String(this.service.pageUrl||'');if(page&&page!=='/pages/service/customer'&&validMiniProgramUrl(page)){uni.navigateTo({url:page});return}const text=String(this.service.contactText||'').trim();const phone=(text.match(/1[3-9]\d{9}/)||[])[0];if(phone){uni.makePhoneCall({phoneNumber:phone});return}if(text){uni.setClipboardData({data:text});return}uni.showToast({title:'客服联系方式暂未配置',icon:'none'})}}
}
</script>
<style scoped>.qr-card{margin:28rpx;padding:50rpx 30rpx 0;display:flex;flex-direction:column;align-items:center;overflow:hidden;border-radius:26rpx;background:var(--surface);box-shadow:var(--shadow-card)}.service-icon{width:96rpx;height:96rpx;margin-bottom:20rpx;display:flex;align-items:center;justify-content:center;border-radius:28rpx;background:#e8f9ef}.service-icon image{width:90rpx;height:90rpx}.qr-title{font-size:34rpx;font-weight:800}.qr-image{width:390rpx;height:390rpx;margin:42rpx 0}.contact-card{width:390rpx;height:300rpx;margin:42rpx 0;display:flex;flex-direction:column;gap:26rpx;align-items:center;justify-content:center;border:2rpx dashed #b8c5be;border-radius:22rpx;color:#085938;background:#f8fcfa}.contact-card image{width:132rpx;height:132rpx}.contact-card text{font-size:25rpx;color:var(--muted)}.green-band{width:calc(100% + 60rpx);height:140rpx;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#22c96c,#0bbf5c);color:#fff;font-size:27rpx}.unconfigured{min-height:500rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16rpx;color:var(--muted)}.unconfigured text:first-of-type{color:var(--text);font-size:30rpx;font-weight:800}.unconfigured text:last-child{font-size:23rpx}</style>
