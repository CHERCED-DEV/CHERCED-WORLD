'use client'

import Image from 'next/image'
import { useId, useState } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import styles from './About.module.scss'
import { LevelBar } from './LevelBar'
import { monogram } from './monogram'

export type TechItem = { id: string; name: string; icon?: string; level: number; levelLabel: string }

export const TECH_VISIBLE_ON_MOBILE = 4

function TechBadge({ name, icon }: { name: string; icon?: string }) {
  if (icon) {
    return (
      <Image
        src={icon}
        alt=""
        width={56}
        height={56}
        sizes="56px"
        unoptimized={icon.endsWith('.svg')}
        className={styles.techIcon}
        data-cw-tech-icon=""
      />
    )
  }
  const initials = monogram(name)
  return <span className={styles.techMonogram} data-cw-monogram={initials} data-length={initials.length} aria-hidden="true" />
}

export function TechList({ items, showMore, showLess }: { items: TechItem[]; showMore: string; showLess: string }) {
  const [expanded, setExpanded] = useState(false)
  const listId = `tech${useId().replace(/:/g, '')}`
  const collapsible = items.length > TECH_VISIBLE_ON_MOBILE

  return (
    <>
      <ul id={listId} className={styles.techList} data-expanded={expanded ? 'true' : 'false'}>
        {items.map((item, index) => (
          <li
            key={item.id}
            className={styles.tech}
            data-cw-glass="subtle"
            data-cw-tech={item.id}
            {...(index >= TECH_VISIBLE_ON_MOBILE ? { 'data-extra': '' } : {})}
          >
            <p className={styles.techName}>{item.name}</p>
            <TechBadge name={item.name} icon={item.icon} />
            <LevelBar value={item.level} label={item.levelLabel} />
          </li>
        ))}
      </ul>
      {collapsible ? (
        <button
          type="button"
          className={buttonClassName({ variant: 'glass', className: `cw-js-only ${styles.techToggle}` })}
          aria-controls={listId}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? showLess : showMore}
        </button>
      ) : null}
    </>
  )
}
