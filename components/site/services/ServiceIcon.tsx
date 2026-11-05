import type { ReactNode } from 'react'
import type { ServiceId } from '@/content/types'

const ACCENT = '#25ED9E'

const pictograms: Record<ServiceId, ReactNode> = {
  'ai-harness': (
    <>
      <circle cx="24" cy="24" r="5" stroke={ACCENT} />
      <circle cx="24" cy="24" r="1.5" fill={ACCENT} stroke="none" />
      <circle cx="24" cy="8" r="2.5" />
      <circle cx="37.86" cy="16" r="2.5" />
      <circle cx="37.86" cy="32" r="2.5" />
      <circle cx="24" cy="40" r="2.5" />
      <circle cx="10.14" cy="32" r="2.5" />
      <circle cx="10.14" cy="16" r="2.5" />
      <path d="M24 18.5v-8M28.76 21.25l6.93-4M28.76 26.75l6.93 4M24 29.5v8M19.24 26.75l-6.93 4M19.24 21.25l-6.93-4" />
    </>
  ),
  'software-factory': (
    <>
      <path d="M6 13h5M19 13h17M6 24h14M28 24h8M6 35h8M22 35h14" />
      <path d="M33 10l3 3-3 3M33 21l3 3-3 3M33 32l3 3-3 3" />
      <path d="M41 8v32" />
      <rect x="11" y="10" width="8" height="6" rx="2" stroke={ACCENT} />
      <rect x="20" y="21" width="8" height="6" rx="2" stroke={ACCENT} />
      <rect x="14" y="32" width="8" height="6" rx="2" stroke={ACCENT} />
    </>
  ),
  'process-optimization': (
    <>
      <path d="M7 9h34L29 24v12l-10 5V24z" />
      <path d="M27 11l-5 7h5l-5 8" stroke={ACCENT} />
    </>
  ),
  architecture: (
    <>
      <path d="M24 8l17 8.5L24 25 7 16.5z" />
      <path d="M7 24.5L24 33l17-8.5" />
      <path d="M7 32.5L24 41l17-8.5" stroke={ACCENT} />
    </>
  ),
  product: (
    <>
      <path d="M24 5c5.5 4.5 8 11 8 18v9H16v-9c0-7 2.5-13.5 8-18z" />
      <circle cx="24" cy="18" r="3.5" stroke={ACCENT} />
      <path d="M16 25l-5 5v6l5-3M32 25l5 5v6l-5-3" />
      <path d="M21 36l3 6 3-6" stroke={ACCENT} />
    </>
  ),
  workshops: (
    <>
      <rect x="7" y="7" width="34" height="20" rx="2.5" />
      <path d="M12 13h13M12 18h18M12 22h8" />
      <path d="M31 21l2.5 2.5L38 19" stroke={ACCENT} />
      <circle cx="16" cy="34" r="3" />
      <circle cx="32" cy="34" r="3" stroke={ACCENT} />
      <path d="M10 43c.8-2.6 3-4 6-4s5.2 1.4 6 4M26 43c.8-2.6 3-4 6-4s5.2 1.4 6 4" />
    </>
  ),
}

export function ServiceIcon({ id }: { id: ServiceId }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="32"
      height="32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-cw-service-icon={id}
    >
      {pictograms[id]}
    </svg>
  )
}
