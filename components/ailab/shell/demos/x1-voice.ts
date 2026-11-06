import { labDemo } from '../demo-loader'
import type { LabDemoRegistry } from '../types'

export const x1Demos: LabDemoRegistry = {
  V1: labDemo(() => import('@/components/ailab/voice/Transcriber')),
  V4: labDemo(() => import('@/components/ailab/voice/VoiceNav')),
}
