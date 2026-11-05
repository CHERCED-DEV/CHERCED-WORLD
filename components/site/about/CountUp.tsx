'use client'

import { useEffect, useRef } from 'react'
import type { Locale } from '@/lib/i18n'
import { figureDigits } from './figures'
import { countAt, watchInView } from './inView'

export const COUNT_DURATION_MS = 1400

export function CountUp({ value, lang, className }: { value: number; lang: Locale; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    let frame = 0
    const write = (next: number) => {
      element.textContent = figureDigits(next, lang)
    }
    const stop = watchInView(element, (state) => {
      if (state === 'pending') {
        write(0)
        return
      }
      if (state !== 'in') return
      const start = performance.now()
      const tick = (time: number) => {
        const progress = (time - start) / COUNT_DURATION_MS
        write(countAt(value, progress))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })
    return () => {
      stop()
      cancelAnimationFrame(frame)
      write(value)
    }
  }, [value, lang])

  return (
    <span ref={ref} className={className} aria-hidden="true" data-cw-figure-value={value}>
      {figureDigits(value, lang)}
    </span>
  )
}
