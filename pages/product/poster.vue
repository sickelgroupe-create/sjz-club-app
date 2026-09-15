<template>
  <view :class="['app-page',{dark}]"><ui-header title="商品海报" back/>
    <template v-if="imagePath"><image class="poster-image" :src="imagePath" mode="widthFix" show-menu-by-longpress @tap="preview"/><view v-if="!hasCode" class="poster-tip">海报已生成。小程序码暂不可用，可返回商品页使用“分享好友”。</view><view class="primary-btn share" @tap="save">保存海报</view><button class="primary-btn share" open-type="share">分享给好友</button></template>
    <ui-page-status v-else :loading="loading" title="海报生成失败" :description="loadError" @retry="loadProduct"/>
    <canvas canvas-id="productPoster" id="productPoster" class="poster-canvas" :width="600" :height="940" style="width:600px;height:940px"/>
  </view>
</template>
<script>
import {api} from '@/services/api'
import {isDark} from '@/utils/app'
import {paintPoster} from '@/utils/poster'
export default {
  data(){return{dark:false,productId:'',posterId:'',product:null,poster:null,loading:false,loadError:'',imagePath:'',hasCode:false}},
  onLoad(q){this.dark=isDark();this.productId=q.id||'';this.posterId=q.posterId||'';this.loadProduct()},
  onShareAppMessage(){return this.product?{title:this.product.name,path:'/pages/product/detail?id='+this.product.id,imageUrl:this.product.image}:{title:'品奢电竞',path:'/pages/index/index'}},
  methods:{
    imageInfo(src){return new Promise((resolve,reject)=>uni.getImageInfo({src,success:resolve,fail:()=>reject(new Error('商品图片下载失败，请检查网络或图片合法域名'))}))},
    async loadProduct(){if(this.loading)return;this.loading=true;this.loadError='';try{
      const [product,posters]=await Promise.all([api.getProduct(this.productId),api.getPosters()]);this.product=product;
      this.poster=posters.find(p=>String(p.id)===String(this.posterId))||null;
      const main=await this.imageInfo(product.image);let qr=null;
      if(this.poster?.qrImage){try{qr=await this.imageInfo(this.poster.qrImage)}catch{uni.showToast({title:'小程序码下载失败，海报不含小程序码',icon:'none'})}}
      this.hasCode=!!qr;await this.$nextTick();const ctx=uni.createCanvasContext('productPoster',this);paintPoster(ctx,product,main,qr);
      await new Promise(resolve=>ctx.draw(false,resolve));
      this.imagePath=await new Promise((resolve,reject)=>uni.canvasToTempFilePath({canvasId:'productPoster',width:600,height:940,destWidth:600,destHeight:940,fileType:'png',success:r=>resolve(r.tempFilePath),fail:()=>reject(new Error('海报图片导出失败，请重试'))},this));
    }catch(e){this.loadError=e.message||'海报生成失败，请重试'}finally{this.loading=false}},
    preview(){uni.previewImage({urls:[this.imagePath],current:this.imagePath})},
    save(){
      // #ifdef H5
      const link=document.createElement('a');link.href=this.imagePath;link.download='品奢电竞-商品海报.png';document.body.appendChild(link);link.click();link.remove();this.preview();return;
      // #endif
      // #ifdef MP-WEIXIN
      uni.saveImageToPhotosAlbum({filePath:this.imagePath,success:()=>uni.showToast({title:'已保存到相册',icon:'success'}),fail:()=>uni.showModal({title:'保存失败',content:'请允许相册权限后重试，也可以点击海报预览后长按保存。',showCancel:false})});
      // #endif
    }
  }
}
</script>
<style scoped>.poster-image{display:block;width:620rpx;margin:28rpx auto;border-radius:20rpx}.poster-canvas{position:fixed;left:-10000px;top:0;pointer-events:none}.share{margin:24rpx 64rpx}.poster-tip{margin:18rpx 56rpx;color:var(--muted);font-size:24rpx;line-height:1.6}</style>
