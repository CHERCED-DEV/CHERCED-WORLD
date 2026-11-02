import type { ReactNode } from 'react'

export function VisuallyHidden({ as: Tag = 'span', children }: { as?: 'span' | 'div' | 'h2' | 'p'; children: ReactNode }) {
  return <Tag className="cw-visually-hidden">{children}</Tag>
}
