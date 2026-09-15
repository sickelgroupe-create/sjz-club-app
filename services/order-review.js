import { api } from './api'
export const orderReview = {
  data(){return {reviewDialog:false,reviewOrder:null,reviewError:'',reviewSubmitting:false,reviewForm:{rating:5,content:''}}},
  methods:{
    openReview(item){if(!item?.canReview||item.reviewed||this.reviewSubmitting)return;this.reviewOrder=item;this.reviewForm={rating:5,content:''};this.reviewError='';this.reviewDialog=true},
    async submitReview(){
      if(this.reviewSubmitting||!this.reviewOrder)return
      const content=this.reviewForm.content.trim(),rating=Number(this.reviewForm.rating)
      if(!content||content.length>500){this.reviewError='请填写1至500字的评价内容';return}
      if(!Number.isInteger(rating)||rating<1||rating>5){this.reviewError='请选择1至5星评分';return}
      this.reviewSubmitting=true;this.reviewError=''
      try{await api.reviewOrder(this.reviewOrder.id,{rating,content});this.reviewOrder.reviewed=true;this.reviewOrder.canReview=false;this.reviewDialog=false;await this.load()}
      catch(e){this.reviewError=e.message||'提交失败，请重试'}
      finally{this.reviewSubmitting=false}
    }
  }
}
