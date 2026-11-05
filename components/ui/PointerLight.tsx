'use client'

import { useEffect } from 'react'
import { startPointerLight, startTouchLight } from '@/lib/fx/pointer-light'

export function PointerLight(): null {
  useEffect(() => {
    const stopPointer = startPointerLight()
    const stopTouch = startTouchLight()
    return () => {
      stopPointer()
      stopTouch()
    }
  }, [])
  return null
}
