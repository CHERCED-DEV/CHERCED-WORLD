import Link from 'next/link'
import { architecture, patternName, SYNERGOS_ARCHITECTURE_PATH } from '@/content/synergos-architecture'
import type { Locale } from '@/content/types'
import { localizedPath } from '@/lib/i18n/paths'
import styles from './Architecture.module.scss'

export function PatternLinks({ ids, lang }: { ids?: string[]; lang: Locale }) {
  const selected = architecture.patterns.filter(pattern => ids?.includes(pattern.id))
  if (!selected.length) return null
  return <section className={styles.topic} aria-label={architecture.copy.patternLinks[lang]} data-cw-case-patterns=""><h2>{architecture.copy.patternLinks[lang]}</h2><ul className={styles.patternLinks}>{selected.map(pattern => <li key={pattern.id}><Link href={`${localizedPath(lang, SYNERGOS_ARCHITECTURE_PATH)}#patron-${pattern.id}`}>{patternName(pattern, lang).title} →</Link></li>)}</ul></section>
}
