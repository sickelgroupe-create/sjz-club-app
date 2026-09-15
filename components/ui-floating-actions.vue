<template>
  <view class="float-actions">
    <navigator class="float-btn home" url="/pages/index/index" open-type="reLaunch" hover-class="tap-active"><ui-icon name="home" :size="44" tone="white" /></navigator>
    <navigator v-if="service.enabled && service.avatar" class="float-btn customer" :url="serviceUrl" hover-class="tap-active"><image class="customer-avatar" :src="service.avatar" mode="aspectFit"/></navigator>
  </view>
</template>
<script>
import { api } from '@/services/api'
import { validMiniProgramUrl } from '@/utils/app'
export default {
  data(){return{service:{icon:'',avatar:'',pageUrl:'/pages/service/customer',enabled:false}}},
  computed:{serviceUrl(){return validMiniProgramUrl(this.service.pageUrl)?this.service.pageUrl:'/pages/service/customer'}},
  created(){api.getCustomerService().then(data=>{this.service={...this.service,...data}}).catch(()=>{})}
}
</script>
<style scoped>
.float-actions { position: fixed; z-index: 70; right: 24rpx; top: 52%; display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.float-btn { box-sizing: border-box; flex: 0 0 88rpx; width: 88rpx; height: 88rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10rpx 28rpx rgba(22,31,56,.18); }
.home { color: #fff; background: linear-gradient(135deg,#ff6174,#ee3651); }
.customer { overflow:hidden;flex-direction:column;color:#085938;background:#fff;border:4rpx solid #ff6678; }
.customer-avatar{display:block;flex:0 0 80rpx;width:80rpx;height:80rpx;border-radius:50%;}
</style>
