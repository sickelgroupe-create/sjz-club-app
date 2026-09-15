<template><image :class="['ui-icon', tone]" :style="iconStyle" :src="src" mode="aspectFit" /></template>
<script>
export default {
  props: { name: { type: String, required: true }, size: { type: [Number, String], default: 40 }, tone: { type: String, default: 'default' } },
  computed: {
    src() { return '/static/icons/' + this.name + '.svg' },
    iconStyle() { const size = Number(this.size) || 40; return { width: size + 'rpx', height: size + 'rpx' } }
  }
}
</script>
<style scoped>
.ui-icon{display:block;flex-shrink:0}.default{filter:var(--icon-filter,none)}.muted{opacity:.52;filter:var(--icon-filter,none)}.soft{opacity:.72;filter:var(--icon-filter,none)}.white{filter:brightness(0) invert(1)}.primary{filter:invert(37%) sepia(83%) saturate(2101%) hue-rotate(325deg) brightness(99%) contrast(93%)}.gold{filter:invert(66%) sepia(92%) saturate(688%) hue-rotate(350deg) brightness(101%) contrast(93%)}.brand{filter:invert(39%) sepia(44%) saturate(2344%) hue-rotate(207deg) brightness(98%) contrast(94%)}
</style>
