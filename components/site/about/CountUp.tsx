'use client'

import { useEffect, useRef } from 'react'
import { countAt, watchInView } from './inView'

export const COUNT_DURATION_MS = 1400

export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    let frame = 0
    const write = (next: number) => {
      element.textContent = String(next)
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
  }, [value])

  return (
    <span ref={ref} className={className} aria-hidden="true" data-cw-figure-value={value}>
      {value}
    </span>
  )
}
