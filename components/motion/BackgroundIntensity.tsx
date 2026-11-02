'use client'

import { useEffect } from 'react'
import { claimIntensity, type Intensity } from '@/lib/motion/intensity'

export type BackgroundIntensityValue = Intensity

export function BackgroundIntensity({ value }: { value: BackgroundIntensityValue }): null {
  useEffect(() => claimIntensity(value), [value])
  return null
}
