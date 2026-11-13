import type { ReactNode } from 'react'

export type IconName =
  | 'menu'
  | 'close'
  | 'back'
  | 'arrow-up'
  | 'sun'
  | 'moon'
  | 'search'
  | 'globe'
  | 'external'
  | 'check'
  | 'alert'
  | 'copy'
  | 'inbox'
  | 'user'

const paths: Record<IconName, ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M19 12H5M11 18l-6-6 6-6" />,
  'arrow-up': <path d="M12 19V5M5 12l7-7 7 7" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9M12 3C9.5 5.7 8.2 8.7 8.2 12s1.3 6.3 3.8 9" />
    </>
  ),
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  check: <path d="M5 12l5 5L20 7" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a1 1 0 0 1 1-1h10" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 13.5h4.6l1.4 2.5h5l1.4-2.5h4.6" />
      <path d="M5.4 6.3A2 2 0 0 1 7.3 5h9.4a2 2 0 0 1 1.9 1.3l1.9 7.2V18a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2v-4.5z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
}

export type IconProps = {
  name: IconName
  size?: number
  title?: string
  className?: string
}

export function Icon({ name, size = 20, title, className }: IconProps) {
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
      focusable="false"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    >
      {paths[name]}
    </svg>
  )
}
