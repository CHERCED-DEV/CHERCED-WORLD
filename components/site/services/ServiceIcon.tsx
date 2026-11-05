import type { ReactNode } from 'react'
import type { ServiceId } from '@/content/types'

const ACCENT = '#25ED9E'

const pictograms: Record<ServiceId, ReactNode> = {
  'ai-harness': (
    <>
      <circle cx="24" cy="24" r="6" fill={ACCENT} />
      <circle cx="9" cy="12" r="3.5" />
      <circle cx="39" cy="12" r="3.5" />
      <circle cx="9" cy="36" r="3.5" />
      <circle cx="39" cy="36" r="3.5" />
      <path d="M12 14l7 6M36 14l-7 6M12 34l7-6M36 34l-7-6" />
    </>
  ),
  'software-factory': (
    <>
      <path d="M8 12h32M8 24h32M8 36h32" />
      <rect x="14" y="9" width="7" height="6" rx="1.5" fill={ACCENT} stroke="none" />
      <rect x="26" y="21" width="7" height="6" rx="1.5" fill={ACCENT} stroke="none" />
      <rect x="18" y="33" width="7" height="6" rx="1.5" fill={ACCENT} stroke="none" />
    </>
  ),
  'process-optimization': (
    <>
      <path d="M8 10h32L28 25v12l-8 4V25z" />
      <path d="M25 15l-4 6h5l-4 6" stroke={ACCENT} />
    </>
  ),
  architecture: (
    <>
      <path d="M24 8l16 8-16 8-16-8z" />
      <path d="M8 24l16 8 16-8" />
      <path d="M8 32l16 8 16-8" stroke={ACCENT} />
    </>
  ),
  product: (
    <>
      <path d="M24 6c6 5 8 12 8 20l-4 6h-8l-4-6c0-8 2-15 8-20z" />
      <circle cx="24" cy="20" r="3" fill={ACCENT} />
      <path d="M16 28l-5 6 6 1M32 28l5 6-6 1M21 36l3 6 3-6" />
    </>
  ),
  workshops: (
    <>
      <rect x="7" y="8" width="34" height="20" rx="2.5" />
      <path d="M13 15h14M13 21h9" />
      <circle cx="16" cy="36" r="3" fill={ACCENT} stroke="none" />
      <circle cx="32" cy="36" r="3" />
      <path d="M10 42c1-3 3-4 6-4s5 1 6 4M26 42c1-3 3-4 6-4s5 1 6 4" />
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
