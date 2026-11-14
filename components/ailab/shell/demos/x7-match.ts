import { labDemo } from '../demo-loader'
import type { LabDemoRegistry } from '../types'

export const x7Demos: LabDemoRegistry = {
  A6: labDemo(() => import('@/components/ailab/match/MatchStage')),
}
