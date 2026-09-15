export function occupiedText(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) return ''
  const s = Math.max(0, Math.floor(Number(seconds)))
  return Math.floor(s / 3600) + '小时' + Math.floor(s % 3600 / 60) + '分' + s % 60 + '秒'
}
// Tick only server-confirmed occupied durations. Reload periodically to detect release.
export const occupancyClock = {
  onShow() {
    this.stopOccupancyClock()
    this.occupancyLastTick = Date.now()
    this.occupancyLastRefresh = Date.now()
    this.occupancyTimer = setInterval(() => {
      const now = Date.now(), seconds = Math.floor((now - this.occupancyLastTick) / 1000)
      this.occupancyLastTick += seconds * 1000
      const items = new Set([this.order, this.data, ...(this.orders || [])])
      for (const item of items) {
        if (item && item.occupiedSeconds != null && Number.isFinite(Number(item.occupiedSeconds)))
          item.occupiedSeconds = Number(item.occupiedSeconds) + seconds
      }
      if (now - this.occupancyLastRefresh >= 30000 && !this.loading && !this.profileDialog) {
        this.occupancyLastRefresh = now
        this.load()
      }
    }, 1000)
  },
  onHide() { this.stopOccupancyClock() },
  onUnload() { this.stopOccupancyClock() },
  methods: {
    occupiedText,
    stopOccupancyClock() { if (this.occupancyTimer) clearInterval(this.occupancyTimer); this.occupancyTimer = null }
  }
}
