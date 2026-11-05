import { Fragment, type ReactNode } from 'react'

export function splitTemplate(template: string, token: string): { before: string; after: string } | null {
  const marker = `{${token}}`
  const index = template.indexOf(marker)
  if (index === -1) return null
  return { before: template.slice(0, index), after: template.slice(index + marker.length) }
}

export function withNode(template: string, token: string, node: ReactNode): ReactNode {
  const parts = splitTemplate(template, token)
  if (!parts) return template
  return (
    <Fragment>
      {parts.before}
      {node}
      {parts.after}
    </Fragment>
  )
}
