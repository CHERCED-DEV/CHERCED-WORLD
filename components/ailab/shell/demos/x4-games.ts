import { labDemo } from '../demo-loader'
import type { LabDemoRegistry } from '../types'

export const x4Demos: LabDemoRegistry = {
  J1: labDemo(() => import('@/components/ailab/games/Rally').then((mod) => mod.RallyDemo)),
  J2: labDemo(() => import('@/components/ailab/games/Rally').then((mod) => mod.CloneDemo)),
}
