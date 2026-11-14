import { downsample, floatTo16, INPUT_RATE, rms } from '@/lib/ai/agent/pcm'

export type MicHandle = { stop(): void }

export type MicOptions = { onChunk: (pcm: Int16Array) => void; onLevel?: (level: number) => void; workletUrl?: string }

const WORKLET_URL = '/worklets/pcm-capture.js'

const PROCESSOR_NAME = 'cw-pcm-capture'

const CHUNK_MS = 100

export async function startMic(options: MicOptions): Promise<MicHandle> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new DOMException('Microphone capture is not available', 'NotSupportedError')
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  })
  let context: AudioContext | undefined
  try {
    context = new AudioContext()
    await context.audioWorklet.addModule(options.workletUrl ?? WORKLET_URL)
    const handle = wire(context, stream, options)
    if (context.state === 'suspended') void context.resume().catch(() => undefined)
    return handle
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop())
    void context?.close().catch(() => undefined)
    throw error
  }
}

function wire(context: AudioContext, stream: MediaStream, options: MicOptions): MicHandle {
  const source = context.createMediaStreamSource(stream)
  const node = new AudioWorkletNode(context, PROCESSOR_NAME, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 1,
    channelCountMode: 'explicit',
  })
  const mute = context.createGain()
  mute.gain.value = 0
  source.connect(node)
  node.connect(mute)
  mute.connect(context.destination)

  const inputRate = context.sampleRate
  const block = new Float32Array(Math.round((inputRate * CHUNK_MS) / 1000))
  let filled = 0
  let stopped = false

  function emit() {
    const samples = downsample(block, inputRate, INPUT_RATE)
    options.onLevel?.(rms(samples))
    options.onChunk(floatTo16(samples))
  }

  node.port.onmessage = (event: MessageEvent<unknown>) => {
    const frame = event.data
    if (stopped || !(frame instanceof Float32Array)) return
    let offset = 0
    while (offset < frame.length) {
      const count = Math.min(block.length - filled, frame.length - offset)
      block.set(frame.subarray(offset, offset + count), filled)
      filled += count
      offset += count
      if (filled === block.length) {
        filled = 0
        emit()
      }
    }
  }

  return {
    stop() {
      if (stopped) return
      stopped = true
      node.port.onmessage = null
      source.disconnect()
      node.disconnect()
      mute.disconnect()
      stream.getTracks().forEach((track) => track.stop())
      void context.close().catch(() => undefined)
    },
  }
}
