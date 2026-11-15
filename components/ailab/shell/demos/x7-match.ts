import { labDemo } from '../demo-loader'
import type { LabDemoRegistry } from '../types'

export const x7Demos: LabDemoRegistry = {
  A6: labDemo(() => import('@/components/ailab/match/MatchStage')),
  A9: labDemo(() => import('@/components/ailab/diagram/DiagramStage')),
  A7: labDemo(() => import('@/components/ailab/write/WriteStage')),
  A8: labDemo(() => import('@/components/ailab/shot/ShotStage')),
  P1: labDemo(() => import('@/components/ailab/pixel/PixelStage')),
}
