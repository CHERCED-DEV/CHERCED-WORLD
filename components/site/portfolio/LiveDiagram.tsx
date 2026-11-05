'use client'

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import styles from './LiveDiagram.module.scss'
import type { DiagramLayerView } from './projects'

export type LiveDiagramLabels = { title: string; hint: string }

export type LiveDiagramProps = { layers: DiagramLayerView[]; labels: LiveDiagramLabels }

export const DIAGRAM_LIT_ATTRIBUTE = 'data-lit'

export function LiveDiagram({ layers, labels }: LiveDiagramProps) {
  const uid = useId().replace(/:/g, '')
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const light = () => element.setAttribute(DIAGRAM_LIT_ATTRIBUTE, '')
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      light()
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        light()
        observer.disconnect()
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 0.25 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  if (layers.length === 0) return null
  const current = layers.find((layer) => layer.id === active) ?? null
  const titleId = `${uid}-title`
  const hintId = `${uid}-hint`

  const onPointerEnter = (id: string) => (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') setActive(id)
  }

  return (
    <section ref={ref} className={styles.diagram} aria-labelledby={titleId} data-cw-diagram="">
      <div className={styles.head}>
        <h2 id={titleId} className={styles.title}>
          {labels.title}
        </h2>
        <p id={hintId} className={styles.hint} data-cw-diagram-hint="">
          {labels.hint}
        </p>
      </div>
      <ol className={styles.layers}>
        {layers.map((layer, index) => {
          const roleId = `${uid}-role-${index}`
          const isActive = layer.id === active
          return (
            <li
              key={layer.id}
              className={styles.layer}
              data-layer={layer.id}
              data-active={isActive ? '' : undefined}
              style={{ '--cw-i': index } as CSSProperties}
            >
              <button
                type="button"
                className={styles.layerButton}
                aria-pressed={isActive}
                aria-describedby={roleId}
                onFocus={() => setActive(layer.id)}
                onClick={() => setActive(layer.id)}
                onPointerEnter={onPointerEnter(layer.id)}
                data-cw-diagram-layer={layer.id}
              >
                <span className={styles.index} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.label}>{layer.label}</span>
              </button>
              <p id={roleId} className={styles.role} data-cw-diagram-role={layer.id}>
                {layer.role}
              </p>
            </li>
          )
        })}
      </ol>
      <p className={styles.line} aria-hidden="true" data-cw-diagram-line={current?.id ?? ''}>
        {current ? (
          <>
            <span className={styles.lineLabel}>{current.label}</span>
            <span className={styles.lineText}>{current.role}</span>
          </>
        ) : null}
      </p>
    </section>
  )
}
