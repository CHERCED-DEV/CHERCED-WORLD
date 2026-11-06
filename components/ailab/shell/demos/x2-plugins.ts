import { labDemo } from '../demo-loader'
import type { LabDemoRegistry } from '../types'

export const x2Demos: LabDemoRegistry = {
  A2: labDemo(() => import('@/components/ailab/plugins/PluginExplorer')),
  A3: labDemo(() => import('@/components/ailab/plugins/SkillForm')),
  A5: labDemo(() => import('@/components/ailab/search/GlassBoxSearch')),
}
