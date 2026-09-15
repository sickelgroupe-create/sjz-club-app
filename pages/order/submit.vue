<template>
  <view :class="['app-page', 'submit-page', { dark }]">
    <ui-header title="提交订单" back />
    <template v-if="product">
    <view class="card goods"><image :src="product.image" mode="aspectFill"/><view><text class="goods-name">{{ product.name }}</text><text class="muted">{{ sku.name }}</text><text class="price">¥{{ sku.price.toFixed(2) }}</text></view><text class="muted">x{{ qty }}</text></view>
    <view class="form-card">
      <view class="form-row"><text class="form-label">联系人</text><input v-model="form.contact" class="form-input" placeholder="请输入联系人（选填）" /></view>
      <view class="form-row"><text class="form-label">联系电话</text><input v-model="form.phone" class="form-input" type="number" maxlength="11" placeholder="请输入联系电话（必填）" /></view>
      <view class="form-row"><text class="form-label">游戏ID</text><input v-model="form.gameId" class="form-input" placeholder="请输入正确游戏ID" /></view>
      <view class="form-row"><text class="form-label">游戏昵称</text><input v-model="form.gameName" class="form-input" placeholder="请输入正确游戏昵称" /></view>
      <view class="form-row"><text class="form-label">负责打手</text><text class="form-input">{{product.playerName||'由平台绑定'}}</text></view>
      <view class="form-row" @tap="showCoupons=true"><text class="form-label">优惠券</text><view class="form-input pick"><text>{{selectedCoupon?selectedCoupon.name:'不使用优惠券'}}</text><ui-icon name="chevron-right" :size="28"/></view></view>
      <view class="form-row"><text class="form-label">备注</text><input v-model="form.remark" class="form-input" placeholder="请输入备注（选填）" /></view>
      <view class="form-row"><text class="form-label">商品金额</text><text class="form-input">¥{{ rawTotal.toFixed(2) }}</text></view>
      <view v-if="discount>0" class="form-row"><text class="form-label">优惠金额</text><text class="form-input price">-¥{{ discount.toFixed(2) }}</text></view>
    </view>
    <view class="orderbar"><text class="muted">共{{ qty }}件</text><text>合计 <text class="price">¥{{ total.toFixed(2) }}</text></text><view :class="['submit-btn',{disabled:submitting}]" @tap="create">{{ submitting?'提交中':'提交订单' }}</view></view>
    <view v-if="showCoupons" class="sheet-mask" @tap="showCoupons=false"><view class="player-sheet" @tap.stop><text class="section-title">选择优惠券</text><view class="coupon-option" @tap="selectCoupon(null)"><view><text>不使用优惠券</text><text class="muted">按商品原价结算</text></view><ui-icon name="chevron-right" :size="30"/></view><view v-for="item in coupons" :key="item.id" :class="['coupon-option',{disabled:!item.applicable}]" @tap="selectCoupon(item)"><view><text>{{item.name}} · 减¥{{Number(item.amount).toFixed(2)}}</text><text class="muted">满¥{{Number(item.minSpend).toFixed(2)}}可用{{item.applicable?'':' · 当前不可用'}}</text></view><ui-icon name="chevron-right" :size="30"/></view></view></view>
    </template>
    <ui-page-status v-else :loading="loading" :description="loadError" @retry="loadProduct" />
  </view>
</template>
<script>
import { api } from '@/services/api'; import { isDark } from '@/utils/app'
export default {
  data(){return{dark:false,productId:'',skuId:'',product:null,loading:true,loadError:'请检查网络后重新加载',sku:{name:'',price:0},qty:1,players:[],selectedPlayer:null,showPlayers:false,coupons:[],selectedCoupon:null,showCoupons:false,quote:null,quoteError:'',quoteSequence:0,submitting:false,clientRequestId:'',form:{contact:'',phone:'',gameId:'',gameName:'',remark:''}}},
  computed:{rawTotal(){return Number(this.sku.price||0)*this.qty},discount(){return Number(this.quote?.discountAmount||0)},total(){return this.quote?Number(this.quote.payableAmount||0):this.rawTotal}},
  onLoad(q){
    this.requestedPlayerId=q.playerId||'';
    this.dark=isDark();this.qty=Math.min(10,Math.max(1,Math.floor(Number(q.qty)||1)));if(Number(q.qty)>10)uni.showToast({title:'单次最多购买10件，数量已调整',icon:'none'});this.productId=q.id||'';this.skuId=q.sku||'';
    this.clientRequestId=api.newRequestId('order');
    if(!this.productId||!this.skuId){this.loading=false;this.loadError='缺少商品或规格编号';return}
    return this.loadProduct();
  },
  methods:{
    showError(error,fallback){uni.showToast({title:error?.message||fallback,icon:'none',duration:3500})},
    async loadProduct(){
      this.loading=true;
      try{
        const item=await api.getProduct(this.productId);
        if(!item)throw new Error('商品不存在或已下架');
        const sku=item.skus.find(s=>String(s.id)===String(this.skuId));
        if(!sku)throw new Error('所选规格已停用');
        if(!item.playerId)throw new Error('商品尚未绑定打手，请联系客服');
        if(this.requestedPlayerId&&String(item.playerId)!==String(this.requestedPlayerId))throw new Error('该服务已更换负责打手，请返回打手列表重新选择');
        this.product=item;this.sku=sku;this.selectedPlayer={id:item.playerId,name:item.playerName};
      }catch(e){this.product=null;this.loadError=e.message||'订单商品暂时无法加载';this.loading=false;return}
      this.loading=false;
      await this.refreshQuote().catch(e=>this.showError(e,'价格试算失败，请重试'));
    },
    async refreshQuote(){
      const sequence=++this.quoteSequence;
      this.quote=null;this.quoteError='';
      try{
        const result=await api.quoteOrder({productId:this.productId,skuId:this.skuId,qty:this.qty,playerId:this.selectedPlayer?.id,couponIssueId:this.selectedCoupon?.id});
        if(sequence!==this.quoteSequence)return;
        this.quote=result;this.coupons=result.coupons||[];
        return result;
      }catch(e){if(sequence===this.quoteSequence)this.quoteError=e.message||'价格试算失败';throw e}
    },
    async selectCoupon(item){
      if(this.submitting)return;
      if(item&&!item.applicable){this.showError(null,'该优惠券当前不可使用');return}
      this.selectedCoupon=item;this.showCoupons=false;
      try{await this.refreshQuote()}catch(e){this.showError(e,'优惠券不可使用，请重新选择')}
    },
    async create(){
      if(this.submitting||!this.product)return;
      if(!this.form.gameId.trim()||!this.form.gameName.trim()){this.showError(null,'请填写游戏ID和游戏昵称');return}
      const phone=this.form.phone.trim();
      if(!/^1[3-9]\d{9}$/.test(phone)){this.showError(null,'请填写有效的联系电话');return}
      this.submitting=true;
      try{
        await this.refreshQuote();
        const order=await api.createOrder({productId:this.product.id,skuId:this.sku.id,qty:this.qty,playerId:this.selectedPlayer?.id,couponIssueId:this.selectedCoupon?.id,form:{...this.form,phone}},this.clientRequestId);
        uni.redirectTo({url:'/pages/order/payment?id='+order.id});
      }catch(e){this.showError(e,'订单提交失败')}finally{this.submitting=false}
    }
  }
}
</script>
<style scoped>
.submit-page{padding-bottom:150rpx}.goods{display:flex;align-items:center;gap:20rpx}.goods image{width:150rpx;height:150rpx;border-radius:16rpx}.goods>view{min-width:0;flex:1;display:flex;flex-direction:column;gap:9rpx}.goods-name{font-size:27rpx;font-weight:700}.goods .muted{font-size:23rpx}.pick{display:flex;justify-content:flex-end;align-items:center;gap:10rpx;color:var(--muted)}.remove{width:32rpx;height:32rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#c9cdd2}.orderbar{position:fixed;z-index:80;left:0;right:0;bottom:0;height:calc(112rpx + env(safe-area-inset-bottom));padding:10rpx 28rpx env(safe-area-inset-bottom);display:flex;align-items:center;gap:26rpx;background:var(--surface);border-top:1rpx solid var(--line);box-shadow:0 -8rpx 28rpx rgba(33,47,78,.06)}.orderbar>.muted{margin-right:auto}.submit-btn{padding:22rpx 32rpx;border-radius:40rpx;background:var(--primary);color:#fff}.submit-btn.disabled{opacity:.55}.sheet-mask{position:fixed;z-index:150;top:0;right:0;bottom:0;left:0;display:flex;align-items:flex-end;background:rgba(0,0,0,.5)}.player-sheet{width:100%;max-height:70vh;padding:32rpx 28rpx calc(30rpx + env(safe-area-inset-bottom));border-radius:28rpx 28rpx 0 0;background:var(--surface)}.player-option{display:flex;align-items:center;gap:20rpx;padding:20rpx 0;border-bottom:1rpx solid var(--line)}.player-option image{width:84rpx;height:84rpx;border-radius:50%}.player-option>view{flex:1;display:flex;flex-direction:column;gap:8rpx}.player-option .muted{font-size:22rpx}
.coupon-option{display:flex;align-items:center;padding:22rpx 0;border-bottom:1rpx solid var(--line)}.coupon-option>view{flex:1;display:flex;flex-direction:column;gap:8rpx}.coupon-option .muted{font-size:22rpx}.coupon-option.disabled{opacity:.45}
</style>
