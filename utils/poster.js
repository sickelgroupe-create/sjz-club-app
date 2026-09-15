// Shared canvas rendering; never draw a decorative/fake QR code.
export function paintPoster(ctx, product, main, qr) {
  ctx.setFillStyle('#101010');ctx.fillRect(0,0,600,940)
  const side=Math.min(main.width,main.height)
  ctx.drawImage(main.path,(main.width-side)/2,(main.height-side)/2,side,side,0,0,600,600)
  ctx.setFillStyle('#e9c66c');ctx.setFontSize(22);ctx.fillText('品奢电竞',28,646)
  ctx.setFillStyle('#ffffff');ctx.setFontSize(30)
  const name=Array.from(product.name||'商品');ctx.fillText(name.slice(0,17).join(''),28,692)
  if(name.length>17)ctx.fillText(name.slice(17,34).join(''),28,732)
  ctx.setFillStyle('#bbbbbb');ctx.setFontSize(20);ctx.fillText(Array.from(product.subtitle||'').slice(0,20).join(''),28,775)
  ctx.setFillStyle('#ff536b');ctx.setFontSize(38);ctx.fillText('¥'+Number(product.price||0).toFixed(2),28,834)
  ctx.setFillStyle('#aaaaaa');ctx.setFontSize(18)
  if(qr){ctx.setFillStyle('#ffffff');ctx.fillRect(414,785,160,150);ctx.drawImage(qr.path,419,788,150,140);ctx.setFillStyle('#aaaaaa');ctx.fillText('长按识别 · 查看商品',28,902)}
  else ctx.fillText('小程序码暂不可用，请通过商品页分享好友',28,902)
}
