import type { ReactNode } from 'react'
import type { ServiceId } from '@/content/types'

const ACCENT = '#25ED9E'
const INK = '#0A0A0A'

const pictograms: Record<ServiceId, ReactNode> = {
  design: (
    <>
      <rect x="5" y="5" width="38" height="38" rx="5" strokeDasharray="2 3" opacity="0.55" />
      <path d="M11 35C16 17 27 31 37 13" />
      <path d="M37 13l-8-3.5" />
      <circle cx="28" cy="9.2" r="1.9" />
      <rect x="8" y="32" width="6" height="6" rx="1.4" fill={ACCENT} />
      <rect x="34" y="10" width="6" height="6" rx="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  development: (
    <>
      <path d="M16 15l-9 9 9 9M32 15l9 9-9 9" />
      <path d="M27.5 11l-7 26" />
      <rect x="33" y="35.5" width="9" height="4.5" rx="1.2" fill={ACCENT} stroke="none" />
    </>
  ),
  maintenance: (
    <>
      <path d="M39.5 19A16 16 0 0 0 10.6 14.6" />
      <path d="M10 8v7h7" />
      <path d="M8.5 29A16 16 0 0 0 37.4 33.4" />
      <path d="M38 40v-7h-7" />
      <circle cx="24" cy="24" r="6.5" fill={ACCENT} />
      <path d="M21 24.2l2.1 2.1 4-4.3" stroke={INK} />
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
      strokeWidth="1.75"
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
