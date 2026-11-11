import { architecture, patternName } from '@/content/synergos-architecture'
import type { Locale, SynergosPattern } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { AtlasExplorer } from './AtlasExplorer'
import { SourceLinks } from './SourceLinks'
import styles from './Architecture.module.scss'

const groups = [
  { id: 'composition', es: 'Componer la plataforma', en: 'Composing the platform', ids: ['api-gateway', 'bff', 'micro-frontends', 'contratos-generados'] },
  { id: 'business', es: 'Coordinar el negocio', en: 'Coordinating the business', ids: ['saga', 'reserva-dos-tiempos', 'database-per-service', 'anti-corruption-layer', 'strangler-fig'] },
  { id: 'resilience', es: 'Responder a los fallos', en: 'Responding to failure', ids: ['retry', 'idempotency', 'circuit-breaker', 'cache-aside'] },
  { id: 'operation', es: 'Operar y comunicar', en: 'Operating and communicating', ids: ['rate-limiting', 'health-check', 'config-externalizada', 'event-driven', 'correlation-id'] },
]


function PatternTitle({ pattern, lang }: { pattern: SynergosPattern; lang: Locale }) {
  const { title, canonical } = patternName(pattern, lang)
  return <>{title}{canonical ? <span className={styles.canonical} lang="en">{canonical}</span> : null}</>
}

export function PatternAtlas({ lang }: { lang: Locale }) {
  const copy = architecture.copy
  return <>
    <div className={styles.atlasIntro}><strong>{architecture.patterns.length}<span> / </span></strong><p>{lang === 'es' ? 'Patrones aplicados, con sus límites y la decisión que los sostiene.' : 'Applied patterns, their limits and the decisions behind them.'}</p></div>
    <div data-cw-pattern-atlas="">
      <AtlasExplorer all={lang === 'es' ? 'Todos' : 'All'} label={lang === 'es' ? 'Explorar por función' : 'Explore by purpose'} groups={groups.map(group => ({ id: group.id, label: group[lang], count: group.ids.length }))}>
        {groups.map((group, groupIndex) => <GlassSurface as="section" edge grain depth key={group.id} className={styles.patternGroup} aria-labelledby={`pattern-group-${group.id}`}>
          <div className={styles.groupHeading}><span className={styles.mono}>0{groupIndex + 1}</span><h3 id={`pattern-group-${group.id}`}>{group[lang]}</h3><span className={styles.groupCount}>{group.ids.length}</span></div>
          <div className={styles.patterns}>{group.ids.map(id => {
            const pattern = architecture.patterns.find(item => item.id === id)!
            const index = architecture.patterns.indexOf(pattern)
            return <article key={pattern.id} id={`patron-${pattern.id}`} className={styles.pattern} data-cw-pattern={pattern.id}>
              <div className={styles.patternIdentity}><span className={styles.patternNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h4><PatternTitle pattern={pattern} lang={lang} /></h4><span className={styles.status} data-status={pattern.status}>{copy.statuses[pattern.status][lang]}</span></div>
              <div className={styles.patternBody}><p className={styles.prose}>{pattern.body[lang]}</p>{pattern.limitation ? <div className={styles.limit}><strong>{copy.limitations[lang]}</strong><p className={styles.prose}>{pattern.limitation[lang]}</p></div> : null}<SourceLinks sources={pattern.sources} lang={lang} /></div>
            </article>
          })}</div>
        </GlassSurface>)}
      </AtlasExplorer>
    </div>
    <details className={styles.details} data-cw-pattern-decisions=""><summary>{copy.rejected[lang]}</summary><div className={styles.editorialGrid}>{architecture.decisions.map(decision => <article key={decision.id} className={styles.topic}><h3><PatternTitle pattern={decision} lang={lang} /></h3><p className={styles.prose}>{decision.body[lang]}</p><SourceLinks sources={decision.sources} lang={lang} /></article>)}</div></details>
  </>
}
