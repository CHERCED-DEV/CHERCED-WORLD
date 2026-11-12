'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './Architecture.module.scss'

export function ChapterNav({ items, label }: { items: { id: string; label: string }[]; label: string }) {
  const [active, setActive] = useState('')
  const rail = useRef<HTMLElement>(null)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      const reading = entries.find(entry => entry.isIntersecting)
      if (reading) setActive(reading.target.id)
    }, { rootMargin: '-40% 0px -59% 0px' })
    for (const item of items) {
      const section = document.getElementById(item.id)
      if (section) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [items])
  useEffect(() => {
    const node = rail.current
    const link = node?.querySelector<HTMLElement>('[aria-current]')
    if (!node || !link || node.scrollWidth <= node.clientWidth) return
    const left = link.offsetLeft - (node.clientWidth - link.offsetWidth) / 2
    node.scrollTo({ left: Math.max(0, left), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [active])
  return <nav ref={rail} className={styles.toc} aria-label={label} data-cw-chapter-nav="">{items.map((item, index) => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? 'location' : undefined} data-cw-chapter-link={item.id}><span>{String(index + 1).padStart(2, '0')}</span>{item.label}</a>)}</nav>
}
