import { labDemo } from '../demo-loader'
import type { LabDemoRegistry } from '../types'

export const x3Demos: LabDemoRegistry = {
  R1: labDemo(() => import('@/components/ailab/saga/SagaSimulator')),
  A4: labDemo(() => import('@/components/ailab/showcases/Showcases')),
}
