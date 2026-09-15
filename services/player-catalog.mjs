export function groupPlayerProducts(rows=[]) {
  const grouped=new Map()
  for(const row of rows){
    if(!row.productId)continue
    const key=String(row.productId)
    if(!grouped.has(key))grouped.set(key,{id:row.productId,name:row.productName,image:row.image,status:row.productStatus,categoryName:row.categoryName,skus:[]})
    if(row.skuId)grouped.get(key).skus.push({id:row.skuId,name:row.skuName,price:row.price,stock:row.stock,status:row.skuStatus})
  }
  return [...grouped.values()]
}
export function offerOrderUrl(offer,playerId) {
  if(!offer||String(offer.playerId)!==String(playerId)||!(Number(offer.stock)>0)||!(Number(offer.price)>0)||!offer.productId||!offer.skuId)return ''
  return `/pages/order/submit?id=${encodeURIComponent(offer.productId)}&sku=${encodeURIComponent(offer.skuId)}&qty=1&playerId=${encodeURIComponent(playerId)}`
}
