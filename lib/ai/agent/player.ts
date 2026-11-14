import { int16ToFloat, OUTPUT_RATE, rms } from '@/lib/ai/agent/pcm'

export type AudioPlayer = {
  enqueue(pcm: Int16Array): void
  flush(): void
  level(): number
  playing(): boolean
  close(): void
  resume(): Promise<void>
}

const FFT_SIZE = 512

function playbackContext(): AudioContext {
  try {
    return new AudioContext({ sampleRate: OUTPUT_RATE })
  } catch {
    return new AudioContext()
  }
}

export function createPlayer(): AudioPlayer {
  const context = playbackContext()
  const analyser = context.createAnalyser()
  analyser.fftSize = FFT_SIZE
  analyser.connect(context.destination)
  const samples = new Float32Array(analyser.fftSize)
  const sources = new Set<AudioBufferSourceNode>()
  let nextStart = 0
  let closed = false

  function flush() {
    for (const source of sources) {
      source.onended = null
      source.stop()
      source.disconnect()
    }
    sources.clear()
    nextStart = 0
  }

  return {
    enqueue(pcm) {
      if (closed || pcm.length === 0) return
      const buffer = context.createBuffer(1, pcm.length, OUTPUT_RATE)
      buffer.getChannelData(0).set(int16ToFloat(pcm))
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(analyser)
      source.onended = () => {
        sources.delete(source)
        source.disconnect()
      }
      const startAt = Math.max(context.currentTime, nextStart)
      source.start(startAt)
      sources.add(source)
      nextStart = startAt + buffer.duration
    },
    flush,
    level() {
      if (closed) return 0
      analyser.getFloatTimeDomainData(samples)
      return rms(samples)
    },
    playing() {
      return !closed && sources.size > 0 && nextStart > context.currentTime
    },
    close() {
      if (closed) return
      flush()
      closed = true
      analyser.disconnect()
      void context.close().catch(() => undefined)
    },
    resume() {
      if (closed || context.state !== 'suspended') return Promise.resolve()
      return context.resume()
    },
  }
}
