import type { JSX } from 'react'

export function AtomLoader({ label }: { label: string }): JSX.Element {
  return (
    <span role="status" data-cw-loader="atom">
      <span className="cw-visually-hidden">{label}</span>
    </span>
  )
}

export function DotsLoader({ label }: { label: string }): JSX.Element {
  return (
    <span role="status" data-cw-loader="dots">
      <span className="cw-visually-hidden">{label}</span>
    </span>
  )
}
