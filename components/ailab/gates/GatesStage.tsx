'use client'

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { ProviderBadge } from '@/components/ai/providers/ProviderBadge'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import { GATE_EXAMPLES, type GateExampleId } from '@/content/ailab/gates/examples'
import { loadRecorded } from '@/content/ailab/gates/recorded'
import { specToMarkdown } from '@/lib/ai/gates/markdown'
import { COMMENT_MAX, type DecisionKind, type GateDecision, type GateRun, type GateStep } from '@/lib/ai/gates/schema'
import { REPLAY_STEP_MS, roundVisible } from '@/lib/ai/gates/view'
import type { Locale } from '@/lib/i18n/config'
import { gatesDate, gatesList, gatesNumber, gatesText, type GatesCopyKey } from './copy'
import { FindingList, providerName } from './FindingList'
import styles from './GatesStage.module.scss'
import { GatesTotal, GatesTrace, stepCost } from './GatesTrace'

export type GatesRequestChanges = (run: GateRun, comment: string) => Promise<{ run: GateRun } | { error: string }>

function stepDetail(lang: Locale, step: GateStep): string {
  const text = gatesText(lang)
  if (step.status === 'error') return text('gates.step.failed')
  if (step.kind === 'chequear') return step.count ? text('gates.step.detail.chequear', { count: step.count, ids: step.ids.join(', ') }) : text('gates.step.detail.chequearOk')
  if (step.kind === 'verificar') return text('gates.step.detail.verificar', { count: step.count, ids: step.ids.join(', ') })
  return text(`gates.step.detail.${step.kind}` as GatesCopyKey, { count: step.count })
}

function StepBadge({ lang, run, step }: { lang: Locale; run: GateRun; step: GateStep }) {
  const text = gatesText(lang)
  if (step.provider === 'deterministic') return <span className={styles.deterministic}>{text('gates.provider.deterministic')}</span>
  if (step.provider === 'simulator' && step.seat) {
    return (
      <span className={styles.badges}>
        <ProviderBadge provider="simulator" label={text('gates.provider.simulator')} />
        <span className={styles.muted}>{text('gates.seat.as', { seat: providerName(lang, step.seat) })}</span>
      </span>
    )
  }
  const provider = step.provider === 'simulator' ? 'simulator' : step.provider
  const fallback = step.seat && step.seat !== step.provider && step.provider !== 'simulator' ? text('gates.seat.fallback', { seat: providerName(lang, step.seat) }) : null
  return (
    <span className={styles.badges}>
      <ProviderBadge provider={provider} label={providerName(lang, provider)} detail={run.simulated ? undefined : text(`gates.provider.company.${provider}` as GatesCopyKey)} />
      {fallback ? <span className={styles.muted}>{fallback}</span> : null}
    </span>
  )
}

export type StepListProps = { lang: Locale; run: GateRun; shown: number; pending: boolean; decided: boolean }

export function StepList({ lang, run, shown, pending, decided }: StepListProps) {
  const text = gatesText(lang)
  const done = shown >= run.steps.length && !pending
  const finalState = (ready: boolean) => (ready ? 'done' : 'pending')
  return (
    <ol className={styles.steps} aria-label={text('gates.steps.label')} data-cw-gates-steps="">
      {run.steps.map((step, index) => {
        const state = index < shown ? 'done' : index === shown ? 'current' : 'pending'
        return (
          <li key={index} className={styles.step} data-state={state} data-kind={step.kind} data-status={step.status} data-cw-gates-step={index}>
            <div className={styles.stepHead}>
              <span className={styles.stepTitle}>
                {text('gates.step.round', { n: step.round })} · {text(`gates.step.kind.${step.kind}` as GatesCopyKey)}
              </span>
              <span className={styles.stepState}>{text(`gates.step.status.${state}` as GatesCopyKey)}</span>
            </div>
            {state === 'done' ? (
              <>
                <StepBadge lang={lang} run={run} step={step} />
                <p className={step.status === 'error' ? styles.error : styles.muted}>{stepDetail(lang, step)}</p>
                <p className={styles.metrics}>
                  {step.model ?? text('gates.metrics.empty')} · {text('gates.metrics.tokensShort', { input: gatesNumber(step.inputTokens, lang), output: gatesNumber(step.outputTokens, lang) })} ·{' '}
                  {text('gates.metrics.ms', { ms: gatesNumber(step.latencyMs, lang, step.latencyMs < 10 ? 2 : 0) })} · {stepCost(lang, step, run.copRate.value)}
                </p>
                <GatesTrace lang={lang} run={run} step={step} index={index} />
              </>
            ) : null}
          </li>
        )
      })}
      {pending ? (
        <li className={styles.step} data-state="current">
          <span className={styles.stepTitle}>{text('gates.step.streaming')}</span>
        </li>
      ) : null}
      <li className={styles.step} data-state={finalState(done)} data-kind="recomendar">
        <div className={styles.stepHead}>
          <span className={styles.stepTitle}>{text('gates.step.kind.recomendar')}</span>
          <span className={styles.stepState}>{text(`gates.step.status.${finalState(done)}` as GatesCopyKey)}</span>
        </div>
      </li>
      <li className={styles.step} data-state={finalState(done && decided)} data-kind="decidir">
        <div className={styles.stepHead}>
          <span className={styles.stepTitle}>{text('gates.step.kind.decidir')}</span>
          <span className={styles.stepState}>{text(`gates.step.status.${done && decided ? 'done' : done ? 'current' : 'pending'}` as GatesCopyKey)}</span>
        </div>
      </li>
    </ol>
  )
}

export function RoundView({ lang, run, index }: { lang: Locale; run: GateRun; index: number }) {
  const text = gatesText(lang)
  const round = run.rounds[index]!
  const reviewers = round.reviewers.map((seat) => providerName(lang, seat))
  return (
    <section className={styles.round} aria-labelledby={`gates-round-${round.round}`} data-cw-gates-round={round.round}>
      <h5 id={`gates-round-${round.round}`} className={styles.subtitle}>
        {text('gates.round.title', { n: round.round })}
      </h5>
      {round.comment ? <p className={styles.note}>{text('gates.round.comment', { comment: round.comment })}</p> : null}
      {round.changed ? <p className={styles.muted}>{round.changed.length ? text('gates.round.changed', { places: round.changed.join(', ') }) : text('gates.round.nothingChanged')}</p> : null}
      {round.draft ? (
        <details className={styles.specBox}>
          <summary>{text('gates.round.draft')}</summary>
          <pre className={styles.pre} tabIndex={0}>
            {specToMarkdown(round.draft, run.request.lang)}
          </pre>
        </details>
      ) : null}
      <details className={styles.specBox} data-cw-gates-spec={round.round}>
        <summary>{text('gates.round.spec', { n: round.round })}</summary>
        <pre className={styles.pre} tabIndex={0}>
          {specToMarkdown(round.spec, run.request.lang)}
        </pre>
      </details>
      <p className={styles.muted}>{round.reviewed ? text('gates.round.reviewers', { names: reviewers.length ? gatesList(reviewers, lang) : text('gates.provider.none') }) : text('gates.round.notReviewed')}</p>
      <p className={styles.label}>{text('gates.findings.title', { n: round.round })}</p>
      <FindingList lang={lang} run={run} findings={round.findings} round={round.round} />
    </section>
  )
}

function noteText(lang: Locale, run: GateRun, note: GateRun['notes'][number]): string {
  const text = gatesText(lang)
  const seat = note.seat ? providerName(lang, note.seat) : ''
  return text(`gates.note.${note.kind}` as GatesCopyKey, { seat, where: note.where ?? '', detail: note.detail ?? '', round: note.round, simulated: run.simulated ? text('gates.provider.simulator') : '' })
}

export function RunNotes({ lang, run }: { lang: Locale; run: GateRun }) {
  const text = gatesText(lang)
  if (!run.notes.length) return null
  return (
    <details className={styles.specBox} data-cw-gates-notes="">
      <summary>{text('gates.notes.title', { count: run.notes.length })}</summary>
      <ul className={styles.notes}>
        {run.notes.map((note, index) => (
          <li key={index}>
            {text('gates.step.round', { n: note.round })}: {noteText(lang, run, note)}
          </li>
        ))}
      </ul>
    </details>
  )
}

export function Recommendation({ lang, run }: { lang: Locale; run: GateRun }) {
  const text = gatesText(lang)
  return (
    <section className={styles.recommendation} data-recommendation={run.recommendation} aria-labelledby="gates-recommendation" data-cw-gates-recommendation={run.recommendation}>
      <h5 id="gates-recommendation" className={styles.subtitle}>
        {text('gates.recommendation.title')}
      </h5>
      <p className={styles.verdict}>
        <span aria-hidden="true">{run.recommendation === 'lista' ? '✓ ' : run.recommendation === 'con-reservas' ? '△ ' : '✕ '}</span>
        {text(`gates.recommendation.${run.recommendation}` as GatesCopyKey)}
      </p>
      <p className={styles.muted} data-cw-gates-stop={run.stop}>
        {text(`gates.stop.${run.stop}` as GatesCopyKey)}
      </p>
      <p className={styles.muted}>{text('gates.recommendation.note')}</p>
    </section>
  )
}

type DecisionProps = { lang: Locale; run: GateRun; decision: GateDecision | null; onDecide: (decision: GateDecision) => void; requestChanges: GatesRequestChanges | null; onRun: (run: GateRun) => void }

export function DecisionBox({ lang, run, decision, onDecide, requestChanges, onRun }: DecisionProps) {
  const text = gatesText(lang)
  const id = useId()
  const [commenting, setCommenting] = useState(false)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const trimmed = comment.trim()

  const decide = (kind: DecisionKind, note: string | null = null) => {
    onDecide({ decision: kind, comment: note, at: new Date().toISOString() })
  }

  const send = async () => {
    if (!trimmed) return
    if (!requestChanges) {
      decide('pedir-cambios', trimmed)
      setNotice(text('gates.decide.recorded'))
      setCommenting(false)
      return
    }
    setBusy(true)
    setNotice(null)
    const result = await requestChanges(run, trimmed)
    setBusy(false)
    if ('run' in result) {
      setCommenting(false)
      setComment('')
      onRun(result.run)
      return
    }
    setNotice(text(`gates.live.error.${result.error}` as GatesCopyKey))
  }

  return (
    <section className={styles.decision} aria-labelledby={`${id}-title`} data-cw-gates-decision={decision?.decision ?? 'pendiente'}>
      <h5 id={`${id}-title`} className={styles.subtitle}>
        {text('gates.decide.title')}
      </h5>
      <p className={styles.muted}>{text('gates.decide.intro')}</p>
      <div className={styles.row} role="group" aria-label={text('gates.decide.title')}>
        <Button variant="solid" size="sm" onClick={() => decide('aprobar')} aria-pressed={decision?.decision === 'aprobar'} disabled={busy} data-cw-gates-decide="aprobar">
          {text('gates.decide.approve')}
        </Button>
        <Button variant="glass" size="sm" onClick={() => setCommenting(true)} aria-expanded={commenting} aria-controls={`${id}-changes`} disabled={busy} data-cw-gates-decide="pedir-cambios">
          {text('gates.decide.changes')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => decide('rechazar')} aria-pressed={decision?.decision === 'rechazar'} disabled={busy} data-cw-gates-decide="rechazar">
          {text('gates.decide.reject')}
        </Button>
      </div>
      {commenting ? (
        <form
          id={`${id}-changes`}
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault()
            void send()
          }}
        >
          <label htmlFor={`${id}-comment`} className={styles.label}>
            {text('gates.decide.comment.label', { max: COMMENT_MAX })}
          </label>
          <textarea
            id={`${id}-comment`}
            className={styles.textarea}
            value={comment}
            maxLength={COMMENT_MAX}
            rows={3}
            onChange={(event) => setComment(event.target.value)}
            aria-describedby={`${id}-count`}
            disabled={busy}
            data-cw-gates-comment=""
          />
          <p id={`${id}-count`} className={styles.hint}>
            {text('gates.decide.comment.count', { count: gatesNumber(comment.length, lang), max: COMMENT_MAX })}
          </p>
          <div className={styles.row}>
            <Button type="submit" variant="solid" size="sm" disabled={!trimmed || busy} data-cw-gates-send="">
              {requestChanges ? text('gates.decide.send') : text('gates.decide.sendRecorded')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCommenting(false)} disabled={busy}>
              {text('gates.decide.cancel')}
            </Button>
          </div>
        </form>
      ) : null}
      <p className={styles.status} role="status" aria-live="polite">
        {busy ? text('gates.decide.running') : ''}
      </p>
      {notice ? (
        <p className={styles.note} data-cw-gates-notice="">
          {notice}
        </p>
      ) : null}
      {decision ? (
        <p className={styles.done} data-cw-gates-decided={decision.decision}>
          {text('gates.decide.done', { decision: text(`gates.decision.${decision.decision}` as GatesCopyKey), date: gatesDate(decision.at, lang) })}
          {decision.comment ? ` ${text('gates.decide.withComment', { comment: decision.comment })}` : ''}
        </p>
      ) : null}
    </section>
  )
}

export type RunViewProps = {
  lang: Locale
  run: GateRun
  shown: number
  pending: boolean
  decision: GateDecision | null
  onDecide: (decision: GateDecision) => void
  requestChanges: GatesRequestChanges | null
  onRun: (run: GateRun) => void
  extra?: ReactNode
}

export function RunView({ lang, run, shown, pending, decision, onDecide, requestChanges, onRun, extra }: RunViewProps) {
  const done = shown >= run.steps.length && !pending
  const text = gatesText(lang)
  const anyRound = done || run.rounds.some((round) => roundVisible(run, round.round, shown))
  return (
    <div className={styles.run} data-cw-gates-run={run.mode} data-simulated={run.simulated ? '' : undefined}>
      <StepList lang={lang} run={run} shown={shown} pending={pending} decided={Boolean(decision)} />
      {anyRound ? (
        <p className={styles.muted} data-cw-gates-merge-rule="">
          {text('gates.findings.rule')}
        </p>
      ) : null}
      {run.rounds.map((round, index) => (roundVisible(run, round.round, shown) || done ? <RoundView key={round.round} lang={lang} run={run} index={index} /> : null))}
      {done ? (
        <>
          <RunNotes lang={lang} run={run} />
          <GatesTotal lang={lang} run={run} />
          <Recommendation lang={lang} run={run} />
          <DecisionBox lang={lang} run={run} decision={decision} onDecide={onDecide} requestChanges={requestChanges} onRun={onRun} />
          {extra}
        </>
      ) : null}
    </div>
  )
}

function announcement(lang: Locale, run: GateRun, shown: number): string {
  const text = gatesText(lang)
  if (!shown) return ''
  if (shown >= run.steps.length) return text('gates.announce.done', { recommendation: text(`gates.recommendation.${run.recommendation}` as GatesCopyKey) })
  const step = run.steps[shown - 1]!
  const provider = step.provider === 'deterministic' ? text('gates.provider.deterministic') : providerName(lang, step.provider === 'simulator' && step.seat ? step.seat : step.provider)
  return text('gates.announce.step', { n: shown, total: run.steps.length, kind: text(`gates.step.kind.${step.kind}` as GatesCopyKey), round: step.round, provider, detail: stepDetail(lang, step) })
}

export function GatesView({ lang }: { lang: Locale }) {
  const text = gatesText(lang)
  const groupId = useId()
  const [exampleId, setExampleId] = useState<GateExampleId>(GATE_EXAMPLES[0]!.id)
  const [loaded, setLoaded] = useState<{ key: string; run: GateRun } | null>(null)
  const [failed, setFailed] = useState(false)
  const [shown, setShown] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [decision, setDecision] = useState<GateDecision | null>(null)
  const key = `${exampleId}-${lang}`
  const run = loaded?.key === key ? loaded.run : null
  const example = useMemo(() => GATE_EXAMPLES.find((item) => item.id === exampleId)!, [exampleId])
  const statusRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    let alive = true
    loadRecorded(exampleId, lang)
      .then((next) => {
        if (alive) setLoaded({ key: `${exampleId}-${lang}`, run: next })
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [exampleId, lang])

  const total = run?.steps.length ?? 0
  const running = playing && shown < total

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => {
      setShown((value) => Math.min(value + 1, total))
      if (shown + 1 >= total) setPlaying(false)
    }, REPLAY_STEP_MS)
    return () => window.clearTimeout(timer)
  }, [running, shown, total])

  const choose = (id: GateExampleId) => {
    setExampleId(id)
    setShown(0)
    setPlaying(false)
    setDecision(null)
  }

  return (
    <div className={styles.stage} data-cw-gates="">
      <p className={styles.note}>{text('gates.intro')}</p>
      <fieldset className={styles.examples}>
        <legend className={styles.label}>{text('gates.example.label')}</legend>
        {GATE_EXAMPLES.map((item) => (
          <label key={item.id} className={styles.example}>
            <input type="radio" name={`${groupId}-example`} value={item.id} checked={item.id === exampleId} onChange={() => choose(item.id)} data-cw-gates-example={item.id} />
            <span>{item.title[lang]}</span>
          </label>
        ))}
      </fieldset>
      <figure className={styles.request}>
        <figcaption className={styles.label}>{text('gates.request.label')}</figcaption>
        <blockquote className={styles.quote}>{example.text[lang]}</blockquote>
      </figure>
      {failed ? <p className={styles.error}>{text('gates.run.failed')}</p> : null}
      {run ? (
        <>
          <p className={styles.date} data-cw-gates-recorded={run.simulated ? 'simulada' : 'real'}>
            {run.simulated ? text('gates.run.simulated') : text('gates.run.real', { date: gatesDate(run.at, lang) })}
          </p>
          <div className={styles.row}>
            <Button
              variant="solid"
              size="sm"
              onClick={() => {
                if (shown >= run.steps.length) setShown(0)
                setPlaying(true)
                setDecision(null)
              }}
              disabled={running}
              data-cw-gates-play=""
            >
              {shown ? text('gates.replay.again') : text('gates.replay.play')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPlaying(false)
                setShown(run.steps.length)
                statusRef.current?.focus()
              }}
              disabled={shown >= run.steps.length}
              data-cw-gates-all=""
            >
              {text('gates.replay.all')}
            </Button>
          </div>
          <p ref={statusRef} className={styles.status} role="status" aria-live="polite" tabIndex={-1} data-cw-gates-status="">
            {announcement(lang, run, shown)}
          </p>
          <RunView lang={lang} run={run} shown={shown} pending={false} decision={decision} onDecide={setDecision} requestChanges={null} onRun={() => {}} />
        </>
      ) : failed ? null : (
        <p className={styles.muted} role="status">
          {text('gates.run.loading')}
        </p>
      )}
    </div>
  )
}

export default function GatesStage({ lang }: LabDemoProps) {
  return <GatesView lang={lang} />
}
