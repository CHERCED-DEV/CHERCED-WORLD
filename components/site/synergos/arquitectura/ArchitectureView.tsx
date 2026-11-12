import Link from 'next/link'
import { architecture, architectureChapters } from '@/content/synergos-architecture'
import type { Locale } from '@/content/types'
import { localizedPath } from '@/lib/i18n/paths'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks, GlowOrb, GridLines } from '@/components/ui/graphics'
import { Reveal } from '@/components/ui/Reveal'
import { SectionTitle } from '@/components/site/SectionTitle'
import { buttonClassName } from '@/components/ui/Button'
import { ArchitectureDiagram } from './ArchitectureDiagram'
import { RecorridoDiagram } from './RecorridoDiagram'
import { PatternAtlas } from './PatternAtlas'
import { SourceLinks } from './SourceLinks'
import { SystemBlueprint } from './SystemBlueprint'
import styles from './Architecture.module.scss'
import journey from '../ScrollJourney.module.scss'
import { ScrollProgress } from '../ScrollProgress'

function Topic({ id, lang, skipLead = false }: { id: string; lang: Locale; skipLead?: boolean }) {
  const topic = architecture.topics.find(item => item.id === id)
  if (!topic || topic.private) return null
  return <article className={styles.topic} data-cw-architecture-topic={id}>
    <h3>{topic.title[lang]}</h3>
    {topic.body.slice(skipLead ? 1 : 0).map(paragraph => <p key={paragraph.en} className={styles.prose}>{paragraph[lang]}</p>)}
    <SourceLinks sources={topic.sources} lang={lang} />
  </article>
}

export function ArchitectureView({ lang }: { lang: Locale }) {
  const { copy, facts } = architecture
  const chapters = architectureChapters(lang)
  const leadTopics: Record<string, string> = { recorrido: 'frameworks', contratos: 'contratos', islas: 'islas' }
  const counted = new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${facts.countedAt}T00:00:00Z`))
  const ui = lang === 'es' ? { start: 'Ver el recorrido', atlas: 'Explorar los patrones', chapter: 'Dentro del sistema', code: 'El mismo contrato. Dos lenguajes.', factory: 'Lo construido y el siguiente paso.', public: 'Arquitectura abierta', pilot: 'Del spec al resultado', guide: 'Cinco capítulos, del CMS a la fábrica. Cada tema enlaza a sus fuentes públicas y el índice marca el capítulo en el que vas.' } : { start: 'Explore the system', atlas: 'Explore the patterns', chapter: 'Inside the system', code: 'One contract. Two languages.', factory: 'What exists. What comes next.', public: 'Open architecture', pilot: 'From spec to result', guide: 'Five chapters, from the CMS to the factory. Each topic links to its public sources, and the index marks the chapter you are reading.' }
  return <div className={styles.page} data-cw-synergos-architecture="">
    <ScrollProgress />
    <header className={styles.opening}>
      <Link className={styles.back} href={localizedPath(lang, '/synergos')}>← {copy.back[lang]}</Link>
      <GlassSurface className={styles.hero} edge grain depth light>
        <GridLines fade="radial" /><GlowOrb tone="accent" size="lg" x="85%" y="45%" /><CornerMarks />
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{ui.public}<span aria-hidden="true"> / 01—05</span></p>
          <SectionTitle as="h1" size="lg" className={styles.title}>{copy.title[lang]}</SectionTitle>
          <p className={styles.heroStatement}>{copy.lead[lang]}</p>
          <p className={styles.heroGuide} data-cw-architecture-guide="">{ui.guide}</p>
          <div className={styles.heroActions}>
            <a href="#recorrido" className={buttonClassName({ variant: 'solid', size: 'lg' })}>{ui.start} <span aria-hidden="true">↓</span></a>
            <a href="#patrones" className={styles.textAction}>{ui.atlas} <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <SystemBlueprint lang={lang} />
        <div className={styles.heroFooter}>
          <div className={styles.facts} data-cw-architecture-facts="">{(['pieces', 'capabilities', 'orchestrators'] as const).map(key => <div key={key} className={styles.fact}><strong>{facts[key]}</strong><span>{copy.facts[key][lang]}</span></div>)}</div>
          <p className={styles.date}>{copy.counted[lang]}<br /><time dateTime={facts.countedAt}>{counted}</time></p>
        </div>
      </GlassSurface>
    </header>
    {chapters.map(({ id, number, label }) => {
      const lead = architecture.topics.find(topic => !topic.private && topic.id === leadTopics[id])?.body[0]
      return <Reveal as="section" id={id} key={id} className={styles.section} aria-labelledby={`architecture-${id}`} data-cw-architecture-section={id}>
        <header className={`${styles.chapterHeading} ${journey.chapter}`}>
          <p className={styles.eyebrow}><span className={styles.chapterNumber}>{number}</span>{ui.chapter}</p>
          <SectionTitle id={`architecture-${id}`}>{label}</SectionTitle>
          {lead ? <p className={styles.sectionLead}>{lead[lang]}</p> : null}
        </header>
        {id === 'recorrido' ? <>
          <RecorridoDiagram lang={lang} />
          <GlassSurface className={styles.editorialGrid} edge grain depth><Topic id="frameworks" lang={lang} skipLead /><Topic id="cdn" lang={lang} /><Topic id="umbraco" lang={lang} /></GlassSurface>
        </> : null}
        {id === 'contratos' ? <>
          <ArchitectureDiagram kind="contratos" lang={lang} />
          <div className={styles.contractStory}>
            <GlassSurface className={styles.editorial} edge grain depth><Topic id="contratos" lang={lang} skipLead /></GlassSurface>
            <GlassSurface className={styles.codeWorkbench} edge grain depth>
              <p className={styles.eyebrow}>{ui.code}</p>
              <div className={styles.examples}>{architecture.examples.map(example => <article key={example.language} className={styles.example}><h3><span aria-hidden="true">{example.language === 'C#' ? '{ }' : '⟨ ⟩'}</span>{example.language}</h3><pre tabIndex={0}><code>{example.code}</code></pre><SourceLinks sources={[example.source]} lang={lang} /></article>)}</div>
            </GlassSurface>
          </div>
          <div className={styles.featureBand}><span aria-hidden="true" className={styles.atomicMark}>◈</span><Topic id="atomico" lang={lang} /></div>
        </> : null}
        {id === 'islas' ? <div className={styles.islandStory}><ArchitectureDiagram kind="islas" lang={lang} /><GlassSurface className={styles.editorial} edge grain depth><Topic id="islas" lang={lang} skipLead /></GlassSurface></div> : null}
        {id === 'patrones' ? <PatternAtlas lang={lang} /> : null}
        {id === 'fabrica' ? <>
          <p className={styles.factoryLead}>{ui.factory}</p>
          <div className={styles.factoryGrid}>{(['hecho', 'vision'] as const).map(status => <GlassSurface key={status} as="article" edge grain depth light className={styles.factory} data-cw-factory-status={status}>
            <div className={styles.factoryTitle}><span className={styles.status} data-status={status}>{status === 'hecho' ? '●' : '◌'}</span><h3>{status === 'hecho' ? copy.built[lang] : copy.vision[lang]}</h3></div>
            {architecture.factory.filter(item => item.status === status).map((item, i) => <div className={styles.milestone} key={item.id}>
              <span className={styles.milestoneIndex} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <div><h4>{item.title[lang]}</h4><p className={styles.prose}>{item.body[lang]}</p><SourceLinks sources={item.sources} lang={lang} /></div>
            </div>)}
          </GlassSurface>)}</div>
        </> : null}
      </Reveal>
    })}
    <GlassSurface className={styles.accessibility} edge grain depth><Topic id="accesibilidad" lang={lang} /></GlassSurface>
    <footer className={styles.closing}><p className={styles.date}>{copy.summary[lang]}</p><Link href={localizedPath(lang, '/synergos')} className={styles.textAction}>← {copy.back[lang]}</Link></footer>
  </div>
}
