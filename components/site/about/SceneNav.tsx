'use client'

import { useEffect, useState } from 'react'
import styles from './About.module.scss'

export type Scene = { id: string; label: string }

export function SceneNav({ label, scenes }: { label: string; scenes: Scene[] }) {
  const [current, setCurrent] = useState(scenes[0]?.id ?? '')

  useEffect(() => {
    const targets = scenes.map((scene) => document.getElementById(scene.id)).filter((node): node is HTMLElement => node !== null)
    if (targets.length === 0 || typeof IntersectionObserver === 'undefined') return
    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        let best = ''
        let ratio = 0
        for (const scene of scenes) {
          const value = visible.get(scene.id) ?? 0
          if (value > ratio) {
            ratio = value
            best = scene.id
          }
        }
        if (best) setCurrent(best)
      },
      { rootMargin: '-120px 0px -35% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    )
    for (const target of targets) observer.observe(target)
    return () => observer.disconnect()
  }, [scenes])

  return (
    <nav className={styles.sceneNav} aria-label={label} data-cw-scene-nav="">
      <ol className={styles.sceneList} data-cw-glass="strong">
        {scenes.map((scene, index) => (
          <li key={scene.id}>
            <a
              href={`#${scene.id}`}
              className={styles.sceneLink}
              aria-current={current === scene.id ? 'true' : undefined}
              data-cw-scene-link={scene.id}
              onClick={() => setCurrent(scene.id)}
            >
              <span className={styles.sceneIndex} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              {scene.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
