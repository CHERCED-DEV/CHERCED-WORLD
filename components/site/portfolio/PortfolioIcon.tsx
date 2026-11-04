import type { ReactNode } from 'react'

export type PortfolioIconName =
  | 'reload'
  | 'desktop'
  | 'phone'
  | 'expand'
  | 'collapse'
  | 'lock'
  | 'live'
  | 'zoom'
  | 'arrow-left'
  | 'arrow-right'
  | 'grid'
  | 'layers'
  | 'code'
  | 'cube'
  | 'database'
  | 'pen'
  | 'nodes'
  | 'spark'

const paths: Record<PortfolioIconName, ReactNode> = {
  reload: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </>
  ),
  desktop: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </>
  ),
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  collapse: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  live: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" />
    </>
  ),
  zoom: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4M11 8v6M8 11h6" />
    </>
  ),
  'arrow-left': <path d="M19 12H5M11 18l-6-6 6-6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  layers: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5" />,
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />,
  cube: <path d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5L12 2.5zM3.5 7.25L12 12l8.5-4.75M12 12v9.5" />,
  database: (
    <>
      <ellipse cx="12" cy="5.5" rx="8" ry="3" />
      <path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  pen: <path d="M4 20l4.5-1.2L19.3 8a2.1 2.1 0 0 0-3-3L5.5 15.8 4 20zM14.5 6.5l3 3" />,
  nodes: (
    <>
      <circle cx="5" cy="12" r="2.2" />
      <circle cx="19" cy="5" r="2.2" />
      <circle cx="19" cy="19" r="2.2" />
      <path d="M7 11l10-5M7 13l10 5" />
    </>
  ),
  spark: <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />,
}

export function PortfolioIcon({ name, size = 18, className }: { name: PortfolioIconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      focusable="false"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
