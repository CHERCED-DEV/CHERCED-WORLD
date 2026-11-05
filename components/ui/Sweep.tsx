'use client'

import { useEffect, useRef } from 'react'
import { observeSweep } from '@/lib/fx/reveal'

export function Sweep() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => observeSweep(ref.current), [])

  return <span ref={ref} aria-hidden="true" data-cw-sweep="" />
}
