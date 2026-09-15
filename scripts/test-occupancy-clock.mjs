import {test} from 'node:test'
import assert from 'node:assert/strict'
import {occupancyClock,occupiedText} from '../services/occupancy-clock.mjs'
test('elapsed time is Chinese and never guesses missing history',()=>{
 assert.equal(occupiedText(3661),'1小时1分1秒')
 assert.equal(occupiedText(0),'0小时0分0秒')
 assert.equal(occupiedText(-5),'0小时0分0秒')
 assert.equal(occupiedText(null),'')
})
test('clock advances only occupied records, refreshes and stops when hidden',()=>{
 const original={now:Date.now,interval:global.setInterval,clear:global.clearInterval}
 let now=100000,tick,cleared=0,loads=0
 Date.now=()=>now;global.setInterval=fn=>(tick=fn,1);global.clearInterval=()=>cleared++
 try{
  const page={order:{occupiedSeconds:5},data:null,orders:[{occupiedSeconds:null}],loading:false,load:()=>loads++}
  page.stopOccupancyClock=occupancyClock.methods.stopOccupancyClock.bind(page)
  occupancyClock.onShow.call(page);now+=31000;tick()
  assert.equal(page.order.occupiedSeconds,36);assert.equal(page.orders[0].occupiedSeconds,null);assert.equal(loads,1)
  occupancyClock.onHide.call(page);assert.equal(cleared,1);assert.equal(page.occupancyTimer,null)
 }finally{Date.now=original.now;global.setInterval=original.interval;global.clearInterval=original.clear}
})
