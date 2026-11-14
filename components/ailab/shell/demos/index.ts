import type { LabDemoRegistry } from '../types'
import { x1Demos } from './x1-voice'
import { x2Demos } from './x2-plugins'
import { x3Demos } from './x3-saga'
import { x4Demos } from './x4-games'
import { x6Demos } from './x6-agent'

export const labDemos: LabDemoRegistry = { ...x6Demos, ...x1Demos, ...x2Demos, ...x3Demos, ...x4Demos }
