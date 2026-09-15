import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {occupancyClock} from '../services/occupancy-clock.mjs'
function page(name,api={},uni={}){
 const source=readFileSync(new URL('../pages/'+name+'.vue',import.meta.url),'utf8')
 const code=source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import\s*[^;\n]+from\s*['"][^'"]+['"];?/g,'').replace('export default','return')
 const def=new Function('api','uni','isDark','occupancyClock','confirmSensitiveConsent','SENSITIVE_CONSENT_VERSION',code)(api,uni,()=>false,occupancyClock,async()=>true,'IDENTITY-20260910-v1'),ctx={...def.data(),...occupancyClock.methods,...def.methods}
 for(const [k,v] of Object.entries(def.computed||{}))Object.defineProperty(ctx,k,{get:()=>v.call(ctx)})
 return {ctx,def,source}
}
test('player gender selects male/female, saves through existing profile API and survives reload',async()=>{
 let stored={displayName:'打手',gender:'unknown',image:'avatar.png',city:'哈尔滨'};const writes=[]
 const {ctx,source}=page('workbench/index',{saveWorkbenchProfile:async p=>{writes.push({...p});stored={...p};return {...stored}},getWorkbench:async()=>({profile:{...stored},role:'player'})},{showToast:()=>{}})
 assert.match(source,/<radio-group @change="changeGender">/)
 await ctx.load();ctx.openProfile();assert.equal(ctx.profileForm.gender,'unknown')
 for(const gender of ['male','female']){
  ctx.changeGender({detail:{value:gender}});await ctx.saveProfile();assert.equal(writes.at(-1).gender,gender);assert.equal(ctx.profileDialog,false)
  await ctx.load();ctx.openProfile();assert.equal(ctx.profileForm.gender,gender);assert.equal(ctx.profileForm.image,'avatar.png');assert.equal(ctx.profileForm.city,'哈尔滨')
 }
 ctx.changeGender({detail:{value:'invalid'}});assert.equal(ctx.profileForm.gender,'female')
})
test('failed gender save preserves selection and editor without falsely changing persisted profile',async()=>{
 const notices=[];const {ctx}=page('workbench/index',{saveWorkbenchProfile:async()=>{throw new Error('保存失败')}},{showToast:o=>notices.push(o.title)})
 ctx.data={profile:{displayName:'打手',gender:'male'}};ctx.openProfile();ctx.changeGender({detail:{value:'female'}});await ctx.saveProfile()
 assert.equal(ctx.profileDialog,true);assert.equal(ctx.profileForm.gender,'female');assert.equal(ctx.data.profile.gender,'male');assert.equal(ctx.profileSaving,false);assert.deepEqual(notices,['保存失败'])
 ctx.openProfile();assert.equal(ctx.profileForm.gender,'male')
})
test('each player statistic navigates to its real detail route; withdrawal uses existing page',()=>{
 const paths=[],{ctx}=page('workbench/index',{}, {navigateTo:p=>paths.push(p.url)});ctx.data={role:'player',stats:{},wallet:{}}
 ctx.statCards.forEach(c=>ctx.openMetric(c.key));assert.deepEqual(paths,['today','total','expected'].map(k=>'/pages/workbench/metric?type='+k).concat('/pages/wallet/withdraw'))
})
test('avatar selection uploads a local file and blocks save until finished',async()=>{
 let options,release,saves=0;const {ctx}=page('workbench/index',{uploadImage:p=>{assert.equal(p,'local.png');return new Promise(r=>release=r)},saveWorkbenchProfile:async p=>{saves++;return p}},{chooseImage:o=>options=o,showToast:()=>{}})
 ctx.data={profile:{}};ctx.openProfile();ctx.profileForm.displayName='测试';ctx.chooseAvatar();const pending=options.success({tempFilePaths:['local.png']});options.complete();assert.equal(ctx.avatarBusy,true);await ctx.saveProfile();assert.equal(saves,0);release('/profile/upload.png');await pending;await ctx.saveProfile();assert.equal(saves,1);assert.equal(ctx.data.profile.image,'/profile/upload.png')
})
test('a stale avatar upload cannot overwrite a reopened editor',async()=>{
 let options,release;const {ctx}=page('workbench/index',{uploadImage:()=>new Promise(r=>release=r)},{chooseImage:o=>options=o,showToast:()=>{}});ctx.data={profile:{image:'current.png'}};ctx.openProfile();ctx.chooseAvatar();const pending=options.success({tempFilePaths:['old.png']});ctx.openProfile();release('old-upload.png');await pending;assert.equal(ctx.profileForm.image,'current.png')
})
for(const callbackBeforeShow of [true,false])test(`native picker hide/show preserves draft and saved avatar (callback before show=${callbackBeforeShow})`,async()=>{
 let options,release,reloads=0,saved
 const {ctx,def}=page('workbench/index',{uploadImage:()=>new Promise(r=>release=r),getWorkbench:async()=>{reloads++;return{}},saveWorkbenchProfile:async p=>(saved={...p})},{chooseImage:o=>options=o,showToast:()=>{}})
 ctx.data={profile:{displayName:'旧昵称',image:'old.png',intro:'旧简介'}};ctx.openProfile();ctx.profileForm.intro='尚未保存的简介';ctx.chooseAvatar();assert.equal(ctx.avatarPicking,true)
 def.onHide.call(ctx);assert.equal(ctx.profileDialog,true)
 if(!callbackBeforeShow)def.onShow.call(ctx)
 const uploading=options.success({tempFilePaths:['camera.png']});options.complete()
 if(callbackBeforeShow)def.onShow.call(ctx)
 assert.equal(reloads,0);assert.equal(ctx.profileDialog,true);assert.equal(ctx.profileForm.intro,'尚未保存的简介')
 release('/profile/avatar.png');await uploading;assert.equal(ctx.profileForm.image,'/profile/avatar.png');assert.equal(ctx.profileDialog,true)
 await ctx.saveProfile();assert.equal(saved.image,'/profile/avatar.png');assert.equal(saved.intro,'尚未保存的简介');assert.equal(ctx.profileDialog,false)
})
test('cancelled/denied selection retains editor and old photo, and permits retry',()=>{
 let options,picks=0;const notices=[];const {ctx,def}=page('workbench/index',{}, {chooseImage:o=>{options=o;picks++},showToast:o=>notices.push(o.title)})
 ctx.data={profile:{image:'old.png'}};ctx.openProfile();ctx.chooseAvatar();ctx.chooseAvatar();assert.equal(picks,1);def.onHide.call(ctx);options.fail({errMsg:'chooseImage:fail cancel'});options.complete();def.onShow.call(ctx)
 assert.equal(ctx.profileDialog,true);assert.equal(ctx.profileForm.image,'old.png');assert.equal(ctx.avatarPicking,false);assert.equal(notices.length,0)
 ctx.chooseAvatar();assert.equal(picks,2);options.fail({errMsg:'chooseImage:fail auth denied'});options.complete();assert.equal(ctx.profileDialog,true);assert.equal(notices.length,1)
})
test('upload failure does not close editor or lose draft',async()=>{
 let options;const notices=[];const {ctx,def}=page('workbench/index',{uploadImage:async()=>{throw new Error('网络中断')}},{chooseImage:o=>options=o,showToast:o=>notices.push(o.title)})
 ctx.data={profile:{image:'old.png'}};ctx.openProfile();ctx.profileForm.intro='保留';ctx.chooseAvatar();def.onHide.call(ctx);const pending=options.success({tempFilePaths:['image.png']});options.complete();def.onShow.call(ctx);await pending
 assert.equal(ctx.profileDialog,true);assert.equal(ctx.profileForm.image,'old.png');assert.equal(ctx.profileForm.intro,'保留');assert.equal(ctx.avatarBusy,false);assert.deepEqual(notices,['网络中断'])
})
test('normal page departure still closes recording editor; unloaded page ignores stale picker callback',async()=>{
 let options,uploads=0;const {ctx,def}=page('workbench/index',{uploadImage:async()=>{uploads++;return'new.png'}},{chooseImage:o=>options=o,showToast:()=>{}})
 ctx.data={profile:{image:'old.png'}};ctx.openProfile();def.onHide.call(ctx);assert.equal(ctx.profileDialog,false)
 ctx.openProfile();ctx.chooseAvatar();def.onUnload.call(ctx);await options.success({tempFilePaths:['stale.png']});options.complete();assert.equal(uploads,0);assert.equal(ctx.profileDialog,false);assert.equal(ctx.avatarPicking,false)
})
test('recording blocks opening camera; unsupported picker clears selection state',()=>{
 let calls=0;const {ctx}=page('workbench/index',{}, {chooseImage:()=>{calls++;throw new Error('unsupported')},showToast:()=>{}});ctx.voiceBusy=true;ctx.chooseAvatar();assert.equal(calls,0);ctx.voiceBusy=false;ctx.chooseAvatar();assert.equal(calls,1);assert.equal(ctx.avatarPicking,false)
})
test('application success clears phone, hides keyboard and unmounts form; failure preserves editable data',async()=>{
 let submitted;let hidden=0;const {ctx,source}=page('apply/index',{submitApplication:async p=>submitted=p},{hideKeyboard:()=>hidden++});ctx.form.name='测试';ctx.form.phone='13800000000';ctx.form.nickname='打手';ctx.agreed=true;await ctx.submit();assert.equal(submitted.phone,'13800000000');assert.equal(ctx.form.phone,'');assert.equal(ctx.submitted,true);assert.equal(hidden,1);assert.match(source,/<view v-if="!submitted">/);assert.match(source,/<view v-else class="result">/)
 const failed=page('apply/index',{submitApplication:async()=>{throw new Error('失败')}}).ctx;failed.form.name='测试';failed.form.phone='13800000000';failed.form.nickname='打手';failed.agreed=true;await failed.submit();assert.equal(failed.form.phone,'13800000000');assert.equal(failed.submitted,false)
})
test('detail pagination retries failed page and opens existing scoped order detail',async()=>{
 const calls=[],paths=[];let fail=true;const {ctx}=page('workbench/metric',{getWorkbenchMetric:async(t,p)=>{calls.push(p);if(p===2&&fail)throw new Error('断网');return{rows:[{id:p}],total:2,hasMore:p===1}}},{navigateTo:p=>paths.push(p.url)});await ctx.load(true);await ctx.load(false);assert.equal(ctx.page,1);fail=false;await ctx.load(false);assert.deepEqual(calls,[1,2,2]);assert.deepEqual(ctx.rows.map(r=>r.id),[1,2]);ctx.openOrder(ctx.rows[0]);assert.deepEqual(paths,['/pages/workbench/order-detail?id=1'])
})
