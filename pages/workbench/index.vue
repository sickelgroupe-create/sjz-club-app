<template>
  <view :class="['app-page','workbench-page',{dark}]">
    <ui-header title="打手工作台" back />
    <template v-if="data">
      <view class="summary-card">
        <view class="summary-head"><view><text class="section-title">{{ roleName }}</text><text class="muted">订单、服务状态和收益实时同步</text></view><navigator url="/pages/wallet/index" class="wallet-link">钱包<ui-icon name="chevron-right" :size="24"/></navigator></view>
        <view class="stats"><view v-for="item in statCards" :key="item.label" @tap="openMetric(item.key)"><b>{{item.money?'¥':''}}{{item.money?money(item.value):(item.value||0)}}</b><text>{{item.label}}</text></view></view>
      </view>
      <view class="service-card"><text class="section-title">服务状态</text><text v-if="data.isBusy" class="muted catalog-note">接单中，暂时无法服务；已接单 {{occupiedText(data.occupiedSeconds)||'时长待同步'}}。</text><view class="status-actions"><view v-for="item in statuses" :key="item.key" :class="['status-button',{active:!data.isBusy&&data.serviceStatus===item.key}]" @tap="setStatus(item.key)">{{item.label}}</view></view></view>
      <view v-if="role==='player'" class="profile-card"><view class="section-head"><text class="section-title">陪玩资料</text><view class="add" @tap="openProfile">编辑资料</view></view><view class="profile-summary"><image :src="data.profile?.image" mode="aspectFill"/><view><text>{{data.profile?.displayName||'未填写昵称'}}</text><text class="muted">{{data.profile?.intro||'暂无简介'}}</text><text class="muted">{{data.profile?.voiceUrl?'已配置语音':'暂无语音'}}</text></view></view><view class="section-head service-manage"><text>已绑定 {{(data.services?.selected||[]).length}} 个服务规格</text><text class="muted">由平台绑定商品</text></view></view>
      <view v-if="role==='player'" class="profile-card my-products">
        <view class="section-head" @tap="showProducts=!showProducts"><text class="section-title">我的商品（{{myProducts.length}}）</text><text class="add">{{showProducts?'收起':'展开'}}</text></view>
        <text class="muted catalog-note">平台统一绑定和定价；以下是顾客购买服务的价格，不是打手到手收益。</text>
        <view v-if="showProducts">
          <view v-for="product in myProducts" :key="product.id" class="own-product">
            <view class="own-product-head"><image v-if="product.image" :src="product.image" mode="aspectFill"/><view><text class="own-product-name">{{product.name}}</text><text class="muted">{{product.categoryName}} · {{product.status==='active'?'已上架':'已下架'}}</text></view></view>
            <view v-for="sku in product.skus" :key="sku.id" class="own-sku"><view><text>{{sku.name}}</text><text class="muted">{{sku.status==='active'?'可售数量：'+sku.stock:'规格已停用'}}</text></view><text class="price">¥{{money(sku.price)}}</text></view>
            <text v-if="!product.skus.length" class="muted">暂无服务规格，请联系平台配置</text>
          </view>
          <text v-if="!myProducts.length" class="catalog-note muted">暂未绑定商品，请联系平台管理员。</text>
        </view>
      </view>
      <view class="tabs"><view v-for="item in tabs" :key="item.key" :class="['tab',{active:tab===item.key}]" @tap="changeTab(item.key)">{{item.label}}</view></view>
      <view v-if="orders.length" class="orders"><view v-for="order in orders" :key="order.id" class="order-card" @tap="openOrder(order)"><view class="order-head"><text>{{order.orderNo}}</text><ui-status-tag :label="statusName(order.status)" :tone="statusTone(order.status)"/></view><text class="order-title">{{order.productName}}</text><view class="order-meta"><text>¥{{money(order.totalAmount)}}</text><text>{{displayDateTime(order.createdAt)}}</text></view><view class="order-actions"><view v-if="allowed(order,'reject')" @tap.stop="act(order,'reject')">拒单申请退款</view><view v-if="allowed(order,'accept')" class="primary" @tap.stop="act(order,'accept')">接单</view><view v-if="allowed(order,'start')" class="primary" @tap.stop="act(order,'start')">开始服务</view><view v-if="allowed(order,'finish')" class="primary" @tap.stop="act(order,'finish')">完成服务</view><text v-if="order.status==='serving'&&order.providerCompletedAt" class="muted">等待用户确认</text></view></view></view>
      <ui-empty v-else title="暂无相关订单" description="订单状态变化后会自动同步" />
    </template>
    <ui-page-status v-else :loading="loading" title="工作台加载失败" :description="error" @retry="load" />
    <view v-if="profileDialog" class="sheet-mask" @tap="profileDialog=false"><view class="product-sheet" @tap.stop><text class="section-title">编辑陪玩资料</text><input v-model="profileForm.displayName" placeholder="陪玩昵称"/><view class="gender-field"><text>性别</text><radio-group @change="changeGender"><label><radio value="male" :checked="profileForm.gender==='male'" color="#f43f5e"/>男</label><label><radio value="female" :checked="profileForm.gender==='female'" color="#f43f5e"/>女</label></radio-group></view><view class="avatar-upload" @tap="chooseAvatar"><image v-if="profileForm.image" :src="profileForm.image" mode="aspectFill"/><ui-icon v-else name="image" :size="48"/><text>{{avatarBusy?'头像上传中…':'选择头像图片'}}</text><text class="muted">相册 / 拍照 / 本地文件</text></view><textarea v-model="profileForm.intro" placeholder="个人简介"/><ui-voice-recorder v-model="profileForm.voiceUrl" @duration="profileForm.voiceSeconds=$event" @busy="voiceBusy=$event"/><input v-model="profileForm.city" placeholder="所在城市"/><view class="primary-btn" @tap="saveProfile">保存资料</view></view></view>
  </view>
</template>

<script>
import {api} from '@/services/api'
import {isDark} from '@/utils/app'
import {groupPlayerProducts} from '@/services/player-catalog.mjs'
import {occupancyClock} from '@/services/occupancy-clock.mjs'
export default{
  mixins:[occupancyClock],
  data(){return{dark:false,loading:true,error:'',data:null,tab:'all',orders:[],showProducts:true,profileDialog:false,voiceBusy:false,avatarBusy:false,avatarPicking:false,profileSaving:false,avatarRequest:0,profileForm:{displayName:'',image:'',intro:'',voiceUrl:'',city:''},statuses:[{key:'online',label:'在线接单'},{key:'paused',label:'暂不接单'},{key:'offline',label:'离线'}],tabs:[{key:'all',label:'全部'},{key:'pending',label:'待接单'},{key:'accepted',label:'已接单'},{key:'serving',label:'服务中'},{key:'completed',label:'已完成'},{key:'refunded',label:'退款订单'}]}},
  computed:{
    role(){return this.data?.role||''},roleName(){return '打手服务'},myProducts(){return groupPlayerProducts(this.data?.products||[])},
    statCards(){const stats=this.data?.stats||{},wallet=this.data?.wallet||{};return [{key:'today',label:'今日订单',value:stats.todayOrders},{key:'total',label:'累计订单',value:stats.totalOrders},{key:'expected',label:'预计收益',value:stats.expectedIncome,money:true},{key:'withdraw',label:'可提现余额',value:wallet.withdrawable,money:true}]}
  },
  onShow(){this.dark=isDark();if(!this.profileDialog)this.load()},
  onHide(){if(!this.avatarPicking){this.profileDialog=false;this.avatarRequest++;this.avatarBusy=false}},
  onUnload(){this.profileDialog=false;this.avatarRequest++;this.avatarPicking=false;this.avatarBusy=false},
  methods:{
    money(v){return Number(v||0).toFixed(2)},statusName(v){return({unpaid:'待付款',pending:'待接单',accepted:'已接单',serving:'服务中',completed:'已完成',cancelled:'已取消',refunding:'退款中',refunded:'已退款'})[v]||'未知状态'},statusTone(v){return({unpaid:'warning',pending:'brand',accepted:'success',serving:'warning',completed:'neutral',cancelled:'neutral',refunding:'danger',refunded:'danger'})[v]||'neutral'},
    async load(){this.loading=true;this.error='';try{this.data=await api.getWorkbench();this.orders=(this.data.orders||[]).filter(o=>this.tab==='all'||o.status===this.tab)}catch(e){this.data=null;this.error=e.message||'请确认账号已经通过入驻审核'}finally{this.loading=false}},
    async changeTab(key){this.tab=key;try{this.orders=await api.getWorkbenchOrders(key)}catch(e){uni.showToast({title:e.message||'加载失败',icon:'none'})}},
    async setStatus(status){try{this.data=await api.updateAvailability(status);this.orders=this.data.orders||[]}catch(e){uni.showModal({title:'暂时无法切换状态',content:e.message||'状态修改失败，请重试',showCancel:false})}},
    openMetric(key){uni.navigateTo({url:key==='withdraw'?'/pages/wallet/withdraw':'/pages/workbench/metric?type='+key})},
    chooseAvatar(){
      if(this.avatarPicking||this.avatarBusy)return
      if(this.voiceBusy){uni.showToast({title:'请先停止录音并等待处理完成',icon:'none'});return}
      const request=++this.avatarRequest
      // Native album/camera opens hide the page too; preserve this editor until it returns.
      this.avatarPicking=true
      const finishPicker=()=>{if(request===this.avatarRequest)this.avatarPicking=false}
      try{uni.chooseImage({
        count:1,sizeType:['compressed'],sourceType:['album','camera'],
        success:async result=>{
          if(request!==this.avatarRequest)return
          const path=result.tempFilePaths?.[0];if(!path)return
          this.avatarBusy=true
          try{const url=await api.uploadImage(path);if(request===this.avatarRequest)this.profileForm.image=url}
          catch(e){if(request===this.avatarRequest)uni.showToast({title:e.message||'头像上传失败，请重试',icon:'none'})}
          finally{if(request===this.avatarRequest)this.avatarBusy=false}
        },
        fail:e=>{if(request===this.avatarRequest&&!String(e.errMsg||'').includes('cancel'))uni.showToast({title:'无法选择图片，请检查相册权限后重试',icon:'none'})},
        complete:finishPicker
      })}catch(e){finishPicker();uni.showToast({title:'无法打开相册或相机，请重试',icon:'none'})}
    },
    openProfile(){this.avatarRequest++;this.avatarPicking=false;this.avatarBusy=false;const p=this.data?.profile||{};this.profileForm={displayName:p.displayName||'',gender:['male','female'].includes(p.gender)?p.gender:'unknown',image:p.image||'',intro:p.intro||'',voiceUrl:p.voiceUrl||'',voiceSeconds:p.voiceSeconds||0,city:p.city||''};this.profileDialog=true},
    changeGender(event){const value=event?.detail?.value;if(['male','female'].includes(value))this.profileForm.gender=value},
    async saveProfile(){if(this.profileSaving)return;if(this.avatarPicking){uni.showToast({title:'请先完成头像选择',icon:'none'});return}if(this.avatarBusy){uni.showToast({title:'请等待头像上传完成',icon:'none'});return}if(this.voiceBusy){uni.showToast({title:'请先停止录音并等待上传完成',icon:'none'});return}if(!this.profileForm.displayName){uni.showToast({title:'请填写陪玩昵称',icon:'none'});return}this.profileSaving=true;try{this.data.profile=await api.saveWorkbenchProfile(this.profileForm);this.profileDialog=false;uni.showToast({title:'资料已保存',icon:'success'})}catch(e){uni.showToast({title:e.message||'保存失败',icon:'none'})}finally{this.profileSaving=false}},
    allowed(order,action){return (order.allowedActions||[]).includes(action)},openOrder(order){uni.navigateTo({url:'/pages/workbench/order-detail?id='+order.id})},
    async act(order,action){try{await api.workbenchOrderAction(order.id,action);await this.load();await this.changeTab(this.tab)}catch(e){uni.showToast({title:e.message||'订单操作失败',icon:'none'})}},

  }
}
</script>

<style scoped>
.catalog-note{display:block;margin-top:16rpx;line-height:1.6}.own-product{padding-top:24rpx;margin-top:24rpx;border-top:1rpx solid var(--line)}.own-product-head{display:flex;gap:18rpx;align-items:center}.own-product-head image{width:88rpx;height:88rpx;border-radius:12rpx;flex-shrink:0}.own-product-head>view{display:flex;flex-direction:column;gap:8rpx;min-width:0}.own-product-name{font-size:27rpx;font-weight:600;word-break:break-all}.own-sku{display:flex;justify-content:space-between;gap:20rpx;padding:18rpx 0;font-size:24rpx}.own-sku>view{display:flex;flex-direction:column;gap:8rpx;min-width:0}.own-sku>.price{white-space:nowrap}.my-products .add{color:var(--primary);font-size:24rpx}
.gender-field{display:flex;align-items:center;justify-content:space-between;margin-top:18rpx;padding:20rpx;border:1rpx solid var(--line);border-radius:16rpx;color:var(--text);font-size:28rpx}.gender-field radio-group{display:flex;gap:32rpx}.gender-field label{display:flex;align-items:center;gap:8rpx}
.avatar-upload{display:flex;align-items:center;gap:16rpx;flex-wrap:wrap;padding:20rpx;margin-top:18rpx;border:1rpx solid var(--line);border-radius:16rpx;font-size:26rpx}.avatar-upload image{width:88rpx;height:88rpx;border-radius:50%}.avatar-upload .muted{width:100%}

.workbench-page{padding-bottom:40rpx}.summary-card,.service-card,.products-card,.profile-card{margin:22rpx 28rpx;padding:28rpx;border-radius:24rpx;background:var(--surface);box-shadow:var(--shadow-card)}.summary-head,.section-head,.order-head,.order-meta{display:flex;align-items:center;justify-content:space-between}.summary-head>view:first-child{display:flex;flex-direction:column;gap:8rpx}.wallet-link{display:flex;align-items:center;color:var(--primary);font-size:24rpx}.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:18rpx;margin-top:26rpx}.stats>view{padding:20rpx;border-radius:18rpx;background:var(--surface-soft);display:flex;flex-direction:column;gap:8rpx}.stats b{font-size:30rpx}.stats text,.muted{color:var(--muted);font-size:22rpx}.status-actions{display:flex;gap:12rpx;margin-top:22rpx}.status-button{flex:1;padding:18rpx 8rpx;text-align:center;border:1rpx solid var(--line);border-radius:30rpx;color:var(--muted);font-size:23rpx}.status-button.active{border-color:var(--primary);background:var(--primary-soft);color:var(--primary)}.profile-summary{display:flex;align-items:center;gap:20rpx;margin-top:22rpx}.profile-summary image{width:96rpx;height:96rpx;border-radius:50%;background:var(--surface-soft)}.profile-summary>view{display:flex;flex:1;flex-direction:column;gap:8rpx}.service-manage{margin-top:24rpx}.tabs{display:flex;gap:12rpx;padding:0 28rpx;overflow-x:auto}.tab{flex:0 0 auto;padding:16rpx 24rpx;border-radius:28rpx;background:var(--surface);color:var(--muted);font-size:23rpx}.tab.active{background:var(--primary);color:#fff}.orders{padding:20rpx 28rpx}.order-card{margin-bottom:18rpx;padding:24rpx;border-radius:22rpx;background:var(--surface);box-shadow:var(--shadow-card)}.order-head{padding-bottom:16rpx;border-bottom:1rpx solid var(--line);color:var(--muted);font-size:21rpx}.order-title{display:block;margin:20rpx 0;font-size:27rpx;font-weight:700}.order-meta{color:var(--muted);font-size:22rpx}.order-meta text:first-child,.price{color:var(--primary);font-weight:800}.order-actions{display:flex;justify-content:flex-end;align-items:center;gap:14rpx;margin-top:20rpx}.order-actions>view,.add{padding:12rpx 22rpx;border:1rpx solid var(--line);border-radius:28rpx;font-size:22rpx}.order-actions .primary,.add{border-color:var(--primary);color:var(--primary)}.product-row{display:flex;align-items:center;justify-content:space-between;padding:22rpx 0;border-bottom:1rpx solid var(--line)}.product-row>view{display:flex;flex-direction:column;gap:8rpx}.sheet-mask{position:fixed;z-index:200;inset:0;display:flex;align-items:flex-end;background:rgba(0,0,0,.55)}.product-sheet{width:100%;max-height:82vh;overflow-y:auto;padding:32rpx 28rpx calc(30rpx + env(safe-area-inset-bottom));border-radius:28rpx 28rpx 0 0;background:var(--surface)}.product-sheet input,.product-sheet textarea{box-sizing:border-box;width:100%;margin-top:18rpx;padding:20rpx;border:1rpx solid var(--line);border-radius:16rpx;color:var(--text)}.product-sheet input{height:88rpx;min-height:88rpx;line-height:48rpx;flex-shrink:0;font-size:28rpx;background:var(--surface)}.product-sheet textarea{height:180rpx;min-height:180rpx;font-size:28rpx;line-height:40rpx}.product-sheet .section-title{display:block}.product-sheet :deep(.uni-input-input){height:100%;line-height:normal}.product-sheet .primary-btn{margin-top:24rpx}.sku-head{display:flex;justify-content:space-between;margin-top:24rpx;font-size:24rpx;font-weight:700}.sku-head text:last-child,.sku-state{color:var(--primary)}.sku-editor{margin-top:16rpx;padding:16rpx;border-radius:18rpx;background:var(--surface-soft)}.sku-editor input{background:var(--surface)}.sku-actions{display:flex;justify-content:flex-end;gap:22rpx;padding-top:14rpx;font-size:22rpx}.sku-actions .danger{color:#ef4358}.service-option{display:flex;align-items:center;justify-content:space-between;margin-top:16rpx;padding:20rpx;border:1rpx solid var(--line);border-radius:18rpx}.service-option>view{display:flex;flex-direction:column;gap:8rpx}.service-option.selected{border-color:var(--primary);background:var(--primary-soft);color:var(--primary)}
</style>
