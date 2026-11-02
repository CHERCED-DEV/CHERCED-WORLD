'use client'

import { type JSX, useEffect, useRef, useSyncExternalStore } from 'react'
import { cx } from '@/components/ui/cx'
import { on } from '@/lib/events'
import { createSprite, pixelRatio, readPalette } from '@/lib/motion/dom'
import { CANVAS_CEILING, createEngine, type Engine, type EngineStats } from '@/lib/motion/engine'
import { acquireBackground } from '@/lib/motion/instance'
import { getIntensity, getServerIntensity, subscribeIntensity } from '@/lib/motion/intensity'
import styles from './Background.module.scss'

function publish(root: HTMLElement, stats: EngineStats) {
  root.dataset.state = stats.state
  root.dataset.particles = String(stats.particles)
  root.dataset.pointer = stats.pointer ? 'on' : 'off'
  if (stats.medianFrameMs !== null) root.dataset.frameMs = stats.medianFrameMs.toFixed(1)
}

export function Background(): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const intensity = useSyncExternalStore(subscribeIntensity, getIntensity, getServerIntensity)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const release = acquireBackground()
    if (!release) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const engine = createEngine({
      surface: canvas,
      scheduler: {
        request: (callback) => window.requestAnimationFrame(callback),
        cancel: (id) => window.cancelAnimationFrame(id),
      },
      createSprite,
      width: canvas.clientWidth || window.innerWidth,
      height: canvas.clientHeight || window.innerHeight,
      pixelRatio: pixelRatio(),
      intensity: getIntensity(),
      palette: readPalette(),
      reducedMotion: motion.matches,
      onStats: (stats) => publish(root, stats),
    })
    engineRef.current = engine

    const controller = new AbortController()
    const options = { passive: true, signal: controller.signal }
    const follow = (event: PointerEvent) => engine.setPointer(event.clientX, event.clientY)
    const followTouch = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) engine.setPointer(touch.clientX, touch.clientY)
    }
    const leave = () => engine.clearPointer()

    window.addEventListener('pointermove', follow, options)
    window.addEventListener('pointerdown', follow, options)
    window.addEventListener('pointerup', (event) => event.pointerType !== 'mouse' && leave(), options)
    window.addEventListener('pointerout', (event) => event.relatedTarget === null && leave(), options)
    window.addEventListener('touchstart', followTouch, options)
    window.addEventListener('touchmove', followTouch, options)
    window.addEventListener('touchend', (event) => event.touches.length === 0 && leave(), options)
    window.addEventListener('touchcancel', leave, options)
    window.addEventListener('blur', leave, options)

    const syncVisibility = () => (document.hidden ? engine.pause('hidden') : engine.resume('hidden'))
    document.addEventListener('visibilitychange', syncVisibility, { signal: controller.signal })
    syncVisibility()

    motion.addEventListener('change', (event) => engine.setReducedMotion(event.matches), { signal: controller.signal })
    const offTheme = on('cw:theme-change', (theme) => engine.setPalette(readPalette(theme)))

    const intersection =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver((entries) => {
            const entry = entries.at(-1)
            if (!entry) return
            if (entry.isIntersecting) engine.resume('offscreen')
            else engine.pause('offscreen')
          })
    intersection?.observe(canvas)

    const resize =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
              engine.resize(canvas.clientWidth, canvas.clientHeight, pixelRatio())
            }
          })
    resize?.observe(canvas)

    return () => {
      controller.abort()
      offTheme()
      intersection?.disconnect()
      resize?.disconnect()
      engine.destroy()
      engineRef.current = null
      release()
      for (const key of ['state', 'particles', 'pointer', 'frameMs']) delete root.dataset[key]
    }
  }, [])

  useEffect(() => {
    engineRef.current?.setIntensity(intensity)
  }, [intensity])

  return (
    <div
      ref={rootRef}
      className={cx(styles.root, 'cw-js-only')}
      aria-hidden="true"
      data-cw-background=""
      data-bg-intensity={intensity}
    >
      <canvas ref={canvasRef} className={styles.canvas} style={{ opacity: CANVAS_CEILING[intensity] }} />
    </div>
  )
}
