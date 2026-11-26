import Link from 'next/link'
import type { ReactNode } from 'react'
import { agentCopy } from '@/content/ailab/agent'
import { coreRoute, routeGuides, routeStations } from '@/content/ailab/route'
import recordedTraces from '@/content/ailab/route/recorded-trace.json'
import type { Trace } from '@/lib/ai/agent/trace'
import { fill } from '@/lib/ailab/route/progress'
import { routeViewModel, type RouteStationView, type RouteViewModel } from '@/lib/ailab/route/view'
import { localizedPath, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { routePageLabels, type RoutePageLabels } from './labels'
import { RecordedTrace } from './RecordedTrace'
import { RouteActaButton } from './RouteActaButton'
import styles from './RoutePage.module.scss'
import { RouteView } from './RouteView'
import { StationCard } from './StationCard'
import { StationMark } from './StationMark'

const TRACES = recordedTraces as Record<Locale, Trace>

export type RoutePageViewProps = {
  lang: Locale
  labels: RoutePageLabels
  model: RouteViewModel
  trace: Trace
  breakIt?: ReactNode
}

export function RoutePageView({ lang, labels, model, trace, breakIt }: RoutePageViewProps) {
  const total = model.order.length
  const controls = labels.controls
  const acta = (
    <RouteActaButton
      labels={{ download: controls.actaDownload, hint: controls.actaHint, failed: controls.actaFailed, file: controls.actaFile }}
      proofs={model.proofs}
    />
  )
  const card = (station: RouteStationView) => (
    <StationCard
      key={station.id}
      station={station}
      total={total}
      labels={labels.card}
      mark={<StationMark id={station.id} labels={labels.mark} />}
      extra={station.breakIt ? breakIt : null}
      fallback={station.recordedTrace ? <RecordedTrace lang={lang} trace={trace} copy={agentCopy[lang].trace} labels={labels.trace} /> : null}
    />
  )

  return (
    <div className={styles.page} data-cw-route="">
      <header className={styles.header}>
        <Link href={localizedPath(lang, '/ai-lab')} className={styles.back}>
          ← {labels.back}
        </Link>
        <p className={styles.eyebrow}>{labels.eyebrow}</p>
        <h1 className={styles.h1}>{labels.title}</h1>
        <p className={styles.lead}>{labels.intro}</p>
        <p className={styles.privacy}>{labels.privacy}</p>
        <noscript>
          <p className={styles.noscript} data-cw-route-noscript="">
            {labels.noscript}
          </p>
        </noscript>
      </header>

      <RouteView lang={lang} labels={labels.controls} stations={model.stations} order={model.order} actions={acta}>
        <ol className={styles.sections}>
          {model.sections.map((section) => {
            const headingId = `prueba-${section.proof}`
            return (
              <li key={section.proof} className={styles.section}>
                <section aria-labelledby={headingId} className={styles.sectionBody} data-cw-route-proof={section.proof}>
                  <h2 id={headingId} className={styles.h2}>
                    <span className={styles.proof}>{fill(labels.proof, { n: section.proof })}</span> {section.title}
                  </h2>
                  {card(section.core)}
                  {section.more.length ? (
                    <details className={styles.more} data-cw-route-more={section.proof}>
                      <summary className={styles.moreSummary}>
                        {fill(labels.more, { title: section.title })} ({section.more.length})
                      </summary>
                      <div className={styles.moreList}>{section.more.map(card)}</div>
                    </details>
                  ) : null}
                </section>
              </li>
            )
          })}
        </ol>
      </RouteView>
    </div>
  )
}

export async function routePageInput(lang: Locale): Promise<Omit<RoutePageViewProps, 'breakIt'>> {
  const dict = await getDictionary(lang, 'route')
  return {
    lang,
    labels: routePageLabels(dict),
    model: routeViewModel(lang, dict, routeStations, coreRoute, routeGuides),
    trace: TRACES[lang],
  }
}

export async function RoutePage({ lang }: { lang: Locale }) {
  const input = await routePageInput(lang)
  return <RoutePageView {...input} />
}
