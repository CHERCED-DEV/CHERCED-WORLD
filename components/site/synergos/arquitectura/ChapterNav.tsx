'use client'

import { useEffect, useState } from 'react'
import styles from './Architecture.module.scss'

export function ChapterNav({ items, label }: { items: { id: string; label: string }[]; label: string }) {
  const [active, setActive] = useState('')
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActive(visible.target.id)
    }, { rootMargin: '-15% 0px -45% 0px', threshold: [0, .1, .3] })
    for (const item of items) {
      const section = document.getElementById(item.id)
      if (section) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [items])
  return <nav className={styles.toc} aria-label={label}>{items.map((item, index) => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? 'location' : undefined}><span>{String(index + 1).padStart(2, '0')}</span>{item.label}</a>)}</nav>
}
