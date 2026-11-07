'use client'

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import styles from './Architecture.module.scss'

const subscribe = () => () => {}
const clientReady = () => true
const serverReady = () => false

export function AtlasExplorer({ groups, all, label, children }: { groups: { id: string; label: string; count: number }[]; all: string; label: string; children: ReactNode[] }) {
  const [active, setActive] = useState('all')
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady)
  useEffect(() => {
    const revealAnchor = () => { if (location.hash.startsWith('#patron-')) setActive('all') }
    window.addEventListener('hashchange', revealAnchor)
    return () => window.removeEventListener('hashchange', revealAnchor)
  }, [])
  useEffect(() => {
    if (active === 'all' && location.hash.startsWith('#patron-')) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' })
    }
  }, [active])
  return <div className={styles.atlasExplorer}>
    <div className={styles.atlasFilters} role="group" aria-label={label} hidden={!ready}>
      {[{ id: 'all', label: all, count: groups.reduce((sum, group) => sum + group.count, 0) }, ...groups].map(group => <button key={group.id} type="button" aria-pressed={active === group.id} onClick={() => setActive(group.id)}>{group.label}<span>{group.count}</span></button>)}
    </div>
    {groups.map((group, index) => <div key={group.id} hidden={active !== 'all' && active !== group.id}>{children[index]}</div>)}
  </div>
}
