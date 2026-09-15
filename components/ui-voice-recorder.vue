<template>
  <view class="voice-editor">
    <text class="voice-title">个人语音（1至60秒）</text>
    <text v-if="recording">正在录制 {{ elapsed }} 秒</text>
    <view class="voice-actions">
      <button size="mini" :disabled="busy" @tap="recording ? stop() : start()">{{ recording ? '停止录音' : (modelValue ? '重新录制' : '开始录音') }}</button>
      <button v-if="modelValue && !recording" size="mini" :disabled="busy" @tap="play">{{ playing ? '停止试听' : '试听' }}</button>
      <button v-if="modelValue && !recording" size="mini" :disabled="busy" @tap="remove">删除语音</button>
    </view>
    <text v-if="busy">{{recording ? '' : '正在处理录音…'}}</text>
    <text v-if="error" class="voice-error">{{ error }}</text>
    <text v-else-if="!modelValue && !recording">暂无语音</text>
  </view>
</template>
<script>
import { api } from '@/services/api'
// #ifdef H5
import { startBrowserVoice, voiceError } from '@/utils/browser-voice.mjs'
// #endif
export default {
  props: { modelValue: {type:String,default:''} }, emits:['update:modelValue','duration','busy'],
  data(){return{recording:false,busy:false,playing:false,elapsed:0,error:'',disposed:false}},
  beforeUnmount(){this.disposed=true;clearInterval(this.timer);this.capture?.cancel?.();if(this.manager){this.manager.offStop(this.stopped);this.manager.offError(this.failed);if(this.recording)this.manager.stop()}this.audio?.destroy?.();this.audio?.pause?.();this.$emit('busy',false)},
  methods:{
    setBusy(value){this.busy=value;this.$emit('busy',value||this.recording)},
    async start(){
      this.error='';this.audio?.stop?.();this.audio?.pause?.();this.playing=false;this.setBusy(true)
      try {
        // #ifdef H5
        this.capture=await startBrowserVoice()
        if(this.disposed){this.capture.cancel();return}
        // #endif
        // #ifdef MP-WEIXIN
        await new Promise((resolve,reject)=>uni.authorize({scope:'scope.record',success:resolve,fail:()=>reject(new Error('请在小程序设置中允许麦克风权限后重试'))}))
        if(this.disposed)return
        if(!this.manager){this.manager=uni.getRecorderManager();this.stopped=result=>{this.recording=false;clearInterval(this.timer);this.upload(result.tempFilePath,Math.max(1,Math.ceil(result.duration/1000)))};this.failed=()=>{this.recording=false;clearInterval(this.timer);this.error='录音失败，请检查麦克风权限';this.setBusy(false)};this.manager.onStop(this.stopped);this.manager.onError(this.failed)}
        this.manager.start({duration:60000,sampleRate:16000,numberOfChannels:1,encodeBitRate:48000,format:'mp3'})
        // #endif
        this.recording=true;this.elapsed=0;this.setBusy(false)
        this.timer=setInterval(()=>{this.elapsed++;if(this.elapsed>=60)this.stop()},1000)
      }catch(error){this.error=error.message||'录音失败';
        // #ifdef H5
        this.error=voiceError(error)
        // #endif
        this.setBusy(false)
      }
    },
    async stop(){if(!this.recording)return;clearInterval(this.timer);this.recording=false;this.setBusy(true)
      // #ifdef H5
      try{const clip=this.capture.stop();const path=URL.createObjectURL(clip.blob);try{await this.upload(path,clip.seconds)}finally{URL.revokeObjectURL(path)}}catch(e){this.error=e.message;this.setBusy(false)}
      // #endif
      // #ifdef MP-WEIXIN
      this.manager.stop()
      // #endif
    },
    async upload(path,seconds){if(this.disposed)return;this.setBusy(true);try{const result=await api.uploadVoice(path,seconds);if(!this.disposed){this.$emit('update:modelValue',result.url);this.$emit('duration',result.seconds)}}catch(e){this.error=e.message||'录音上传失败，请重新录制'}finally{if(!this.disposed)this.setBusy(false)}},
    play(){
      // #ifdef H5
      if(this.playing){this.audio?.pause();this.playing=false;return}
      if(!this.audio){this.audio=new Audio();this.audio.onended=()=>this.playing=false;this.audio.onerror=()=>{this.playing=false;this.error='语音播放失败，请重新录制'}}
      this.audio.src=this.modelValue;this.audio.play().then(()=>{this.playing=true}).catch(e=>{this.playing=false;if(e.name!=='AbortError')this.error='语音播放失败，请重新录制'});return
      // #endif
      // #ifdef MP-WEIXIN
      if(this.playing){this.audio?.stop();this.playing=false;return}if(!this.audio){this.audio=uni.createInnerAudioContext();this.audio.onPlay(()=>this.playing=true);this.audio.onEnded(()=>this.playing=false);this.audio.onError(()=>{this.playing=false;this.error='语音播放失败，请重新录制'})}this.audio.src=this.modelValue;this.audio.play()
      // #endif
    },
    remove(){this.audio?.stop?.();this.audio?.pause?.();this.playing=false;this.$emit('update:modelValue','');this.$emit('duration',0)}
  }
}
</script>
<style scoped>.voice-editor{display:flex;flex-direction:column;gap:16rpx;margin-top:18rpx;padding:20rpx;border:1rpx solid var(--line);border-radius:16rpx;font-size:26rpx}.voice-title{font-weight:600}.voice-actions{display:flex;flex-wrap:wrap;gap:12rpx}.voice-actions button{margin:0;font-size:24rpx}.voice-error{color:var(--primary)}</style>
