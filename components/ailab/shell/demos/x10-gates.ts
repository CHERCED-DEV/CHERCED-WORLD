import { labDemo } from '../demo-loader'
import type { LabDemoRegistry } from '../types'

export const x10Demos: LabDemoRegistry = {
  A12: labDemo(() => import('@/components/ailab/gates/GatesStage')),
}
