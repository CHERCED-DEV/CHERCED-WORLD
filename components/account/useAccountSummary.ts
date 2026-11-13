'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { ACCOUNT_ENDPOINT, parseAccountSummary, type AccountSummary } from '@/lib/accounts/summary'
import { hasReaderHint } from '@/lib/auth/reader-hint'

const SIGNED_OUT: AccountSummary = { signedIn: false }

function subscribeToNothing(): () => void {
  return () => {}
}

function readHint(): boolean {
  return hasReaderHint(document.cookie)
}

export function useAccountSummary(): AccountSummary {
  const hinted = useSyncExternalStore(subscribeToNothing, readHint, () => false)
  const [summary, setSummary] = useState<AccountSummary>(SIGNED_OUT)

  useEffect(() => {
    if (!hinted) return
    const controller = new AbortController()
    fetch(ACCOUNT_ENDPOINT, { signal: controller.signal, cache: 'no-store', headers: { accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        if (!controller.signal.aborted) setSummary(parseAccountSummary(body))
      })
      .catch(() => {})
    return () => controller.abort()
  }, [hinted])

  return hinted ? summary : SIGNED_OUT
}
