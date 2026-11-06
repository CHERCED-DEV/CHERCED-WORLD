'use client'

import { useCallback, useSyncExternalStore } from 'react'
import type { LabExperimentId } from '@/content/types'
import { hasConsent, onConsentChange } from '@/lib/ailab/core/consent'

export function useSessionConsent(experiment: LabExperimentId, resource: string): boolean {
  const read = useCallback(() => hasConsent(experiment, resource), [experiment, resource])
  return useSyncExternalStore(onConsentChange, read, () => false)
}
