'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ServiceCard, type ServiceCardProps } from './ServiceCard'
import { stackDepth, watchStack } from './stack'
import styles from './Services.module.scss'

export type ServiceStackProps = { cards: Omit<ServiceCardProps, 'blur'>[] }

export function ServiceStack({ cards }: ServiceStackProps) {
  const list = useRef<HTMLOListElement>(null)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const host = list.current
    if (!host) return
    return watchStack({ children: host.children as HTMLCollectionOf<HTMLElement>, style: host.style }, setActive)
  }, [])

  return (
    <ol ref={list} className={styles.cards} data-cw-service-stack="">
      {cards.map((card, index) => {
        const depth = stackDepth(index, active)
        return (
          <li
            key={card.id}
            className={styles.cardItem}
            style={{ '--cw-i': index, '--cw-depth': depth } as CSSProperties}
            data-cw-stack={active < 0 ? undefined : index === active ? 'active' : depth > 0 ? 'behind' : undefined}
          >
            <ServiceCard {...card} blur={index === active} />
          </li>
        )
      })}
    </ol>
  )
}
