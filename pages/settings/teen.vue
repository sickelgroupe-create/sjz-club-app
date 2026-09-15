<template>
  <view :class="['app-page','teen-page',{dark}]">
    <ui-header title="青少年模式" back />
    <view class="teen-content">
      <template v-if="loading"><text class="muted">正在读取青少年模式设置…</text></template>
      <template v-else-if="!enabled">
        <text class="teen-title">设置密码</text>
        <text class="teen-subtitle">由用户主动开启，需要设置监护密码</text>
        <view class="code-boxes" @tap="focusPin">
          <view v-for="index in 4" :key="index" :class="['code-box',{active:pinFocused&&password.length===index-1}]"><text v-if="password.length>=index">●</text><view v-else-if="pinFocused&&password.length===index-1" class="pin-caret"/></view>
          <input class="pin-input" :focus="pinFocused" :value="password" type="number" maxlength="4" @input="handlePin" @blur="pinFocused=false" />
        </view>
        <text v-if="saving" class="state-text">正在开启…</text>
        <text v-else-if="error" class="error">{{error}}</text>
      </template>
      <template v-else>
        <text class="teen-title">青少年模式已开启</text>
        <text class="teen-subtitle">开启后按平台后台规则限制内容、使用时段及消费</text>
        <view class="exit-button" @tap="showExit=true">退出青少年模式</view>
      </template>
    </view>
    <view v-if="showExit" class="mask" @tap.self="closeExit">
      <view class="dialog">
        <text class="dialog-title">退出青少年模式</text>
        <text class="teen-subtitle">请输入4位监护密码</text>
        <input v-model="exitPassword" type="number" password maxlength="4" focus />
        <text v-if="error" class="error">{{error}}</text>
        <view class="dialog-actions"><view @tap="closeExit">取消</view><view @tap="disable">确定</view></view>
      </view>
    </view>
  </view>
</template>

<script>
import { api } from '@/services/api'
import { isDark } from '@/utils/app'
export default {
  data(){return{dark:false,loading:true,saving:false,enabled:false,password:'',pinFocused:false,showExit:false,exitPassword:'',error:''}},
  onLoad(){this.dark=isDark();this.load()},
  methods:{
    async load(){this.loading=true;this.error='';try{const state=await api.getTeenMode();this.enabled=!!state.enabled;uni.setStorageSync('teenMode',this.enabled)}catch(e){this.error=e.message||'青少年模式设置加载失败'}finally{this.loading=false}},
    focusPin(){if(!this.saving)this.pinFocused=true},
    handlePin(event){const value=String(event.detail.value||'').replace(/\D/g,'').slice(0,4);this.password=value;this.error='';if(value.length===4)this.enable()},
    async enable(){if(this.saving||this.password.length!==4)return;this.saving=true;this.pinFocused=false;this.error='';try{await api.enableTeenMode(this.password);this.enabled=true;this.password='';uni.setStorageSync('teenMode',true);uni.hideKeyboard();uni.showToast({title:'青少年模式已开启',icon:'success'})}catch(e){this.password='';this.error=e.message||'设置失败，请重试';this.$nextTick(()=>{this.pinFocused=true})}finally{this.saving=false}},
    closeExit(){if(this.saving)return;this.showExit=false;this.exitPassword='';this.error=''},
    async disable(){if(this.saving)return;if(!/^\d{4}$/.test(this.exitPassword)){this.error='请输入4位监护密码';return}this.saving=true;this.error='';try{await api.disableTeenMode(this.exitPassword);this.enabled=false;this.showExit=false;this.exitPassword='';this.pinFocused=true;uni.removeStorageSync('teenMode');uni.showToast({title:'青少年模式已关闭',icon:'success'})}catch(e){this.error=e.message||'退出失败，请重试'}finally{this.saving=false}}
  }
}
</script>

<style scoped>
.teen-page{background:#f7f7f7}.teen-content{padding-top:126rpx;display:flex;flex-direction:column;align-items:center;text-align:center}.teen-title{color:#050505;font-size:40rpx;font-weight:900;letter-spacing:8rpx;line-height:1.25}.teen-subtitle{margin-top:24rpx;color:#697181;font-size:26rpx}.code-boxes{position:relative;margin-top:116rpx;display:flex;gap:40rpx}.code-box{width:64rpx;height:64rpx;display:flex;align-items:center;justify-content:center;border:1rpx solid #bfc3c8;background:transparent;color:#111;font-size:24rpx}.code-box.active{border-color:#222}.pin-caret{width:2rpx;height:34rpx;background:#111;animation:pin-blink 1s steps(1) infinite}.pin-input{position:fixed;left:-200vw;top:0;width:2rpx;height:2rpx;opacity:0;color:transparent}.state-text,.error{margin-top:36rpx;font-size:24rpx}.state-text{color:#697181}.error{color:#f0445a}.exit-button{width:420rpx;height:84rpx;margin-top:88rpx;display:flex;align-items:center;justify-content:center;border:2rpx solid #222;border-radius:44rpx;background:#fff;color:#111;font-size:28rpx}.mask{position:fixed;z-index:100;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.52)}.dialog{width:590rpx;padding:42rpx;display:flex;flex-direction:column;align-items:center;border-radius:24rpx;background:#fff}.dialog-title{font-size:32rpx;font-weight:800}.dialog input{width:100%;height:82rpx;margin-top:32rpx;border:1rpx solid #cfd2d7;border-radius:12rpx;text-align:center;letter-spacing:22rpx}.dialog-actions{width:100%;margin-top:34rpx;display:grid;grid-template-columns:1fr 1fr;gap:20rpx}.dialog-actions view{height:76rpx;display:flex;align-items:center;justify-content:center;border:1rpx solid #d7d9de;border-radius:40rpx}.dialog-actions view:last-child{border-color:#222;background:#222;color:#fff}.dark.teen-page{background:#0e1117}.dark .teen-title{color:#fff}.dark .code-box{border-color:#697181;color:#fff}.dark .pin-caret{background:#fff}.dark .dialog{background:#191d25;color:#fff}@keyframes pin-blink{0%,48%{opacity:1}49%,100%{opacity:0}}
</style>
