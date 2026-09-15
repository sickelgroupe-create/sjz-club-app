import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,existsSync} from 'node:fs'
import vm from 'node:vm'
import {occupancyClock} from '../services/occupancy-clock.mjs'
function page(file, api={}) {
  const notices=[],routes=[];let calls=0
  const uni={showToast:r=>notices.push(r.title),showLoading(){},hideLoading(){},getStorageSync:()=>'',navigateTo:r=>routes.push(r.url),showModal:r=>r.success({confirm:true}),redirectTo:r=>routes.push(r.url)}
  const context={uni,api,occupancyClock,orderReview:{},isDark:()=>false,validMiniProgramUrl:()=>true}
  vm.createContext(context);vm.runInContext(readFileSync(new URL('../pages/'+file,import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import[^\n]*$/gm,'').replace('export default','page ='),context)
  const def=context.page,state=def.data();for(const [k,fn] of Object.entries({...occupancyClock.methods,...def.methods}))state[k]=fn.bind(state)
  return {state,notices,routes,uni,def}
}
test('quantity stops at 10 and cannot submit illegal quantity',()=>{
  const h=page('product/detail.vue');h.state.qty=10;h.state.increaseQty();assert.equal(h.state.qty,10);assert.equal(h.notices[0],'单次最多购买10件');
  h.state.qty=39;h.state.submit();assert.equal(h.routes.length,0)
})
test('poster errors are handled and duplicate taps only make one request',async()=>{
  let count=0,reject;const h=page('product/detail.vue',{createPoster:()=>{count++;return new Promise((a,b)=>reject=b)}});h.state.product={id:1};
  const first=h.state.generatePoster();await h.state.generatePoster();assert.equal(count,1);reject(new Error('测试下载失败'));await first;assert.equal(h.state.posterBusy,false);assert.deepEqual(h.notices,['测试下载失败'])
})
test('cancel confirmation closes and reloads the order once',async()=>{
  let calls=0;const h=page('order/detail.vue',{cancelOrder:async()=>calls++,getOrder:async()=>({status:'cancelled'})});h.state.orderId=83;h.state.order={status:'unpaid'};
  await Promise.all([h.state.cancelPayment(),h.state.cancelPayment()]);assert.equal(calls,1);assert.equal(h.state.order.status,'cancelled');assert.equal(h.state.cancelling,false)
})
test('declining cancellation leaves unpaid order untouched',async()=>{
  let calls=0;const h=page('order/detail.vue',{cancelOrder:async()=>calls++});h.state.order={status:'unpaid'};h.uni.showModal=r=>r.success({confirm:false});await h.state.cancelPayment();assert.equal(calls,0)
})
test('all operator defaults use packaged PNGs, including old webp configuration',()=>{
  const h=page('index/index.vue');for(let i=0;i<10;i++){const image=h.state.operatorAvatar({id:'unknown'},i);assert.match(image,/\.png$/);assert.ok(existsSync(new URL('..'+image,import.meta.url)))}
  assert.equal(h.state.operatorAvatar({avatarImage:'/static/images/operators/operator-01.webp'},0),'/static/images/operators/operator-01.png')
})
test('workbench profile can save changed values and reports errors',async()=>{
  const h=page('workbench/index.vue',{saveWorkbenchProfile:async p=>({...p})});h.state.data={profile:{displayName:'旧昵称'}};h.state.openProfile();h.state.profileForm.displayName='新昵称';await h.state.saveProfile();assert.equal(h.state.data.profile.displayName,'新昵称');assert.equal(h.state.profileDialog,false)
})
test('poster drawing uses actual image and price; absent QR is explicitly described',async()=>{
  const {paintPoster}=await import('data:text/javascript;base64,'+Buffer.from(readFileSync(new URL('../utils/poster.js',import.meta.url))).toString('base64'))
  const texts=[],images=[];const ctx={setFillStyle(){},fillRect(){},setFontSize(){},drawImage:(...a)=>images.push(a),fillText:t=>texts.push(t)}
  paintPoster(ctx,{name:'商品',price:99},{width:600,height:600,path:'real.png'},null);assert.equal(images.length,1);assert.ok(texts.includes('¥99.00'));assert.ok(texts.some(t=>t.includes('小程序码暂不可用')))
})
