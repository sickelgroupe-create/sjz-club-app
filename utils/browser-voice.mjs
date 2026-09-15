// Capture real microphone PCM and encode mono WAV so recordings also play in WeChat.
export async function startBrowserVoice() {
  if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('录音需要HTTPS和麦克风权限')
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  let context, source, processor, chunks = [], count = 0, closed = false
  const dispose = () => {
    if (closed) return
    closed = true
    if (processor) { processor.onaudioprocess = null; processor.disconnect() }
    source?.disconnect(); stream.getTracks().forEach(track => track.stop()); context?.close()
  }
  try {
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext
    context = new AudioContext(); await context.resume()
    source = context.createMediaStreamSource(stream)
    processor = context.createScriptProcessor(4096, 1, 1)
    processor.onaudioprocess = event => {
      const input = event.inputBuffer.getChannelData(0)
      if (count >= context.sampleRate * 60) return
      const copy = new Float32Array(input.subarray(0, Math.min(input.length, context.sampleRate * 60 - count)))
      chunks.push(copy); count += copy.length
    }
    source.connect(processor); processor.connect(context.destination)
    return {
      cancel() { dispose(); chunks = [] },
      stop() {
        const rate = context.sampleRate; dispose()
        if (count < rate) throw new Error('请至少录制1秒')
        const pcm = new Float32Array(count); let offset = 0
        for (const chunk of chunks) { pcm.set(chunk, offset); offset += chunk.length }
        chunks = []
        const length = Math.floor(count * 16000 / rate)
        const buffer = new ArrayBuffer(44 + length * 2), view = new DataView(buffer)
        const text = (at, value) => [...value].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)))
        text(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); text(8, 'WAVE'); text(12, 'fmt ')
        view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
        view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
        text(36, 'data'); view.setUint32(40, length * 2, true)
        for (let i = 0; i < length; i++) { const sample = Math.max(-1, Math.min(1, pcm[Math.floor(i * rate / 16000)])); view.setInt16(44 + i * 2, sample < 0 ? sample * 32768 : sample * 32767, true) }
        return { blob: new Blob([buffer], { type: 'audio/wav' }), seconds: Math.min(60, Math.ceil(count / rate)) }
      }
    }
  } catch (error) { dispose(); throw error }
}

export function voiceError(error) {
  return ['NotAllowedError', 'PermissionDeniedError'].includes(error?.name) ? '未获得麦克风权限，请在系统或浏览器设置中允许后重试' :
    error?.name === 'NotFoundError' ? '未检测到麦克风' : error?.message || '录音失败，请检查麦克风权限后重试'
}
