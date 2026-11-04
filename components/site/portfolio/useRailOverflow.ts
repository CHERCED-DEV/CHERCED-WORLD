'use client'

import { useEffect, useState, type RefObject } from 'react'

export type RailOverflow = { start: boolean; end: boolean }

const EDGE = 2

export function railOverflow(scrollLeft: number, scrollWidth: number, clientWidth: number): RailOverflow {
  const offset = Math.abs(scrollLeft)
  return { start: offset > EDGE, end: offset + clientWidth < scrollWidth - EDGE }
}

export function useRailOverflow(ref: RefObject<HTMLElement | null>): RailOverflow {
  const [state, setState] = useState<RailOverflow>({ start: false, end: false })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = railOverflow(element.scrollLeft, element.scrollWidth, element.clientWidth)
        setState((current) => (current.start === next.start && current.end === next.end ? current : next))
      })
    }
    measure()
    element.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [ref])

  return state
}
