// Display only. Never rewrite API values used by payment expiry or accounting.
export function displayPaymentMethod(value) {
  return ({wechat:'微信支付',wxpay:'微信支付',balance:'余额支付',wallet:'余额支付',mock_wechat:'历史支付',mock:'历史支付'})[value] || (value ? '其他支付方式' : '未支付')
}
export function displayDateTime(value) {
  if (value === null || value === undefined || value === '') return '-'
  const raw = String(value).trim()
  if (/^\d{4}年\d{2}月\d{2}日(?: \d{2}:\d{2}:\d{2})?$/.test(raw)) return raw
  const parts = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/)
  if (!parts) return '-'
  let [, year, month, day, hour, minute, second = '00', zone] = parts
  const date = new Date(Date.UTC(+year,+month-1,+day,+(hour||0),+(minute||0),+second))
  if (date.getUTCFullYear()!==+year || date.getUTCMonth()!==+month-1 || date.getUTCDate()!==+day || +(hour||0)>23 || +(minute||0)>59 || +second>59) return '-'
  if (zone) {
    const offset = zone==='Z' ? 0 : (zone[0]==='-'?-1:1)*(Number(zone.slice(1,3))*60+Number(zone.replace(':','').slice(3,5)))
    if (zone!=='Z' && (+zone.slice(1,3)>23 || +zone.replace(':','').slice(3,5)>59)) return '-'
    date.setUTCMinutes(date.getUTCMinutes()+480-offset)
    const pad=n=>String(n).padStart(2,'0')
    year=String(date.getUTCFullYear());month=pad(date.getUTCMonth()+1);day=pad(date.getUTCDate());hour=pad(date.getUTCHours());minute=pad(date.getUTCMinutes());second=pad(date.getUTCSeconds())
  }
  return `${year}年${month}月${day}日`+(hour===undefined?'':` ${hour}:${minute}:${second}`)
}
