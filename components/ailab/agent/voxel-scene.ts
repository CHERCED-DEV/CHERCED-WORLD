import { useCallback, useEffect, useState, type ComponentType } from 'react'
import type { VoxelStageProps } from './VoxelStage'

export type StageScene = '2d' | '3d'

export type VoxelStageComponent = ComponentType<VoxelStageProps>

export const SCENE_PARAM = 'escenario'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export function wantsVoxels(search: string): boolean {
  return new URLSearchParams(search).get(SCENE_PARAM) === '3d'
}

export function hasWebGL(doc: Pick<Document, 'createElement'> = document): boolean {
  try {
    const canvas = doc.createElement('canvas')
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export function chooseScene({ search, reducedMotion, webgl }: { search: string; reducedMotion: boolean; webgl: () => boolean }): StageScene {
  if (!wantsVoxels(search) || reducedMotion) return '2d'
  return webgl() ? '3d' : '2d'
}

export async function loadVoxelStage(load: () => Promise<{ default: VoxelStageComponent }>): Promise<VoxelStageComponent | null> {
  try {
    return (await load()).default
  } catch {
    return null
  }
}

const loadStage = () => import('./VoxelStage')

export function useVoxelStage() {
  const [Stage, setStage] = useState<VoxelStageComponent | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION)
    if (chooseScene({ search: window.location.search, reducedMotion: media.matches, webgl: () => hasWebGL() }) !== '3d') return
    let alive = true
    void loadVoxelStage(loadStage).then((component) => {
      if (alive && component) setStage(() => component)
    })
    const onChange = () => {
      if (!media.matches) return
      setShown(false)
      setStage(null)
    }
    media.addEventListener('change', onChange)
    return () => {
      alive = false
      media.removeEventListener('change', onChange)
    }
  }, [])

  const ready = useCallback(() => setShown(true), [])
  const fail = useCallback(() => {
    setShown(false)
    setStage(null)
  }, [])

  return { Stage, shown, ready, fail }
}
