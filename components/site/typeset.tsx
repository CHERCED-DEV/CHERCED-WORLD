import type { CSSProperties, ReactNode } from 'react'
import type { Locale } from '@/lib/i18n/config'

const NBSP = ' '

const NOWRAP: CSSProperties = { whiteSpace: 'nowrap' }

export const ENGLISH_TERMS: readonly string[] = [
  'Software Solutions Engineer',
  'Development Solutions Engineer',
  'Founder & Software Architect',
  'Founder & Business Manager',
  'Frontend Web Developer',
  'Spec-Driven Development',
  'server-side rendering',
  'Manage My Booking',
  'backend-for-frontend',
  'AI Engineer',
  'Gold Partner',
  'pixel-perfect',
  'cross-origin',
  'prefetching',
  'spec-driven',
  'AI-First',
  'AI-first',
  'downtime',
  'Check-in',
  'harness',
  'setups',
]

const UNBREAKABLE = /^AI-[Ff]irst$/

function escape(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const TERMS = new RegExp(`(?<![\\p{L}\\p{N}-])(${ENGLISH_TERMS.map(escape).join('|')})(?![\\p{L}\\p{N}-])`, 'u')

const HYPHENATED = /[^\s ·]+-[^\s ·]+/u

export function nbsp(text: string): string {
  return text.replace(/ (\.NET\b)/g, `${NBSP}$1`)
}

export type TypesetOptions = { keepHyphens?: boolean }

export function typeset(text: string, lang: Locale, { keepHyphens = false }: TypesetOptions = {}): ReactNode {
  const source = nbsp(text)
  const pattern = new RegExp(`${TERMS.source}|(${HYPHENATED.source})`, 'gu')
  const nodes: ReactNode[] = []
  let last = 0
  for (const match of source.matchAll(pattern)) {
    const [token] = match
    const english = lang === 'es' && match[1] !== undefined
    const unbroken = UNBREAKABLE.test(token) || (keepHyphens && token.includes('-'))
    if (!english && !unbroken) continue
    if (match.index > last) nodes.push(source.slice(last, match.index))
    nodes.push(
      <span key={match.index} lang={english ? 'en' : undefined} style={unbroken ? NOWRAP : undefined}>
        {token}
      </span>,
    )
    last = match.index + token.length
  }
  if (nodes.length === 0) return source
  if (last < source.length) nodes.push(source.slice(last))
  return nodes
}
