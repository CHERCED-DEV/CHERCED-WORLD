import type { ReactNode } from 'react'
import { labExperiment, labRepoHref } from '@/content/ailab/catalog'
import type { LabExperiment, LabExperimentId } from '@/content/types'
import { CodeBlock } from '@/components/blog/mdx/CodeBlock'
import { AdrCards } from '@/components/ui/AdrCards'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { formatBytes } from '@/lib/ailab/core/format'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'
import { labCardLabels, labDemoCopy, labTryLabels, type LabCardLabels } from './labels'
import styles from './LabCard.module.scss'
import { LabTry } from './LabTry'
import { RunsInBadge } from './RunsInBadge'
import { StatusBadge } from './StatusBadge'
import type { LabTryLabels } from './types'

export type LabCardSlots = { demo?: ReactNode; how?: ReactNode; code?: ReactNode }

export type LabCardViewProps = LabCardSlots & {
  lang: Locale
  experiment: LabExperiment
  labels: LabCardLabels
  tryLabels: LabTryLabels
  copy: Record<string, string>
}

export function labCardId(id: LabExperimentId): string {
  return `lab-${id.toLowerCase()}`
}

function Downloads({ lang, experiment, labels, id }: { lang: Locale; experiment: LabExperiment; labels: LabCardLabels; id: string }) {
  if (experiment.downloads.length === 0) {
    return (
      <p id={id} className={styles.downloadsNone} data-cw-lab-downloads="none">
        {labels.downloads.none}
      </p>
    )
  }
  return (
    <div id={id} className={styles.downloads} data-cw-lab-downloads="">
      <p className={styles.downloadsTitle}>{labels.downloads.title}</p>
      <ul className={styles.downloadsList}>
        {experiment.downloads.map((download) => (
          <li key={download.resource} data-cw-lab-download={download.default ? 'default' : 'optional'} data-bytes={download.bytes}>
            {t({ item: labels.downloads.item }, 'item', {
              resource: download.resource,
              size: formatBytes(download.bytes, lang),
              host: download.host,
            })}
            {download.engine ? (
              <span data-cw-lab-engine="">
                {` + ${t({ engine: labels.downloads.engine }, 'engine', {
                  resource: download.engine.resource,
                  size: formatBytes(download.engine.bytes, lang),
                })}`}
              </span>
            ) : null}
            {download.default ? null : <span className={styles.optional}> · {labels.downloads.optional}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function How({ lang, experiment, labels }: { lang: Locale; experiment: LabExperiment; labels: LabCardLabels }) {
  const cards = experiment.adrCards.map((card) => ({ decision: card.decision[lang], why: card.why[lang], tradeoff: card.tradeoff[lang] }))
  return (
    <div className={styles.how}>
      {experiment.flow.length > 0 ? (
        <figure className={styles.flowFigure}>
          <figcaption className={styles.subhead}>{labels.how.flow}</figcaption>
          <ol className={styles.flow} data-cw-lab-flow="">
            {experiment.flow.map((step, index) => (
              <li key={index} className={styles.step}>
                <span className={styles.stepIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{step[lang]}</span>
              </li>
            ))}
          </ol>
        </figure>
      ) : null}
      {cards.length > 0 ? (
        <div className={styles.decisions}>
          <p className={styles.subhead}>{labels.how.decisions}</p>
          <AdrCards cards={cards} labels={labels.adr} columns={1} />
        </div>
      ) : null}
    </div>
  )
}

function Code({ experiment, labels }: { experiment: LabExperiment; labels: LabCardLabels }) {
  const { code } = experiment
  if (!code) return null
  return (
    <div className={styles.code} data-cw-lab-code="">
      <CodeBlock labels={labels.copy}>
        <code className={`language-${code.lang}`}>{code.snippet}</code>
      </CodeBlock>
      {code.repoPath ? (
        <p className={styles.repo}>
          <span className={styles.repoPath}>{t({ file: labels.code.file }, 'file', { path: code.repoPath })}</span>
          <a href={labRepoHref(code.repoPath)} target="_blank" rel="noopener noreferrer" data-cw-lab-repo="">
            {labels.code.repo}
          </a>
        </p>
      ) : null}
    </div>
  )
}

export function LabCardView({ lang, experiment, labels, tryLabels, copy, demo, how, code }: LabCardViewProps) {
  const base = labCardId(experiment.id)
  const titleId = `${base}-title`
  const downloadsId = `${base}-downloads`
  const howContent = how ?? <How lang={lang} experiment={experiment} labels={labels} />
  const codeContent = code ?? (experiment.code ? <Code experiment={experiment} labels={labels} /> : null)

  return (
    <GlassSurface
      as="article"
      id={base}
      variant="standard"
      className={styles.card}
      aria-labelledby={titleId}
      edge
      grain
      depth
      light
      sweep
      float={1}
      data-cw-lab-card={experiment.id}
      data-cw-lab-theme={experiment.theme}
    >
      <header className={styles.head}>
        <h3 id={titleId} className={styles.title}>
          {experiment.title[lang]}
        </h3>
        <p className={styles.badges}>
          <StatusBadge status={experiment.status} label={labels.status[experiment.status]} prefix={labels.statusPrefix} />
          <RunsInBadge runsIn={experiment.runsIn} label={labels.runsIn[experiment.runsIn]} />
        </p>
      </header>

      <p className={styles.summary}>{experiment.summary[lang]}</p>

      <p className={styles.privacy} data-cw-lab-privacy="">
        <svg className={styles.privacyIcon} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <span className="cw-visually-hidden">{labels.privacy}: </span>
        {experiment.privacy[lang]}
      </p>

      <section className={styles.part} aria-labelledby={`${base}-try`} data-cw-lab-part="try">
        <h4 id={`${base}-try`} className={styles.partTitle}>
          {labels.parts.try}
        </h4>
        <Downloads lang={lang} experiment={experiment} labels={labels} id={downloadsId} />
        {demo ?? (
          <LabTry
            lang={lang}
            experiment={experiment.id}
            downloads={experiment.downloads}
            labels={tryLabels}
            copy={copy}
            describedBy={downloadsId}
          />
        )}
        <p className={styles.noscript} data-cw-lab-noscript="">
          {labels.noscript}
        </p>
      </section>

      <details className={styles.disclosure} data-cw-lab-part="how">
        <summary className={styles.summaryRow}>
          <h4 className={styles.partTitle}>{labels.parts.how}</h4>
        </summary>
        <div className={styles.disclosureBody}>{howContent}</div>
      </details>

      {codeContent ? (
        <details className={styles.disclosure} data-cw-lab-part="code">
          <summary className={styles.summaryRow}>
            <h4 className={styles.partTitle}>{labels.parts.code}</h4>
          </summary>
          <div className={styles.disclosureBody}>{codeContent}</div>
        </details>
      ) : null}
    </GlassSurface>
  )
}

export type LabCardProps = LabCardSlots & { lang: Locale; experiment: LabExperimentId | LabExperiment }

export async function LabCard({ lang, experiment, ...slots }: LabCardProps) {
  const data = typeof experiment === 'string' ? labExperiment(experiment) : experiment
  const [ailab, site, blog] = await Promise.all([getDictionary(lang, 'ailab'), getDictionary(lang, 'site'), getDictionary(lang, 'blog')])
  return (
    <LabCardView
      lang={lang}
      experiment={data}
      labels={labCardLabels(ailab, site, blog)}
      tryLabels={labTryLabels(ailab, data.title[lang])}
      copy={labDemoCopy(ailab, data.id)}
      {...slots}
    />
  )
}
