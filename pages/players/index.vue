<template>
  <view :class="['app-page', { dark }]">
    <ui-header title="打手列表" />
    <ui-filter-bar :value="filter" :items="tabs" @input="changeFilter" />
    <view class="search-wrap"><ui-search :value="keyword" placeholder="搜索陪玩昵称" @input="keyword=$event;load()" /></view>
    <view class="player-list">
      <view v-for="item in players" :key="item.id" class="player-card">
        <view class="avatar-wrap"><image :src="item.image" mode="aspectFill" /><ui-status-tag :label="item.online ? '在线' : '暂不接单'" :tone="item.online ? 'success' : 'neutral'" class="online"/><view :class="['voice', { playing: playing === item.id }]" @tap="toggleVoice(item)"><ui-icon name="volume-wave" :size="32"/><text>{{ item.voice }}″</text></view></view>
        <view class="player-info"><text class="player-name">{{ item.name }}</text><view :class="['gender', { female: item.gender === 'female' }]"><ui-icon :name="item.gender === 'male' ? 'male' : 'female'" :size="28"/><text>{{ item.age }}｜{{ item.city }}</text></view><text class="intro">{{ item.intro }}</text><ui-status-tag label="三角洲行动" tone="success"/></view>
        <view class="player-price" v-if="item.minPrice!=null">¥{{money(item.minPrice)}}<text>起</text></view>
        <view v-if="item.online&&item.productId&&item.skuId" class="order-btn" @tap="openOffers(item)" hover-class="tap-active">选择服务</view>
        <view v-else class="order-btn disabled">暂不接单</view>
      </view>
    </view>
    <view v-if="!loading&&!players.length" class="empty-players"><text>{{loadError||'暂无符合条件的在线打手'}}</text><view @tap="load(true)">刷新列表</view></view>
    <ui-bottom-nav active="players" />
    <view v-if="offerPlayer" class="offer-mask" @tap="closeOffers"><view class="offer-sheet" @tap.stop>
      <view class="offer-header"><text>{{offerPlayer.name}}的服务</text><view @tap="closeOffers">关闭</view></view>
      <text class="offer-hint">价格由平台设置，请选择本次购买的服务规格。</text>
      <scroll-view scroll-y class="offer-list">
        <text v-if="offersLoading" class="offer-hint">正在加载服务…</text>
        <view v-for="offer in offers" :key="offer.skuId" class="offer-row"><image v-if="offer.image" :src="offer.image" mode="aspectFill"/><view class="offer-content"><text class="offer-name">{{offer.productName}}</text><text class="offer-hint">{{offer.skuName}}</text><text class="offer-price">¥{{money(offer.price)}}</text></view><view class="offer-buy" @tap="chooseOffer(offer)">选这个</view></view>
        <view v-if="!offersLoading&&!offers.length" class="offer-hint">{{offerError||'该打手暂时没有可购买的服务，请刷新列表或选择其他打手。'}}</view>
      </scroll-view>
    </view></view>
  </view>
</template>
<script>
import { api } from '@/services/api'
import { isDark } from '@/utils/app'
import { offerOrderUrl } from '@/services/player-catalog.mjs'
export default {
  data() { return { dark: false, filter: '', keyword: '', players: [], page: 1, pageSize: 20, hasMore: false, loading: false,loadError:'',loadSequence:0,offerPlayer:null,offers:[],offersLoading:false,offerError:'',offerSequence:0, playing: '', audioContext: null, tabs: [{ key: '', label: '全部' }, { key: 'male', label: '男神' }, { key: 'female', label: '女神' }] } },
  onLoad() { this.dark = isDark() }, onShow() { this.dark = isDark(); this.load(true) },
  onHide(){this.closeOffers();this.disposeVoice()},
  onReachBottom() { if (this.hasMore && !this.loading) this.load(false) },
  onUnload() { this.disposeVoice() },
  methods: {
    async load(reset = true) { if(this.loading&&!reset)return;const sequence=++this.loadSequence;if (reset) { this.page = 1; this.players = [] }; this.loading = true;this.loadError=''; try { const result = await api.getPlayerPage({ gender: this.filter, keyword: this.keyword, sort: 'default', page: this.page, pageSize: this.pageSize });if(sequence!==this.loadSequence)return; this.players = reset ? result.items : [...this.players, ...result.items]; this.hasMore = !!result.hasMore; this.page = Number(result.page || this.page) + 1 } catch (e) {if(sequence===this.loadSequence){this.loadError=e.message||'打手加载失败';uni.showToast({ title: this.loadError, icon: 'none' })}} finally {if(sequence===this.loadSequence)this.loading = false } },
    money(value){return Number(value||0).toFixed(2)},
    async openOffers(player){this.disposeVoice();const sequence=++this.offerSequence;this.offerPlayer=player;this.offers=[];this.offerError='';this.offersLoading=true;try{const offers=await api.getPlayerOffers(player.id);if(sequence===this.offerSequence)this.offers=offers||[]}catch(e){if(sequence===this.offerSequence)this.offerError=e.message||'服务加载失败，请关闭后重试'}finally{if(sequence===this.offerSequence)this.offersLoading=false}},
    closeOffers(){this.offerSequence++;this.offerPlayer=null;this.offers=[];this.offersLoading=false},
    chooseOffer(offer){const url=offerOrderUrl(offer,this.offerPlayer?.id);if(!url){uni.showToast({title:'服务信息已变化，请重新选择',icon:'none'});return}uni.navigateTo({url})},
    changeFilter(key) { this.filter = key; this.load(true) },
    disposeVoice() {
      const audio = this.audioContext
      this.audioContext = null
      this.playing = ''
      if (!audio) return
      try { audio.stop() } catch (_) {}
      try { audio.destroy() } catch (_) {}
    },
    finishVoice(audio) {
      if (this.audioContext !== audio) return
      this.audioContext = null
      this.playing = ''
      try { audio.destroy() } catch (_) {}
    },
    toggleVoice(item) {
      if (!item.voiceUrl) { uni.showToast({ title: '暂无语音介绍', icon: 'none' }); return }
      if (this.playing === item.id) { this.disposeVoice(); return }
      this.disposeVoice()
      const audio = uni.createInnerAudioContext()
      this.audioContext = audio
      this.playing = item.id
      audio.autoplay = false
      audio.src = item.voiceUrl
      audio.onEnded(() => this.finishVoice(audio))
      audio.onStop(() => this.finishVoice(audio))
      audio.onError(() => {
        if (this.audioContext !== audio) return
        this.finishVoice(audio)
        uni.showToast({ title: '语音播放失败，请重试', icon: 'none' })
      })
      audio.play()
    }
  }
}
</script>
<style scoped>
.player-card{padding-bottom:92rpx!important}.player-price{position:absolute;bottom:30rpx;left:24rpx;color:var(--primary);font-size:30rpx;font-weight:700}.player-price text{font-size:22rpx;margin-left:6rpx;font-weight:400}.empty-players{text-align:center;padding:80rpx 24rpx;color:var(--muted);font-size:26rpx}.empty-players>view{margin-top:24rpx;color:var(--primary)}.offer-mask{position:fixed;inset:0;z-index:220;display:flex;align-items:flex-end;background:rgba(0,0,0,.5)}.offer-sheet{width:100%;border-radius:28rpx 28rpx 0 0;padding:28rpx 26rpx calc(28rpx + env(safe-area-inset-bottom));background:var(--surface)}.offer-header{display:flex;justify-content:space-between;gap:20rpx;font-size:30rpx;font-weight:700}.offer-header>view{color:var(--primary);font-size:25rpx;flex-shrink:0}.offer-hint{display:block;color:var(--muted);font-size:23rpx;line-height:1.6;margin-top:10rpx}.offer-list{max-height:60vh;margin-top:18rpx}.offer-row{display:flex;gap:18rpx;align-items:center;padding:22rpx 0;border-top:1rpx solid var(--line)}.offer-row>image{width:90rpx;height:90rpx;border-radius:12rpx;flex-shrink:0}.offer-content{flex:1;min-width:0}.offer-name{font-size:27rpx;word-break:break-all}.offer-price{display:block;color:var(--primary);margin-top:8rpx;font-size:28rpx}.offer-buy{padding:12rpx 20rpx;border-radius:24rpx;background:var(--primary);color:#fff;font-size:24rpx;flex-shrink:0}
.search-wrap{margin:18rpx 24rpx}.player-list{padding:0 22rpx 28rpx}.player-card{position:relative;display:flex;gap:22rpx;min-height:220rpx;margin-bottom:18rpx;padding:24rpx;border:1rpx solid rgba(24,35,58,.03);border-radius:24rpx;background:var(--surface);box-shadow:var(--shadow-card)}.avatar-wrap{position:relative;width:170rpx;height:170rpx;flex-shrink:0}.avatar-wrap image{width:100%;height:100%;border-radius:20rpx}.online{position:absolute;top:8rpx;left:8rpx}.voice{position:absolute;left:20rpx;bottom:8rpx;height:38rpx;padding:0 13rpx;display:flex;align-items:center;gap:6rpx;border-radius:20rpx;color:#2abb61;background:rgba(255,255,255,.94);font-size:20rpx}.voice.playing{box-shadow:0 0 0 5rpx rgba(47,200,101,.18)}.player-info{min-width:0;flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:9rpx}.player-name{font-size:29rpx;font-weight:700}.gender{display:flex;align-items:center;gap:5rpx;color:#477df5;font-size:22rpx}.gender.female{color:#ff5e91}.intro{max-width:300rpx;color:var(--muted);font-size:22rpx;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.order-btn{position:absolute;right:22rpx;bottom:24rpx;padding:14rpx 26rpx;border-radius:32rpx;background:var(--primary);color:#fff;box-shadow:0 8rpx 18rpx rgba(240,68,90,.18);font-size:24rpx}
.order-btn.disabled{background:#c8ccd4;box-shadow:none}
</style>
