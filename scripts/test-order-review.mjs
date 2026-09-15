import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
function setup(call){const c={api:{reviewOrder:call}};vm.createContext(c);vm.runInContext(fs.readFileSync(new URL('../services/order-review.js',import.meta.url),'utf8').replace(/import[^\n]+\n/,'').replace('export const orderReview','var orderReview'),c);const m=c.orderReview,s={...m.data(),load:async()=>{}};Object.entries(m.methods).forEach(([k,f])=>s[k]=f.bind(s));s.openReview({id:8,canReview:true,reviewed:false});return s}
test('submit only once while pending and update local review state',async()=>{let done,count=0;const s=setup(()=>{count++;return new Promise(r=>done=r)});s.reviewForm.content='体验';const first=s.submitReview();await s.submitReview();assert.equal(count,1);done({});await first;assert.equal(s.reviewDialog,false);assert.equal(s.reviewOrder.canReview,false)})
test('failure retains content and permits retry',async()=>{let count=0;const s=setup(async()=>{if(++count===1)throw Error('网络失败')});s.reviewForm.content='保留内容';await s.submitReview();assert.equal(s.reviewForm.content,'保留内容');assert.equal(s.reviewDialog,true);assert.equal(s.reviewSubmitting,false);await s.submitReview();assert.equal(s.reviewDialog,false)})
test('invalid content never sends request',async()=>{let count=0;const s=setup(()=>count++);await s.submitReview();assert.equal(count,0)})
test('nonreviewable and reviewed order cannot reopen form',()=>{const s=setup(()=>{});s.reviewDialog=false;s.openReview({id:9,canReview:false});assert.equal(s.reviewDialog,false);s.openReview({id:8,canReview:true,reviewed:true});assert.equal(s.reviewDialog,false)})
