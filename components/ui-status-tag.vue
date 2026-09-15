<template><text :class="['tag',tone]">{{ label }}<slot/></text></template>
<script>export default{props:{label:{type:String,default:''},tone:{type:String,default:'brand'}}}</script>
<style scoped>.tag{display:inline-flex;align-items:center;justify-content:center;min-height:36rpx;padding:0 14rpx;border-radius:18rpx;font-size:20rpx}.brand{background:var(--brand-soft);color:var(--brand)}.success{background:#e8f9ef;color:#20b960}.warning{background:#fff2df;color:#e98a24}.danger{background:var(--primary-soft);color:var(--primary)}.neutral{background:var(--surface-soft);color:var(--muted)}</style>
