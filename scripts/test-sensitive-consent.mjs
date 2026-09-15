import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
const source=fs.readFileSync(new URL('../services/sensitive-consent.js',import.meta.url),'utf8').replaceAll('export ','')
for(const [name,result,expected] of [['accept',{confirm:true},true],['reject',{confirm:false},false],['cancel',{},false]]){
 test(name,async()=>{let options;const c={uni:{showModal:o=>{options=o;o.success(result)}}};vm.createContext(c);vm.runInContext(source,c);assert.equal(await c.confirmSensitiveConsent('identity'),expected);assert.equal(options.cancelText,'不同意');assert.match(options.content,/身份证号码/);})
}
test('native failure resolves refusal',async()=>{const c={uni:{showModal:o=>o.fail()}};vm.createContext(c);vm.runInContext(source,c);assert.equal(await c.confirmSensitiveConsent('application'),false)})
for(const [file,method] of [['settings/identity.vue','submitIdentity'],['apply/index.vue','submitApplication']]){
 test(file+' refuses before network',async()=>{let calls=0;const text=fs.readFileSync(new URL('../pages/'+file,import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import[^;\n]+;?/g,'').replace('export default','page=');
 const c={confirmSensitiveConsent:async()=>false,SENSITIVE_CONSENT_VERSION:'IDENTITY-20260910-v1',api:{[method]:async()=>calls++}};vm.createContext(c);vm.runInContext(text,c);let s=c.page.data();for(const[k,f]of Object.entries(c.page.methods))s[k]=f.bind(s);Object.assign(s,{canSubmit:true,hasActive:false,agreed:true,name:'测试',idNumber:'110101199001010010'});if(s.form)Object.assign(s.form,{nickname:'测试',name:'测试',phone:'13800000000'});await s.submit();assert.equal(calls,0);assert.equal(s.submitting,false);assert.match(s.error,/未同意/);})
}

