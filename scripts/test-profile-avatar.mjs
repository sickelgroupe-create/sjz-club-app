import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),Vue=require('vue'),{compile}=require('@vue/compiler-dom');
function component(file,uni={}){
  const source=readFileSync(new URL(file,import.meta.url),'utf8');
  const script=source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'').replace('export default','return');
  const definition=new Function('uni','api','isDark',script)(uni,{},()=>false);
  definition.render=new Function('Vue',compile(source.match(/<template>([\s\S]*?)<\/template>/)[1],{mode:'function',prefixIdentifiers:true,isCustomElement:tag=>['view','image','text','navigator'].includes(tag)}).code)(Vue);
  return definition;
}
const renderer=Vue.createRenderer({
  createElement:type=>({type,props:{},children:[]}),createText:text=>({type:'#text',text}),createComment:text=>({type:'#comment',text}),
  setText:(node,text)=>node.text=text,setElementText:(node,text)=>node.text=text,
  patchProp:(node,key,old,value)=>node.props[key]=value,
  insert:(node,parent)=>{parent.children.push(node);node.parent=parent},remove:node=>{node.parent.children=node.parent.children.filter(n=>n!==node)},
  parentNode:node=>node.parent,nextSibling:()=>null
});
function find(node,predicate){if(predicate(node))return node;for(const child of node.children||[]){const hit=find(child,predicate);if(hit)return hit}}
for(const avatar of ['', '/existing-avatar.png'])test(`tap ${avatar?'image':'default avatar'} navigates once to profile editor`,()=>{
  const navigations=[],page=component('../pages/profile/index.vue',{navigateTo:x=>navigations.push(x.url)});
  const card=component('../components/ui-user-card.vue');const root={children:[]};
  const app=renderer.createApp({render:()=>Vue.h(card,{avatar,onAvatarTap:()=>page.methods.editProfile.call({loggedIn:true})})});
  app.component('ui-icon',{render:()=>Vue.h('icon')});app.mount(root);
  const image=find(root,n=>String(n.props?.class||'').split(' ').includes('avatar'));
  let stopped=0;image.props.onTap({stopPropagation:()=>stopped++});
  assert.deepEqual(navigations,['/pages/profile/edit']);assert.equal(stopped,1);
  const settings=find(root,n=>n.props?.class==='settings');assert.equal(settings.props.url,'/pages/settings/index');assert.equal(settings.props.onTap,undefined);
  app.unmount();
});
test('guest cannot navigate to protected editor through handler',()=>{
  const calls=[],page=component('../pages/profile/index.vue',{navigateTo:x=>calls.push(x)});
  page.methods.editProfile.call({loggedIn:false});assert.equal(calls.length,0);
});
test('profile render has no detached edit button',()=>{
  const page=component('../pages/profile/index.vue');const original=page.data;
  page.data=()=>({...original(),loggedIn:true});const root={children:[]};const app=renderer.createApp(page);
  for(const tag of ['ui-user-card','ui-icon','ui-icon-grid','ui-bottom-nav'])app.component(tag,{render:()=>Vue.h('stub')});
  app.mount(root);assert.equal(find(root,n=>n.props?.class==='profile-edit'),undefined);app.unmount();
});
