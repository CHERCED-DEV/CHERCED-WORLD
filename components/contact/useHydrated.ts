import { useSyncExternalStore } from 'react'

const noSubscription = () => () => {}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  )
}
