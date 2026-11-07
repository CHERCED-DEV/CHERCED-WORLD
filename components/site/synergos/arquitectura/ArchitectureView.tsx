import Link from 'next/link'
import { architecture } from '@/content/synergos-architecture'
import type { Locale } from '@/content/types'
import { localizedPath } from '@/lib/i18n/paths'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks, GridLines } from '@/components/ui/graphics'
import { cx } from '@/components/ui/cx'
import { ArchitectureDiagram } from './ArchitectureDiagram'
import { RecorridoDiagram } from './RecorridoDiagram'
import { PatternAtlas } from './PatternAtlas'
import { SourceLinks } from './SourceLinks'
import styles from './Architecture.module.scss'

function Topic({ id, lang }: { id: string; lang: Locale }) {
  const topic = architecture.topics.find(item => item.id === id)
  if (!topic || topic.private) return null
  return <article className={styles.topic} data-cw-architecture-topic={id}><h3>{topic.title[lang]}</h3>{topic.body.map(paragraph => <p key={paragraph.en} className={styles.prose}>{paragraph[lang]}</p>)}<SourceLinks sources={topic.sources} lang={lang} /></article>
}

export function ArchitectureView({ lang }: { lang: Locale }) {
  const { copy, facts } = architecture
  const sections = Object.entries(copy.sections)
  const counted = new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${facts.countedAt}T00:00:00Z`))
  return (
    <div className={styles.page} data-cw-synergos-architecture="">
      <header className={styles.section}>
        <Link className={styles.back} href={localizedPath(lang, '/synergos')}>← {copy.back[lang]}</Link>
        <GlassSurface className={styles.hero} edge grain>
          <GridLines fade="radial" /><CornerMarks />
          <p className={styles.eyebrow}>{copy.eyebrow[lang]}</p>
          <h1 className={styles.title}>{copy.title[lang]}</h1>
          <p className={styles.lead}>{copy.lead[lang]}</p>
          <div className={styles.facts}>{(['pieces', 'capabilities', 'orchestrators'] as const).map(key => <div key={key} className={styles.fact}><strong>{facts[key]}</strong><span>{copy.facts[key][lang]}</span></div>)}</div>
          <p className={styles.date}>{copy.counted[lang]} · <time dateTime={facts.countedAt}>{counted}</time></p>
        </GlassSurface>
        <nav className={styles.toc} aria-label={copy.nav[lang]}>{sections.map(([id, label], index) => <a key={id} href={`#${id}`}>{String(index + 1).padStart(2, '0')} · {label[lang]}</a>)}</nav>
      </header>
      {sections.map(([id, label], index) => (
        <section id={id} key={id} className={styles.section} aria-labelledby={`architecture-${id}`} data-cw-architecture-section={id}>
          <div className={styles.heading}><span aria-hidden="true">{String(index + 1).padStart(2, '0')} /</span><h2 id={`architecture-${id}`}>{label[lang]}</h2></div>
          {id === 'recorrido' ? <>
            <RecorridoDiagram lang={lang} />
            <div className={styles.split}><GlassSurface className={styles.card}><Topic id="frameworks" lang={lang} /></GlassSurface><GlassSurface className={styles.card}><Topic id="cdn" lang={lang} /></GlassSurface></div>
            <GlassSurface className={styles.card}><Topic id="umbraco" lang={lang} /></GlassSurface>
          </> : null}
          {id === 'contratos' ? <>
            <ArchitectureDiagram kind="contratos" lang={lang} />
            <GlassSurface className={styles.card}><Topic id="contratos" lang={lang} /></GlassSurface>
            <div className={styles.examples}>{architecture.examples.map(example => <article key={example.language} className={styles.example}><h3>{example.language}</h3><pre tabIndex={0}><code>{example.code}</code></pre><SourceLinks sources={[example.source]} lang={lang} /></article>)}</div>
            <GlassSurface className={styles.card}><Topic id="atomico" lang={lang} /></GlassSurface>
          </> : null}
          {id === 'islas' ? <><ArchitectureDiagram kind="islas" lang={lang} /><GlassSurface className={styles.card}><Topic id="islas" lang={lang} /></GlassSurface></> : null}
          {id === 'patrones' ? <PatternAtlas lang={lang} /> : null}
          {id === 'fabrica' ? <div className={styles.factoryGrid}>{(['hecho', 'vision'] as const).map(status => <GlassSurface key={status} as="article" className={cx(styles.factory, status === 'vision' && styles.vision)} data-cw-factory-status={status}><h3>{status === 'hecho' ? copy.built[lang] : copy.vision[lang]}</h3>{architecture.factory.filter(item => item.status === status).map(item => <div className={styles.milestone} key={item.id}><h4>{item.title[lang]}</h4><p className={styles.prose}>{item.body[lang]}</p><SourceLinks sources={item.sources} lang={lang} /></div>)}</GlassSurface>)}</div> : null}
        </section>
      ))}
      <GlassSurface className={styles.card}><Topic id="accesibilidad" lang={lang} /></GlassSurface>
      <p className={styles.date}>{copy.summary[lang]}</p>
    </div>
  )
}
