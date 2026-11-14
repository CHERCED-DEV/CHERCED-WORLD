import { labDemo } from '../demo-loader'
import type { LabDemoRegistry } from '../types'

export const x6Demos: LabDemoRegistry = {
  V5: labDemo(() => import('@/components/ailab/agent/AgentStage')),
}
