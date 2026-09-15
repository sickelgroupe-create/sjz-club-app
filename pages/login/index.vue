<template>
  <view :class="['app-page',{dark}]">
    <ui-header title="登录注册" back/>
    <view class="login-hero"><image src="/static/logo.png" mode="aspectFit"/><text class="hero-title">品奢电竞</text><text>微信快捷登录或手机号密码登录</text></view>
    <view class="login-card">
      <view class="mode-tabs"><view :class="['mode-tab',{active:mode==='password'}]" @tap="setMode('password')">密码登录</view><view :class="['mode-tab',{active:mode==='register'}]" @tap="setMode('register')">手机号注册</view></view>
      <text class="label">手机号</text><input v-model.trim="phone" type="number" maxlength="11" placeholder="请输入手机号"/>
      <text class="label field-label">密码</text><input v-model="password" password maxlength="64" placeholder="请输入密码"/>
      <template v-if="mode==='register'"><text class="password-tip">8至64位，须包含字母和数字</text><text class="label field-label">确认密码</text><input v-model="confirmPassword" password maxlength="64" placeholder="请再次输入密码"/></template>
      <text v-if="error" class="error">{{error}}</text>
      <view class="agreement"><text>请阅读并同意</text><text class="link" @tap="openDoc('agreement')">《用户协议》</text><text class="link" @tap="openDoc('privacy')">《隐私政策》</text></view>
      <view class="check-row" @tap="agreed=!agreed"><view :class="['check',{on:agreed}]"><ui-icon v-if="agreed" name="check" :size="24"/></view><text>我已阅读并同意协议，并确认本人已年满18周岁</text></view>
    </view>
    <view class="login-actions"><ui-button :open-type="registrationOpenType" :disabled="submitting || (mode==='register'&&!agreed)" @getphonenumber="registerPhone" :label="submitting?'处理中…':mode==='register'?'注册并登录':'密码登录'" @tap="submit"/><view class="wechat-button" @tap="wechatSubmit"><ui-icon name="wechat" :size="38" tone="primary"/><text>微信快捷登录</text></view><text class="safe-tip">手机号登录后绑定当前微信，下次可使用微信快捷登录</text></view>
  </view>
</template>
<script>
import { api } from '@/services/api'
import { isDark } from '@/utils/app'
import { wechatCode } from '@/services/wechat-auth'
export default {
  data(){return{dark:false,mode:'password',phone:'',password:'',confirmPassword:'',agreed:false,submitting:false,error:'',bindingPending:false}},
  computed:{registrationOpenType(){let native=false
    // #ifdef MP-WEIXIN
    native=true
    // #endif
    return native&&this.mode==='register'?'getPhoneNumber':''
  }},
  onLoad(){this.dark=isDark();this.bindingPending=!!uni.getStorageSync('wechatBindingRequired')},
  methods:{
    setMode(mode){if(this.submitting)return;if(this.bindingPending){['token','refreshToken','user','wechatBindingRequired','phoneBindingRequired'].forEach(key=>uni.removeStorageSync(key));this.bindingPending=false}this.mode=mode;this.password='';this.confirmPassword='';this.error=''},
    registerPhone(event){const code=event?.detail?.code;if(!code){this.error='未获得手机号授权，请允许微信验证号码后注册';return}return this.submit(code)},
    async submit(phoneCode=''){
      if(this.submitting)return
      if(this.bindingPending){return this.retryWechatBinding()}
      if(!/^1[3-9]\d{9}$/.test(this.phone)){this.error='请输入正确的手机号';return}
      if(!this.password){this.error='请输入密码';return}
      if(this.mode==='register'){
        if(this.password.length<8||this.password.length>64||!/[A-Za-z]/.test(this.password)||!/[0-9]/.test(this.password)){this.error='密码需8至64位，并同时包含字母和数字';return}
        if(this.password!==this.confirmPassword){this.error='两次输入的密码不一致';return}
      }
      if(!this.agreed){this.error='请先阅读并同意协议';return}
      if(this.mode==='register'&&(typeof phoneCode!=='string'||!phoneCode)){this.error='请在微信小程序中授权手机号后注册';return}
      this.submitting=true;this.error=''
      try{
        if(this.mode==='register'){await api.phoneRegister({phone:this.phone,password:this.password,phoneCode});this.mode='password'}
        else {
          const session=await api.passwordLogin({account:this.phone,password:this.password})
          if(session.wechatBindingRequired!==true){
            this.bindingPending=false
            uni.removeStorageSync('wechatBindingRequired')
            this.done()
            return
          }
        }
        this.bindingPending=true;uni.setStorageSync('wechatBindingRequired',true)
        await this.completeWechatBinding()
        this.done()
      }catch(e){if(this.bindingPending&&!uni.getStorageSync('wechatBindingRequired'))this.bindingPending=false;this.error=e.message||'登录失败，请重试'}finally{this.submitting=false}
    },
    async completeWechatBinding(){
      const result=await api.bindWechat(await wechatCode())
      if(result.mergeRequired)throw new Error('当前微信已有其他账号，不能绑定；请使用原微信账号登录或联系客服，尚未开放下单')
      if(result.wechatBound!==true)throw new Error('微信尚未绑定成功，请重试，绑定成功后才能使用和下单')
      this.bindingPending=false;uni.removeStorageSync('wechatBindingRequired')
    },
    async retryWechatBinding(){
      if(this.submitting)return
      this.submitting=true;this.error=''
      try{await this.completeWechatBinding();this.done()}
      catch(e){if(!uni.getStorageSync('wechatBindingRequired'))this.bindingPending=false;this.error=e.message||'微信绑定失败，请重试，绑定成功后才能使用和下单'}
      finally{this.submitting=false}
    },
    async wechatSubmit(){
      if(this.submitting)return
      if(this.bindingPending)return this.retryWechatBinding()
      if(!this.agreed){this.error='请先阅读并同意协议';return}
      this.submitting=true;this.error=''
      try{await api.wechatLogin({code:await wechatCode()});this.done()}catch(e){this.error=e.message||'微信登录失败，请重试'}finally{this.submitting=false}
    },
    done(){if(this.bindingPending||uni.getStorageSync('wechatBindingRequired')){this.error='请先完成微信绑定';return}const next=uni.getStorageSync('loginNext');uni.removeStorageSync('loginNext');if(!uni.getStorageSync('preferences')){uni.redirectTo({url:'/pages/onboarding/index?next='+encodeURIComponent(next||'/pages/profile/index')});return}uni.reLaunch({url:next||'/pages/profile/index'})},
    openDoc(type){uni.navigateTo({url:'/pages/common/document?type='+type})}
  }
}
</script>
<style scoped>
.login-hero{padding:36rpx 0 16rpx;display:flex;flex-direction:column;align-items:center;gap:10rpx;color:var(--muted);font-size:23rpx}.login-hero image{width:100rpx;height:100rpx;border-radius:24rpx}.hero-title{color:var(--text);font-size:34rpx;font-weight:800}.login-card{margin:16rpx 28rpx;padding:26rpx 34rpx 36rpx;border-radius:26rpx;background:var(--surface);box-shadow:var(--shadow-card)}.mode-tabs{display:grid;grid-template-columns:repeat(2,1fr);gap:8rpx;margin-bottom:32rpx;padding:6rpx;border-radius:18rpx;background:var(--surface-soft)}.mode-tab{height:62rpx;display:flex;align-items:center;justify-content:center;border-radius:14rpx;color:var(--muted);font-size:22rpx}.mode-tab.active{background:var(--surface);color:var(--primary);font-weight:700}.label{display:block;margin-bottom:10rpx;color:var(--text-secondary);font-size:24rpx;font-weight:700}.field-label{margin-top:25rpx}.login-card input{height:80rpx;line-height:normal;padding:0 4rpx;border-bottom:1rpx solid var(--line);color:var(--text);font-size:28rpx}.password-tip{display:block;margin-top:12rpx;color:var(--muted);font-size:21rpx;line-height:30rpx}.agreement{display:flex;flex-wrap:wrap;margin-top:28rpx;font-size:22rpx}.link{color:var(--primary)}.check-row{display:flex;align-items:flex-start;gap:10rpx;margin-top:16rpx;color:var(--muted);font-size:21rpx;line-height:30rpx}.check{width:32rpx;height:32rpx;flex-shrink:0;border:2rpx solid #c9cdd2;border-radius:50%;display:flex;align-items:center;justify-content:center}.check.on{border-color:var(--primary);background:var(--primary)}.error{display:block;margin-top:16rpx;color:var(--primary);font-size:22rpx}.login-actions{padding:20rpx 76rpx 42rpx}.wechat-button{height:84rpx;margin-top:20rpx;display:flex;align-items:center;justify-content:center;gap:14rpx;border:2rpx solid var(--line);border-radius:44rpx;background:var(--surface);color:var(--text);font-size:26rpx}.safe-tip{display:block;margin-top:20rpx;text-align:center;color:var(--muted);font-size:20rpx;line-height:30rpx}
</style>
