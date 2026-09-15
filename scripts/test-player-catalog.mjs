import test from 'node:test'
import assert from 'node:assert/strict'
import {groupPlayerProducts,offerOrderUrl} from '../services/player-catalog.mjs'
test('workbench groups only supplied bindings, preserves offline products and all prices',()=>{
 const products=groupPlayerProducts([{productId:1,productName:'小时单',productStatus:'active',skuId:11,skuName:'一小时',price:50,stock:8,skuStatus:'active'},{productId:1,skuId:12,price:90,stock:0,skuStatus:'inactive'},{productId:2,productName:'活动单',productStatus:'inactive',skuId:null}]);
 assert.equal(products.length,2);assert.equal(products[0].skus.length,2);assert.equal(products[0].skus[1].price,90);assert.equal(products[1].status,'inactive');assert.equal(products[1].skus.length,0);
})
test('only explicitly selected available offer produces an order URL',()=>{
 const offer={playerId:7,productId:3,skuId:31,stock:2,price:50};assert.equal(offerOrderUrl(offer,7),'/pages/order/submit?id=3&sku=31&qty=1&playerId=7');
 for(const changed of [{stock:0},{playerId:8},{skuId:null},{price:0}])assert.equal(offerOrderUrl({...offer,...changed},7),'');
 assert.equal(offerOrderUrl(null,7),'');
})
