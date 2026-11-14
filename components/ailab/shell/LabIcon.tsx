import type { ReactNode } from 'react'
import type { LabInput } from '@/content/types'

export type LabIconName = LabInput | 'clock' | 'download' | 'engine' | 'cost' | 'shield' | 'browser' | 'cloud'

const paths: Record<LabIconName, ReactNode> = {
  microphone: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.8-3h6.4L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  text: <path d="M5 7V5h14v2M12 5v14M9 19h6" />,
  keyboard: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14h9" />
    </>
  ),
  mouse: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="6" />
      <path d="M12 7v3.5" />
    </>
  ),
  touch: (
    <path d="M9 12V5.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v1.5m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.8-2.4L4.4 15.4a1.6 1.6 0 0 1 2.4-2.1L9 15.5" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  download: <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />,
  engine: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
    </>
  ),
  cost: (
    <>
      <path d="M20.4 13.4l-7 7a2 2 0 0 1-2.8 0L3 12.8V4a1 1 0 0 1 1-1h8.8l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <circle cx="8" cy="8" r="1.5" />
    </>
  ),
  shield: <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />,
  browser: (
    <>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M3 8h18M8 21h8" />
    </>
  ),
  cloud: <path d="M7.5 19h9.6a4.2 4.2 0 0 0 .6-8.36A6 6 0 0 0 6.3 9.6 4.7 4.7 0 0 0 7.5 19z" />,
}

export type LabIconProps = { name: LabIconName; size?: number; className?: string }

export function LabIcon({ name, size = 16, className }: LabIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      data-cw-lab-icon={name}
    >
      {paths[name]}
    </svg>
  )
}
