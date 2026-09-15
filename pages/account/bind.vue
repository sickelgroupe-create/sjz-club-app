<template>
  <view :class="['app-page','bind-page',{dark}]">
    <ui-header title="账号与安全" back/>
    <view class="card"><view class="head"><text class="section-title">微信账号</text><text class="state">{{state.wechatBound?'已绑定':'未绑定'}}</text></view><button v-if="!state.wechatBound" class="primary-btn" :disabled="busy" @tap="bindWechat">一键绑定当前微信</button><text v-else class="muted">可使用微信快捷登录</text></view>
    <view class="card"><view class="head"><text class="section-title">手机号登录</text><text class="muted">{{state.phone||'未设置手机号账号'}}</text></view>
      <!-- #ifdef MP-WEIXIN -->
      <button v-if="!state.phone" class="primary-btn" open-type="getPhoneNumber" :disabled="busy" :loading="busy" @getphonenumber="bindPhone">设置手机号</button>
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <button v-if="!state.phone" class="primary-btn" @tap="phoneHelp">设置手机号</button>
      <!-- #endif -->
      <text class="muted">{{state.phone?'手机号已绑定当前 UID，可配合登录密码使用。':'经微信授权后绑定到当前 UID，原有订单和余额不变。'}}</text>
      <text v-if="phoneError" class="error">{{phoneError}}</text>
    </view>
    <view class="card">
      <text class="section-title">重置登录密码</text>
      <text class="field-label">原密码</text><input v-model="oldPassword" password maxlength="64" placeholder="请输入原密码"/>
      <text v-if="state.wechatBound" class="muted">忘记原密码可使用下方微信验证重置</text>
      <text class="field-label">新密码</text><input v-model="password" password maxlength="64" placeholder="请输入新密码"/>
      <text class="muted">8至64位，须同时包含字母和数字</text>
      <text class="field-label">确认新密码</text><input v-model="confirmPassword" password maxlength="64" placeholder="请再次输入新密码"/>
      <text v-if="error" class="error">{{error}}</text>
      <button class="primary-btn" :disabled="busy" @tap="resetPassword(false)">确认修改密码</button>
      <button v-if="state.wechatBound" class="wechat-reset" :disabled="busy" @tap="resetPassword(true)">使用当前绑定微信验证重置</button>
    </view>
  </view>
</template>
<script>
import { api } from '@/services/api'
import { isDark } from '@/utils/app'
import { wechatCode } from '@/services/wechat-auth'
export default{
  onLoad(options){this.requiredPhone=options?.requiredPhone==='1'},
  data(){return{contactPhone:'',contactPassword:'',dark:false,requiredPhone:false,state:{},oldPassword:'',password:'',confirmPassword:'',busy:false,error:'',phoneError:''}},
  onShow(){this.dark=isDark();if(!this.busy)this.load()},
  methods:{
    finishPhoneBinding(){
      if(!this.requiredPhone)return
      const next=uni.getStorageSync('loginNext')||'/pages/profile/index'
      uni.removeStorageSync('loginNext')
      if(!uni.getStorageSync('preferences'))uni.redirectTo({url:'/pages/onboarding/index?next='+encodeURIComponent(next)})
      else uni.reLaunch({url:next})
    },
    phoneHelp(){uni.showModal({title:'设置手机号',content:'请在微信小程序中点击“设置手机号”，同意微信手机号授权后完成绑定。',showCancel:false})},
    async bindPhone(event){
      if(this.busy)return
      const code=event?.detail?.code
      if(!code){this.phoneError='未获得手机号授权，请点击“设置手机号”后允许微信授权。';return}
      this.busy=true;this.phoneError=''
      try{const result=await api.bindPhone(code);if(!result.phone)throw new Error('绑定结果未确认，请刷新后检查');this.state=result;uni.setStorageSync('user',result);uni.showToast({title:'手机号已绑定',icon:'success'});this.finishPhoneBinding()}
      catch(e){this.phoneError=e.message||'手机号绑定失败，请重新授权'}finally{this.busy=false}
    },
    async load(){try{this.state=await api.getBindings();this.contactPhone=this.state.phone||'';if(this.state.phoneBound===true){uni.removeStorageSync('phoneBindingRequired');this.finishPhoneBinding()}}catch(e){this.error=e.message||'账号状态加载失败'}},
    async bindWechat(){
      if(this.busy)return
      this.busy=true;this.error=''
      try{const result=await api.bindWechat(await wechatCode());if(result.mergeRequired)throw new Error('当前微信已关联其他账号，请使用微信登录原账号或联系客服处理');this.state=result;uni.showToast({title:'绑定成功',icon:'success'})}catch(e){this.error=e.message||'绑定失败';uni.showToast({title:this.error,icon:'none'})}finally{this.busy=false}
    },
    async resetPassword(byWechat){
      if(this.busy)return
      if(this.password.length<8||this.password.length>64||!/[A-Za-z]/.test(this.password)||!/[0-9]/.test(this.password)){this.error='新密码需8至64位，并同时包含字母和数字';return}
      if(this.password!==this.confirmPassword){this.error='两次输入的新密码不一致';return}
      if(!byWechat&&!this.oldPassword){this.error='请输入原密码';return}
      this.busy=true;this.error=''
      try{const proof=byWechat?{wechatCode:await wechatCode()}:{oldPassword:this.oldPassword};await api.resetPassword({password:this.password,...proof});this.oldPassword='';this.password='';this.confirmPassword='';uni.showToast({title:'密码已更新',icon:'success'})}catch(e){this.error=e.message||'密码重置失败'}finally{this.busy=false}
    }
  }
}
</script>
<style scoped>
.bind-page{padding-bottom:50rpx}.card{margin:22rpx 28rpx;padding:28rpx;border-radius:24rpx;background:var(--surface);box-shadow:var(--shadow-card)}.head{display:flex;align-items:center;justify-content:space-between;gap:16rpx}.section-title{font-size:29rpx;font-weight:700}.muted{display:block;margin-top:12rpx;color:var(--muted);font-size:22rpx;line-height:34rpx}.state{padding:9rpx 18rpx;border-radius:24rpx;background:var(--primary-soft);color:var(--primary);font-size:22rpx}.field-label{display:block;margin-top:26rpx;font-size:24rpx;color:var(--text)}.card input{box-sizing:border-box;width:100%;height:88rpx;min-height:88rpx;margin-top:12rpx;padding:0 20rpx;line-height:normal;font-size:28rpx;border:1rpx solid var(--line);border-radius:16rpx;color:var(--text);background:var(--surface)}.card .primary-btn{margin-top:24rpx}.wechat-reset{margin-top:18rpx;border-radius:40rpx;background:var(--surface-soft);color:var(--primary);font-size:24rpx}.error{display:block;margin-top:16rpx;color:var(--primary);font-size:23rpx;line-height:34rpx}
</style>
