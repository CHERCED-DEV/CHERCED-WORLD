'use client'

import { useEffect } from 'react'
import { startPointerLight } from '@/lib/fx/pointer-light'

export function PointerLight(): null {
  useEffect(() => startPointerLight(), [])
  return null
}
