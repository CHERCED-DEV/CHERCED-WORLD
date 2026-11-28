import { labDemo } from '../demo-loader'
import type { LabDemoRegistry } from '../types'

export const x8Demos: LabDemoRegistry = {
  A10: labDemo(() => import('@/components/ailab/arena/ArenaStage')),
}
