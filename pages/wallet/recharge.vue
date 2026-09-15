<template>
  <view :class="['app-page',{dark}]">
    <ui-header title="充值中心" back/>
    <view class="wallet-panel"><text class="label">当前余额</text><text class="balance">¥{{money(wallet.balance)}}</text><text class="pay-tip">微信支付成功后，充值金额自动存入余额</text></view>
    <view class="section-card">
      <text class="section-title">选择充值金额</text>
      <view class="tiers">
        <view v-for="tier in tiers" :key="tier.id" :class="['tier',{active:!customMode&&selectedTier===tier.id}]" @tap="chooseTier(tier)"><text class="tier-amount">¥{{money(tier.amount)}}</text><text v-if="Number(tier.bonusAmount)>0" class="tier-bonus">赠¥{{money(tier.bonusAmount)}}</text></view>
        <view :class="['tier',{active:customMode}]" @tap="chooseCustom"><text class="tier-amount">自定义</text><text class="tier-bonus">1—50000元</text></view>
      </view>
      <view v-if="customMode" class="custom-row"><text>¥</text><input v-model="customAmount" type="digit" maxlength="8" placeholder="输入充值金额" @input="resetRequest"/></view>
      <view v-if="giftRules.length" class="pay-tip"><text>充值赠券：按本次金额匹配最高档，仅赠一档，是否满足领取上限及有效期以发放时为准。</text><view v-for="rule in giftRules" :key="rule.name">满¥{{money(rule.minAmount)}}赠{{rule.couponName}} × {{rule.quantity}}</view></view>
      <button class="pay-button" :disabled="busy||!enabled" @tap="pay">{{busy?'处理中…':enabled?'微信支付充值':'充值暂未开放'}}</button>
      <text v-if="error" class="error">{{error}}</text>
    </view>
    <view class="records-head"><text class="section-title">充值记录</text></view>
    <view v-if="records.length" class="records"><view v-for="item in records" :key="item.id" class="record" @tap="openRecord(item)" hover-class="tap-active"><view><text class="record-no">{{item.rechargeNo}}</text><text class="record-time">{{displayDateTime(item.createdAt)}}</text></view><view class="record-right"><text>¥{{money(item.amount)}}</text><text :class="['status','status-'+item.status]">{{statusName(item.status)}}</text></view></view></view>
    <ui-empty v-else title="暂无充值记录"/>
  </view>
</template>
<script>
import { api } from '@/services/api'
import { isDark } from '@/utils/app'
import { payRecharge } from '@/services/recharge'
export default{
  data(){return{dark:false,enabled:false,busy:false,giftRules:[],tiers:[],selectedTier:null,customMode:false,customAmount:'',wallet:{balance:0},records:[],requestKey:'',pendingOrder:null,error:''}},
  onShow(){this.dark=isDark();if(!this.busy)this.load()},
  methods:{
    openRecord(item){uni.navigateTo({url:'/pages/wallet/recharge-detail?id='+item.id})},
    money(value){return Number(value||0).toFixed(2)},
    statusName(status){return({created:'待支付',success:'充值成功',failed:'支付失败',cancelled:'已关闭'})[status]||status},
    async load(){try{const [config,records]=await Promise.all([api.getRechargeConfig(),api.getRecharges()]);this.enabled=config.enabled===true;this.tiers=config.tiers||[];this.giftRules=config.giftRules||[];this.wallet=config.wallet||{balance:0};this.records=records||[];if(!this.selectedTier&&this.tiers.length)this.selectedTier=this.tiers[0].id}catch(e){this.error=e.message||'充值中心加载失败'}},
    resetRequest(){this.requestKey='';this.pendingOrder=null},
    chooseTier(tier){if(this.busy)return;this.selectedTier=tier.id;this.customMode=false;this.customAmount='';this.resetRequest()},
    chooseCustom(){if(this.busy)return;this.customMode=true;this.resetRequest()},
    async pay(){
      if(this.busy||!this.enabled)return
      // #ifndef MP-WEIXIN
      this.error='请在微信小程序中充值';return
      // #endif
      const amount=Number(this.customAmount)
      if(this.customMode&&(!/^\d+(\.\d{1,2})?$/.test(this.customAmount)||amount<1||amount>50000)){this.error='充值金额需为1至50000元，最多两位小数';return}
      if(!this.customMode&&!this.selectedTier){this.error='请选择充值金额';return}
      this.busy=true;this.error=''
      try{
        if(!this.requestKey)this.requestKey=api.newRequestId('recharge')
        if(!this.pendingOrder)this.pendingOrder=await api.createRecharge(this.customMode?{amount}:{tierId:this.selectedTier},this.requestKey)
        const result=await payRecharge(this.pendingOrder.id)
        this.error=result.message
        if(result.success){uni.showToast({title:'充值成功',icon:'success'});this.resetRequest()}
        await this.load()
      }catch(e){this.error=e.message||'充值失败，请稍后重试'}finally{this.busy=false}
    }
  }
}
</script>
<style scoped>
.wallet-panel{margin:24rpx 28rpx;padding:38rpx;border-radius:28rpx;background:linear-gradient(135deg,#064d36,#0a7650);color:#fff;box-shadow:0 18rpx 40rpx rgba(5,75,52,.2)}.label{display:block;font-size:24rpx;opacity:.78}.balance{display:block;margin:14rpx 0 24rpx;font-size:58rpx;font-weight:900}.pay-tip{display:block;padding-top:22rpx;border-top:1rpx solid rgba(255,255,255,.22);font-size:21rpx;line-height:34rpx}.section-card{margin:22rpx 28rpx;padding:30rpx;border-radius:24rpx;background:var(--surface);box-shadow:var(--shadow-card)}.section-title{font-size:30rpx;font-weight:900}.tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:18rpx;margin-top:28rpx}.tier{height:116rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2rpx solid var(--line);border-radius:20rpx;background:var(--surface-soft)}.tier.active{border-color:#086044;background:#eef8f3;box-shadow:0 8rpx 20rpx rgba(8,96,68,.1)}.tier-amount{font-size:29rpx;font-weight:800}.tier-bonus{margin-top:8rpx;color:#b88a38;font-size:20rpx}.custom-row{height:92rpx;margin-top:24rpx;padding:0 24rpx;display:flex;align-items:center;gap:16rpx;border:2rpx solid #086044;border-radius:18rpx;font-size:32rpx}.custom-row input{flex:1;height:100%;font-size:30rpx}.pay-button{height:88rpx;margin-top:28rpx;line-height:88rpx;border:0;border-radius:44rpx;background:#075e42;color:#fff;font-size:29rpx;font-weight:800}.pay-button[disabled]{opacity:.5}.pay-button::after{border:0}.error{display:block;margin-top:18rpx;color:var(--primary);font-size:23rpx;line-height:36rpx}.records-head{margin:32rpx 28rpx 16rpx}.records{margin:0 28rpx 40rpx;border-radius:24rpx;overflow:hidden;background:var(--surface);box-shadow:var(--shadow-card)}.record{min-height:112rpx;padding:20rpx 26rpx;display:flex;align-items:center;justify-content:space-between;gap:18rpx;border-bottom:1rpx solid var(--line)}.record>view{display:flex;flex-direction:column;gap:9rpx;min-width:0}.record-right{align-items:flex-end;flex-shrink:0}.record-no{font-size:23rpx;font-weight:700;word-break:break-all}.record-time,.status{color:var(--muted);font-size:20rpx}.status-success{color:#10a963}.status-failed,.status-cancelled{color:#e25858}
</style>
