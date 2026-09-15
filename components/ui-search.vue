<template>
  <view class="ui-search" :class="{ compact }">
    <ui-icon name="search" :size="34" tone="muted" />
    <input v-if="editable" :value="value" :placeholder="placeholder" confirm-type="search" @input="$emit('input',$event.detail.value)" @confirm="$emit('confirm',$event)" />
    <text v-else class="placeholder">{{ placeholder }}</text>
    <view v-if="editable && value" class="clear" hover-class="tap-active" @tap="$emit('input','')"><ui-icon name="x" :size="30" /></view>
  </view>
</template>
<script>export default{emits:['input','confirm'],props:{value:{type:String,default:''},placeholder:{type:String,default:'请输入关键词'},editable:{type:Boolean,default:true},compact:{type:Boolean,default:false}}}</script>
<style scoped>.ui-search{height:76rpx;padding:0 26rpx;display:flex;align-items:center;gap:14rpx;border:1rpx solid rgba(25,38,67,.03);border-radius:40rpx;background:var(--surface);box-shadow:0 7rpx 24rpx rgba(39,53,84,.045)}.ui-search.compact{height:68rpx}.ui-search input{min-width:0;flex:1;color:var(--text);font-size:26rpx}.placeholder{flex:1;color:var(--muted);font-size:26rpx}.clear{padding:12rpx;margin-right:-12rpx}</style>
