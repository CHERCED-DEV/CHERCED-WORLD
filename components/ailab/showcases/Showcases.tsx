'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { DespachoShowcase } from './DespachoShowcase'
import { ObraShowcase } from './ObraShowcase'
import styles from './Showcases.module.scss'

export const SHOWCASES = ['despacho', 'obra'] as const

export type ShowcaseId = (typeof SHOWCASES)[number]

export function Showcases(props: LabDemoProps) {
  const { t } = props
  const uid = useId()
  const [active, setActive] = useState<ShowcaseId>('despacho')
  const tabs = useRef<Partial<Record<ShowcaseId, HTMLButtonElement | null>>>({})

  const select = (id: ShowcaseId, focus = false) => {
    setActive(id)
    if (focus) tabs.current[id]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = SHOWCASES.indexOf(active)
    const last = SHOWCASES.length - 1
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null
    if (next === null) return
    event.preventDefault()
    select(SHOWCASES[next]!, true)
  }

  return (
    <div className={styles.showcases} data-cw-showcases="">
      <div className={styles.tablist} role="tablist" aria-label={t('ailab.a4.tabs')}>
        {SHOWCASES.map((id) => (
          <button
            key={id}
            ref={(node) => {
              tabs.current[id] = node
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${id}`}
            aria-selected={active === id}
            aria-controls={`${uid}-panel-${id}`}
            tabIndex={active === id ? 0 : -1}
            className={styles.tab}
            onClick={() => select(id)}
            onKeyDown={onKeyDown}
            data-cw-showcase-tab={id}
          >
            <span className={styles.tabName}>{t(`ailab.a4.tab.${id}`)}</span>
            <span className={styles.tabHint}>{t(`ailab.a4.tab.${id}.hint`)}</span>
          </button>
        ))}
      </div>
      {SHOWCASES.map((id) => (
        <div
          key={id}
          role="tabpanel"
          id={`${uid}-panel-${id}`}
          aria-labelledby={`${uid}-tab-${id}`}
          hidden={active !== id}
          tabIndex={0}
          className={styles.panel}
          data-cw-showcase-panel={id}
        >
          {id === 'despacho' ? <DespachoShowcase lang={props.lang} t={t} /> : <ObraShowcase {...props} />}
        </div>
      ))}
    </div>
  )
}

export default Showcases
