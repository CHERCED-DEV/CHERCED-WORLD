'use client'

import type { CotejoReport, Family, Finding, Lang, Profile } from 'cotejo-core'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import samples from '@/content/ailab/cotejo/samples.json'
import { COTEJO_DEFECTS, COTEJO_SAMPLE_LINES } from '@/content/ailab/cotejo/truth'
import { useCotejoClient } from '@/lib/ailab/cotejo/client'
import { checkInput, countLines, sourceLines } from '@/lib/ailab/cotejo/input'
import { FAMILY_ORDER, isScored, matchDefect, scoreFindings } from '@/lib/ailab/cotejo/metrics'
import { COTEJO_MAX_CHARS, COTEJO_MAX_LINES, type CotejoInput, type TraceView } from '@/lib/ailab/cotejo/protocol'
import type { Locale } from '@/lib/i18n/config'
import { CotejoDownloads } from './CotejoDownloads'
import { CotejoMetrics } from './CotejoMetrics'
import { COTEJO_ACTION_RUNS_URL, COTEJO_REPO_URL, cotejoMs, cotejoNumber, cotejoText } from './copy'
import styles from './CotejoStage.module.scss'
import { FindingDetail } from './FindingDetail'
import { SemanticLayers } from './SemanticLayers'
import { TracePanel, type TracePhase } from './TracePanel'

type SourceChoice = 'sample-es' | 'sample-en' | 'pasted'

type ProfileChoice = 'auto' | Profile

type Run = {
  input: CotejoInput
  sample: Lang | null
  lines: string[]
  lineCount: number
  ms: number
  roundTripMs: number
}

type Phase = 'idle' | 'running' | 'failed' | 'evicted'

const SOURCES: readonly SourceChoice[] = ['sample-es', 'sample-en', 'pasted']

const PROFILES: readonly ProfileChoice[] = ['auto', 'speckit', 'cherced', 'breve']

const FRAGMENT_CHARS = 140

function sampleOf(source: SourceChoice): Lang | null {
  return source === 'sample-es' ? 'es' : source === 'sample-en' ? 'en' : null
}

function inputFor(source: SourceChoice, pasted: string, profile: ProfileChoice, lang: Locale): CotejoInput {
  const sample = sampleOf(source)
  if (sample) return { text: samples[sample], path: lang === 'en' ? `sample.${sample}.md` : `muestra.${sample}.md`, lang: sample }
  return { text: pasted, path: lang === 'en' ? 'your-spec.md' : 'tu-spec.md', ...(profile === 'auto' ? {} : { profile }) }
}

function linesLabel(finding: Finding): string {
  return [...new Set(finding.evidence.map((item) => item.line))].map((line) => `L${line}`).join(', ')
}

function fragmentOf(finding: Finding): string {
  const fragment = finding.evidence[0]?.fragment ?? ''
  return fragment.length > FRAGMENT_CHARS ? `${fragment.slice(0, FRAGMENT_CHARS - 1)}…` : fragment
}

function reasonText(lang: Locale, error: unknown): string {
  return error instanceof Error && error.message ? error.message : cotejoText(lang)('cotejo.failed.unknown')
}

export function CotejoView({ lang, experiment, downloads }: Pick<LabDemoProps, 'lang' | 'experiment' | 'downloads'>) {
  const text = cotejoText(lang)
  const baseId = useId()
  const [source, setSource] = useState<SourceChoice>(lang === 'en' ? 'sample-en' : 'sample-es')
  const [pasted, setPasted] = useState('')
  const [profile, setProfile] = useState<ProfileChoice>('auto')
  const [core, setCore] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [run, setRun] = useState<Run | null>(null)
  const [report, setReport] = useState<CotejoReport | null>(null)
  const [trace, setTrace] = useState<{ phase: TracePhase; view: TraceView | null }>({ phase: 'idle', view: null })
  const [open, setOpen] = useState<string | null>(null)
  const [runKey, setRunKey] = useState(0)
  const generation = useRef(0)

  const onEvict = useCallback(() => {
    generation.current += 1
    setPhase('evicted')
    setRun(null)
    setReport(null)
    setTrace({ phase: 'idle', view: null })
    setOpen(null)
  }, [])

  const client = useCotejoClient(experiment, onEvict)

  useEffect(() => {
    let active = true
    client
      .ping()
      .then((version) => {
        if (active) setCore(version)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [client])

  const pastedCheck = useMemo(() => checkInput(pasted), [pasted])
  const pastedLines = useMemo(() => countLines(pasted), [pasted])
  const sample = sampleOf(source)
  const blocked = source === 'pasted' && !pastedCheck.ok

  const analyze = async () => {
    const input = inputFor(source, pasted, profile, lang)
    if (!checkInput(input.text).ok) return
    generation.current += 1
    const current = generation.current
    setPhase('running')
    setError(null)
    setOpen(null)
    try {
      const result = await client.analyze(input)
      if (current !== generation.current) return
      setRun({ input, sample: sampleOf(source), lines: sourceLines(input.text), lineCount: result.lines, ms: result.ms, roundTripMs: result.roundTripMs })
      setReport(result.report)
      setTrace({ phase: 'idle', view: null })
      setRunKey(current)
      setPhase('idle')
    } catch (failure) {
      if (current !== generation.current) return
      setPhase('failed')
      setError(reasonText(lang, failure))
    }
  }

  const onSemantic = useCallback(
    (next: CotejoReport) => {
      if (runKey === generation.current) setReport(next)
    },
    [runKey],
  )

  const runTrace = async () => {
    const current = generation.current
    setTrace((state) => ({ ...state, phase: 'loading' }))
    try {
      const result = await client.trace()
      if (current !== generation.current) return
      setReport(result.report)
      setTrace({ phase: 'ready', view: result.trace })
    } catch {
      if (current !== generation.current) return
      setTrace({ phase: 'failed', view: null })
    }
  }

  const score = useMemo(() => (report && run?.sample ? scoreFindings(report.findings, COTEJO_DEFECTS) : null), [report, run])
  const semanticOn = Boolean(report?.findings.some((finding) => finding.layers.includes('C3')))
  const groups = useMemo(() => {
    if (!report) return []
    const scored = report.findings.filter(isScored)
    return FAMILY_ORDER.map((family) => ({ family, findings: scored.filter((finding) => finding.family === family) })).filter((group) => group.findings.length > 0)
  }, [report])
  const fileBase = run ? (run.sample ? `cotejo-${lang === 'en' ? 'sample' : 'muestra'}-${run.sample}` : `cotejo-${lang === 'en' ? 'your-spec' : 'tu-spec'}`) : 'cotejo'

  return (
    <div className={styles.stage} data-cw-cotejo="" data-cw-cotejo-ready={core ? '' : undefined}>
      <p className={styles.note} data-cw-cotejo-intro="">
        {text('cotejo.intro', { version: core ?? '0.1.0' })}
      </p>

      <fieldset className={styles.sources}>
        <legend className={styles.label}>{text('cotejo.source.legend')}</legend>
        {SOURCES.map((choice) => (
          <label key={choice} className={styles.choice}>
            <input
              type="radio"
              name={`${baseId}-source`}
              value={choice}
              checked={source === choice}
              onChange={() => setSource(choice)}
              data-cw-cotejo-source={choice}
            />
            <span>{text(`cotejo.source.${choice}`)}</span>
          </label>
        ))}
      </fieldset>

      {sample ? (
        <p className={styles.muted}>{text('cotejo.source.sampleHint', { lines: COTEJO_SAMPLE_LINES, defects: COTEJO_DEFECTS.length })}</p>
      ) : (
        <div className={styles.paste}>
          <label className={styles.label} htmlFor={`${baseId}-paste`}>
            {text('cotejo.paste.label')}
          </label>
          <textarea
            id={`${baseId}-paste`}
            className={styles.textarea}
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            rows={10}
            spellCheck={false}
            aria-describedby={`${baseId}-paste-hint ${baseId}-paste-count ${baseId}-paste-private`}
            data-cw-cotejo-paste=""
          />
          <p id={`${baseId}-paste-hint`} className={styles.muted}>
            {text('cotejo.paste.hint', { max: cotejoNumber(COTEJO_MAX_LINES, lang) })}
          </p>
          <p id={`${baseId}-paste-count`} className={pastedCheck.ok || pastedCheck.reason === 'empty' ? styles.muted : styles.error} data-cw-cotejo-count={pastedLines}>
            {!pastedCheck.ok && pastedCheck.reason === 'lines'
              ? text('cotejo.paste.tooLong', { lines: cotejoNumber(pastedLines, lang), max: cotejoNumber(COTEJO_MAX_LINES, lang) })
              : !pastedCheck.ok && pastedCheck.reason === 'chars'
                ? text('cotejo.paste.tooBig', { max: cotejoNumber(COTEJO_MAX_CHARS, lang) })
                : text('cotejo.paste.count', { lines: cotejoNumber(pastedLines, lang), max: cotejoNumber(COTEJO_MAX_LINES, lang) })}
          </p>
          <p id={`${baseId}-paste-private`} className={styles.private} data-cw-cotejo-private="">
            {text('cotejo.paste.private')}
          </p>
          <label className={styles.label} htmlFor={`${baseId}-profile`}>
            {text('cotejo.profile.label')}
          </label>
          <select id={`${baseId}-profile`} className={styles.select} value={profile} onChange={(event) => setProfile(event.target.value as ProfileChoice)} data-cw-cotejo-profile="">
            {PROFILES.map((choice) => (
              <option key={choice} value={choice}>
                {text(`cotejo.profile.${choice}`)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.row}>
        <Button variant="solid" onClick={() => void analyze()} disabled={blocked || phase === 'running'} aria-busy={phase === 'running' || undefined} data-cw-cotejo-run="">
          {text(sample ? 'cotejo.run.sample' : 'cotejo.run.pasted')}
        </Button>
        {!core ? <span className={styles.muted}>{text('cotejo.warming')}</span> : null}
      </div>

      <div role="status" aria-live="polite" className={styles.status} data-cw-cotejo-status={phase}>
        {phase === 'running' ? text('cotejo.running') : null}
        {phase === 'evicted' ? text('cotejo.evicted') : null}
        {phase === 'idle' && run && report
          ? text('cotejo.done', {
              ms: cotejoMs(run.ms, lang),
              roundTrip: cotejoMs(run.roundTripMs, lang),
              units: report.units,
              lines: run.lineCount,
              profile: report.profile ?? text('cotejo.profile.none'),
              lang: text(`cotejo.lang.${report.lang}`),
            })
          : null}
      </div>
      {phase === 'failed' && error ? (
        <p className={styles.error} role="alert">
          {text('cotejo.failed', { reason: error })}
        </p>
      ) : null}

      {report && run ? (
        <>
          <p className={styles.counts} data-cw-cotejo-counts="">
            {text('cotejo.counts', { errors: report.counts.error, warnings: report.counts.warning, notes: report.counts.note })}
          </p>
          {report.profile === null ? <p className={styles.muted}>{text('cotejo.noProfile')}</p> : null}
          {run.sample && score ? (
            <CotejoMetrics lang={lang} score={score} semanticOn={semanticOn} />
          ) : (
            <p className={styles.muted} data-cw-cotejo-no-truth="">
              {text('cotejo.metrics.pasted')}
            </p>
          )}

          <section className={styles.panel} aria-labelledby={`${baseId}-findings`} data-cw-cotejo-findings="">
            <h4 id={`${baseId}-findings`} className={styles.panelTitle}>
              {text('cotejo.findings.title')}
            </h4>
            {groups.length === 0 ? <p className={styles.muted}>{text('cotejo.findings.empty')}</p> : null}
            {groups.map((group) => (
              <FamilyGroup
                key={group.family}
                lang={lang}
                baseId={baseId}
                family={group.family}
                findings={group.findings}
                lines={run.lines}
                sample={Boolean(run.sample)}
                open={open}
                onToggle={(fingerprint) => setOpen((current) => (current === fingerprint ? null : fingerprint))}
              />
            ))}
          </section>

          <TracePanel lang={lang} phase={trace.phase} view={trace.view} sample={Boolean(run.sample)} disabled={phase === 'running'} onRun={() => void runTrace()} />

          <SemanticLayers
            key={runKey}
            lang={lang}
            experiment={experiment}
            client={client}
            downloads={downloads}
            specLang={report.lang}
            sample={Boolean(run.sample)}
            disabled={phase === 'running'}
            onResult={onSemantic}
          />

          <CotejoDownloads lang={lang} client={client} base={fileBase} disabled={phase === 'running'} />
        </>
      ) : null}

      <p className={styles.links}>
        <a href={COTEJO_REPO_URL} target="_blank" rel="noopener noreferrer" data-cw-cotejo-repo="">
          {text('cotejo.link.repo')}
        </a>
        <a href={COTEJO_ACTION_RUNS_URL} target="_blank" rel="noopener noreferrer" data-cw-cotejo-action="">
          {text('cotejo.link.action')}
        </a>
      </p>
    </div>
  )
}

type FamilyGroupProps = {
  lang: Locale
  baseId: string
  family: Family
  findings: Finding[]
  lines: string[]
  sample: boolean
  open: string | null
  onToggle: (fingerprint: string) => void
}

function FamilyGroup({ lang, baseId, family, findings, lines, sample, open, onToggle }: FamilyGroupProps) {
  const text = cotejoText(lang)
  return (
    <div className={styles.family} data-cw-cotejo-family={family}>
      <h5 className={styles.familyTitle}>{text('cotejo.family.count', { family: text(`cotejo.family.${family}`), count: findings.length })}</h5>
      <ul className={styles.findings}>
        {findings.map((finding) => {
          const expanded = open === finding.fingerprint
          const detailId = `${baseId}-${finding.id}`
          const defect = sample ? matchDefect(finding, COTEJO_DEFECTS) : undefined
          return (
            <li key={finding.fingerprint} className={styles.finding} data-cw-cotejo-finding={finding.id} data-rule={finding.rule} data-severity={finding.severity}>
              <button type="button" className={styles.findingButton} aria-expanded={expanded} aria-controls={expanded ? detailId : undefined} onClick={() => onToggle(finding.fingerprint)}>
                <span className={styles.severity} data-severity={finding.severity}>
                  {text(`cotejo.severity.${finding.severity}`)}
                </span>
                <span className={styles.findingId}>{finding.id}</span>
                <span className={styles.findingLines}>{linesLabel(finding)}</span>
                {defect === undefined ? null : (
                  <span className={defect ? styles.tagHit : styles.tagMiss} data-cw-cotejo-in-truth={defect ? defect.id : 'none'}>
                    <span aria-hidden="true">{defect ? '✓ ' : '✗ '}</span>
                    {defect ? text('cotejo.truth.seeded', { id: defect.id }) : text('cotejo.truth.extra')}
                  </span>
                )}
                <span className={styles.findingWhy}>{finding.why[lang]}</span>
              </button>
              {fragmentOf(finding) && !expanded ? <p className={styles.fragment}>«{fragmentOf(finding)}»</p> : null}
              {expanded ? <FindingDetail id={detailId} lang={lang} finding={finding} lines={lines} defect={defect} /> : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function CotejoStage({ lang, experiment, downloads }: LabDemoProps) {
  return <CotejoView lang={lang} experiment={experiment} downloads={downloads} />
}
