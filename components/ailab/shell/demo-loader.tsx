'use client'

import dynamic from 'next/dynamic'
import { createContext, use } from 'react'
import styles from './LabCard.module.scss'
import type { LabDemoComponent, LabDemoModule } from './types'

export const LabDemoLoadingContext = createContext('')

export function LabDemoLoading() {
  const label = use(LabDemoLoadingContext)
  return (
    <p className={styles.note} role="status" aria-busy="true" data-cw-lab-loading="">
      <span className={styles.spinner} aria-hidden="true" />
      {label}
    </p>
  )
}

export function labDemo(load: () => Promise<LabDemoModule>): LabDemoComponent {
  return dynamic(
    async () => {
      const loaded = await load()
      return 'default' in loaded ? loaded.default : loaded
    },
    { ssr: false, loading: LabDemoLoading },
  )
}
