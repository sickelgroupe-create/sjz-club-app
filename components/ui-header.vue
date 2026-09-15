<template>
  <view class="nav" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="bar" :style="{ height: navBarHeight + 'px' }">
      <navigator v-if="back && canGoBack" class="back-hit" open-type="navigateBack" :delta="1" hover-class="back-active">
        <ui-icon name="arrow-left" :size="48" />
      </navigator>
      <navigator v-else-if="back" class="back-hit" url="/pages/index/index" open-type="reLaunch" hover-class="back-active">
        <ui-icon name="arrow-left" :size="48" />
      </navigator>
      <text class="title">{{ title }}</text>
    </view>
  </view>
</template>

<script>
export default {
  props: { title: { type: String, default: '' }, back: { type: Boolean, default: false } },
  data() { return { statusBarHeight: 20, navBarHeight: 44, canGoBack: false } },
  created() {
    const system = uni.getSystemInfoSync()
    this.statusBarHeight = system.statusBarHeight || 20
    // #ifdef MP-WEIXIN
    const capsule = uni.getMenuButtonBoundingClientRect()
    if (capsule && capsule.height) {
      const gap = Math.max(4, capsule.top - this.statusBarHeight)
      this.navBarHeight = capsule.height + gap * 2
    }
    // #endif
  },
  mounted() {
    this.canGoBack = getCurrentPages().length > 1
  }
}
</script>

<style scoped>
.nav { position: relative; z-index: 100; background: var(--surface); color: var(--text); }
.bar { position: relative; min-height: 88rpx; display: flex; align-items: center; justify-content: center; padding: 0 150rpx; }
.back-hit { position: absolute; z-index: 3; top: 0; bottom: 0; left: 0; width: 124rpx; display: flex; align-items: center; padding-left: 28rpx; color: var(--text); }
.back-active { background: var(--surface-soft); opacity: .72; }
.title { display: block; max-width: 430rpx; color: var(--text); font-size: 34rpx; font-weight: 500; line-height: 1.25; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; text-align: center; }
</style>
