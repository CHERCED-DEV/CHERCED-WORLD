import { architecture } from '@/content/synergos-architecture'
import type { Locale } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { SourceLinks } from './SourceLinks'
import styles from './Architecture.module.scss'

export function PatternAtlas({ lang }: { lang: Locale }) {
  const copy = architecture.copy
  return (
    <>
      <div className={styles.patterns} data-cw-pattern-atlas="">
        {architecture.patterns.filter(pattern => pattern.status !== 'descartado').map((pattern, index) => (
          <GlassSurface as="article" edge grain depth light key={pattern.id} id={`patron-${pattern.id}`} className={`${styles.card} ${styles.pattern}`} data-cw-pattern={pattern.id}>
            <span className={styles.patternNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span className={styles.status} data-status={pattern.status}>{copy.statuses[pattern.status][lang]}</span>
            <h3>{pattern.name}</h3>
            <p className={styles.prose}>{pattern.body[lang]}</p>
            {pattern.limitation ? <div className={styles.limit}><strong>{copy.limitations[lang]}</strong><p className={styles.prose}>{pattern.limitation[lang]}</p></div> : null}
            <SourceLinks sources={pattern.sources} lang={lang} />
          </GlassSurface>
        ))}
      </div>
      <details className={styles.details} data-cw-pattern-decisions="">
        <summary>{copy.rejected[lang]}</summary>
        <div className={styles.split}>{architecture.decisions.map(decision => <article key={decision.id} className={styles.topic}><h3>{decision.name}</h3><p className={styles.prose}>{decision.body[lang]}</p><SourceLinks sources={decision.sources} lang={lang} /></article>)}</div>
      </details>
    </>
  )
}
