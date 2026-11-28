import { labDemo } from '../demo-loader'
import type { LabDemoRegistry } from '../types'

export const x9Demos: LabDemoRegistry = {
  A11: labDemo(() => import('@/components/ailab/cotejo/CotejoStage')),
}
