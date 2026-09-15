<template>
  <view :class="['app-page', { dark }]">
    <ui-header title="品奢电竞" />
    <navigator class="search-wrap" url="/pages/product/list" hover-class="tap-active"><ui-search :editable="false" placeholder="搜索商品或服务" /></navigator>

    <swiper class="hero" circular autoplay indicator-dots indicator-active-color="#ffffff">
      <swiper-item v-for="item in banners" :key="item.id">
        <navigator class="hero-link" :url="promotionUrl(item)" hover-class="tap-active">
          <image :src="item.image" mode="aspectFill" />
          <view class="hero-shade"><text class="hero-kicker">PIN SHE ESPORTS</text><text class="hero-title" :style="{ color: item.color, fontSize: item.titleSize + 'rpx' }">{{ item.title }}</text><text class="hero-sub">{{ item.subtitle }}</text></view>
        </navigator>
      </swiper-item>
    </swiper>

    <navigator v-if="loggedIn" class="balance-card" url="/pages/wallet/recharge" hover-class="tap-active">
      <view><text>余额：</text><text class="balance-value">{{money(balance)}}</text></view><view class="recharge-button">立即充值</view>
    </navigator>

    <view class="category-card">
      <navigator v-for="(item,index) in categories" :key="item.id" :class="['category','category-'+item.id]" :url="categoryUrl(item)" hover-class="tap-active">
        <view class="category-icon"><image class="operator-avatar" :src="operatorAvatar(item,index)" mode="aspectFill" @error="operatorImageError(item)"/></view>
        <text class="category-name">{{ item.name }}</text>
      </navigator>
    </view>

    <view class="headline"><text class="section-title">热门推荐</text><navigator class="more" url="/pages/product/list?hot=true&title=热门推荐" hover-class="tap-active"><text>查看全部</text><ui-icon name="chevron-right" :size="26"/></navigator></view>
    <view class="products">
      <ui-product-card v-for="item in products" :key="item.id" :product="item" />
    </view>

    <ui-floating-actions />
    <ui-bottom-nav active="home" />
    <ui-rule-gate v-if="showRule && startupConfig && startupConfig.enabled !== false" :config="startupConfig" @close="closeNotice" @view="viewNotice" />
  </view>
</template>

<script>
import { api } from '@/services/api'
import { isDark, validMiniProgramUrl } from '@/utils/app'
export default {
  data() { return { dark:false,loggedIn:false,balance:0,showRule:false,homeReady:false,categories:[],products:[],news:[],banners:[],startupConfig:null,customerService:{} } },
  onLoad() {
    this.dark = isDark()
    this.loadHome()
    api.getCustomerService().then(data=>{this.customerService=data||{}}).catch(()=>{})
  },
  onShow(){this.dark=isDark();this.loggedIn=!!uni.getStorageSync('token');if(this.loggedIn)this.loadBalance();if(this.homeReady)this.loadHome()},
  onHide(){this.showRule=false},
  methods: {
    loadHome(){return api.getHome().then(data => {
      const currentUser=uni.getStorageSync('user')||{}
      const role=currentUser.userType||'user'
      this.categories=(data.categories||[]).filter(item=>!String(item.targetUrl||'').includes('type=merchant')&&(!item.roleScope||item.roleScope==='all'||item.roleScope===role))
      this.products = data.products || []
      this.news = data.news
      this.banners = data.promotions.homeBanners.filter(i => i.enabled).sort((a,b) => a.sort - b.sort)
      this.startupConfig = data.promotions.startup
      this.homeReady=true
      this.openNotice()
    }).catch(error => { uni.showToast({title:error.message||'首页加载失败',icon:'none'}) })
    },
    money(value){return Number(value||0).toFixed(2)},
    operatorAvatar(item,index){
      const fallback={service:1,anchor:2,new:3,special:4,space:5,prison:6,guarantee:7,fun:8,hour:9,evac:10}
      const number=fallback[item.id]||((index%10)+1)
      const configured=String(item.avatarImage||'');return /^\/?static\/images\/operators\/operator-\d+\.webp$/.test(configured)?configured.replace('.webp','.png'):(configured||`/static/images/operators/operator-${String(number).padStart(2,'0')}.png`)
    },
    operatorImageError(item){item.avatarImage=''},
    async loadBalance(){try{const wallet=await api.getWallet();this.balance=wallet.balance||0}catch(e){}},
    openNotice(){
      if(!this.startupConfig||this.startupConfig.enabled===false)return
      const app=getApp()
      const global=app.globalData||(app.globalData={})
      const token=String(global.noticeTriggerToken||'')
      if(!token||global.noticeConsumedToken===token)return
      global.noticeConsumedToken=token
      this.showRule=true
    },
    closeNotice(){this.showRule=false},
    viewNotice(){const config=this.startupConfig||{};this.showRule=false;const configured=String(config.target||'');const fallback=`/pages/news/detail?id=${config.id}&announcement=1`;uni.navigateTo({url:validMiniProgramUrl(configured)?configured:fallback})},
    promotionUrl(item){const configured=String(item&&item.target||'');return validMiniProgramUrl(configured)?configured:'/pages/product/list'},
    categoryUrl(item){const configured=String(item.targetUrl||'');if(validMiniProgramUrl(configured))return configured;return item.id==='service'?'/pages/service/customer':'/pages/product/list?category='+item.id+'&title='+encodeURIComponent(item.name)}
  }
}
</script>

<style scoped>
.search-wrap { display:block; margin: 18rpx 28rpx; }
.hero { height: 320rpx; margin: 16rpx 28rpx 20rpx; border-radius: 24rpx; overflow: hidden; box-shadow: 0 14rpx 34rpx rgba(27,43,85,.12); }
.hero-link { position: relative; display: block; width: 100%; height: 100%; }
.hero image { width: 100%; height: 100%; }
.hero-shade { position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; flex-direction: column; justify-content: center; padding-left: 44rpx; background: linear-gradient(90deg,rgba(0,0,0,.62),rgba(0,0,0,.05)); color: #fff; }
.hero-kicker { color: #e8bd5b; font-size: 20rpx; letter-spacing: 4rpx; }
.hero-title { margin-top: 10rpx; font-size: 48rpx; font-weight: 900; }
.hero-sub { margin-top: 12rpx; font-size: 25rpx; }
.balance-card{height:110rpx;margin:0 28rpx 20rpx;padding:0 28rpx;display:flex;align-items:center;justify-content:space-between;border-radius:24rpx;background:linear-gradient(110deg,#fff8e8,#ffe0a5);box-shadow:0 10rpx 28rpx rgba(191,126,23,.1);font-size:29rpx;font-weight:800}.balance-value{color:var(--primary)}.recharge-button{height:58rpx;padding:0 24rpx;display:flex;align-items:center;border-radius:30rpx;background:var(--primary);color:#fff;font-size:23rpx;font-weight:500}
.category-card { margin: 0 28rpx; padding: 26rpx 8rpx 18rpx; display: grid; grid-template-columns: repeat(5,1fr); gap: 28rpx 4rpx; border-radius: 24rpx; background: var(--surface); box-shadow: var(--shadow-card); }
.category { min-width: 0; display: flex; flex-direction: column; align-items: center; }
/* #ifdef H5 */
/* H5 navigator inserts an anchor; align its children, not only the host. */
.category :deep(.navigator-wrap) { width: 100%; min-width: 0; display: flex; flex-direction: column; align-items: center; }
.balance-card :deep(.navigator-wrap) { width: 100%; display: flex; align-items: center; justify-content: space-between; }
/* #endif */
.category-icon { width: 76rpx; height: 76rpx; display: flex; align-items: center; justify-content: center; border-radius: 24rpx; background: #eef1ff; }
.operator-avatar{display:block;width:68rpx;height:68rpx;border-radius:20rpx}
.category-service .category-icon,.category-guarantee .category-icon{background:#e8f9ef}.category-special .category-icon,.category-hour .category-icon{background:#fff1e8}.category-space .category-icon,.category-new .category-icon{background:#edf1ff}.category-prison .category-icon,.category-evac .category-icon{background:#eef4f9}
.category-name { max-width: 115rpx; margin-top: 10rpx; color: var(--muted); font-size: 22rpx; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.headline { margin: 30rpx 28rpx 18rpx; display: flex; align-items: center; justify-content: space-between; }
.more{display:flex;align-items:center;color:var(--muted);font-size:23rpx}
.products { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20rpx; padding: 0 28rpx 20rpx; }
</style>
