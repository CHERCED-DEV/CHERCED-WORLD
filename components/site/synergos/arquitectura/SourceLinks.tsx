import { architecture, sourceHref } from '@/content/synergos-architecture'
import type { Locale, SynergosSource } from '@/content/types'
import styles from './Architecture.module.scss'

export function SourceLinks({ sources, lang }: { sources: SynergosSource[]; lang: Locale }) {
  if (!sources.length) return null
  return (
    <div className={styles.sources} role="group" aria-label={architecture.copy.sources[lang]}>
      {sources.map(source => <a key={`${source.repo}/${source.path}`} href={sourceHref(source)} target="_blank" rel="noopener noreferrer" className={styles.source} data-cw-architecture-source="">{source.label}<span aria-hidden="true">↗</span><span className="cw-visually-hidden"> · {architecture.copy.newTab[lang]}</span></a>)}
    </div>
  )
}
