'use client'

import { usePathname } from 'next/navigation'
import { ViewTransition, type ReactNode } from 'react'

export const PAGE_TRANSITION_CLASS = 'cw-page'

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <ViewTransition key={pathname} enter={PAGE_TRANSITION_CLASS} exit={PAGE_TRANSITION_CLASS} default="none">
      {children}
    </ViewTransition>
  )
}
