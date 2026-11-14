'use client'

import { useEffect, useRef } from 'react'
import { createVoxelEngine, type VoxelAudio, type VoxelEngine, type VoxelInputs } from './voxel-engine'
import styles from './Agent.module.scss'

export type VoxelStageProps = VoxelInputs & {
  audio: VoxelAudio
  onPoke: (x: number, y: number) => void
  onReady: () => void
  onFail: () => void
}

export default function VoxelStage({ audio, onPoke, onReady, onFail, state, active, live, shocked, dodge }: VoxelStageProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<VoxelEngine | null>(null)
  const handlers = useRef({ audio, onPoke, onReady, onFail })

  useEffect(() => {
    handlers.current = { audio, onPoke, onReady, onFail }
  })

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let engine: VoxelEngine
    try {
      engine = createVoxelEngine(host, {
        audio: { level: () => handlers.current.audio.level(), voice: () => handlers.current.audio.voice() },
        onPoke: (x, y) => handlers.current.onPoke(x, y),
        onReady: () => handlers.current.onReady(),
        onFail: () => handlers.current.onFail(),
      })
    } catch {
      handlers.current.onFail()
      return
    }
    engineRef.current = engine
    return () => {
      engineRef.current = null
      engine.dispose()
    }
  }, [])

  useEffect(() => {
    engineRef.current?.update({ state, active, live, shocked, dodge })
  }, [state, active, live, shocked, dodge])

  return <div ref={hostRef} className={styles.voxels} aria-hidden="true" data-cw-agent-voxels="" />
}
