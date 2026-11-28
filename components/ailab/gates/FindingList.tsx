'use client'

import { rubricEntry } from '@/content/ailab/gates/rubric'
import type { GateRun, MergedFinding } from '@/lib/ai/gates/schema'
import type { Locale } from '@/lib/i18n/config'
import { gatesList, gatesNumber, gatesText, type GatesCopyKey } from './copy'
import styles from './GatesStage.module.scss'

const GRAVITY_MARK = { bloqueante: '■', importante: '▲', menor: '●' } as const

export function providerName(lang: Locale, provider: string | null): string {
  const text = gatesText(lang)
  return provider ? text(`gates.provider.${provider}` as GatesCopyKey) : text('gates.provider.none')
}

function reportersText(lang: Locale, item: MergedFinding, simulated: boolean): string {
  const text = gatesText(lang)
  if (item.origin === 'determinista') return text('gates.finding.deterministic', { rules: item.rules.join(', ') })
  const names = [...new Set(item.reporters.map((reporter) => (simulated ? reporter.seat : reporter.provider)))].map((provider) => providerName(lang, provider))
  const base = text('gates.finding.reporters', { names: gatesList(names, lang) })
  return item.seenByBoth ? `${base} · ${text('gates.finding.both')}` : base
}

export type FindingListProps = { lang: Locale; run: GateRun; findings: readonly MergedFinding[]; round: number }

export function FindingList({ lang, run, findings, round }: FindingListProps) {
  const text = gatesText(lang)
  if (!findings.length) return <p className={styles.muted}>{text('gates.findings.none')}</p>
  return (
    <ul className={styles.findings} aria-label={text('gates.findings.title', { n: round })}>
      {findings.map((item) => {
        const struck = item.verification?.result === 'se-cae'
        const verifier = item.verification ? providerName(lang, run.simulated ? item.verification.seat : (item.verification.provider ?? item.verification.seat)) : null
        return (
          <li key={item.id} className={styles.finding} data-gravity={item.gravity} data-struck={struck ? '' : undefined} data-cw-gates-finding={`${round}-${item.id}`}>
            <details>
              <summary>
                <span className={styles.gravity} data-gravity={item.gravity}>
                  <span aria-hidden="true">{GRAVITY_MARK[item.gravity]} </span>
                  {text(`gates.gravity.${item.gravity}` as GatesCopyKey)}
                </span>
                <span className={styles.findingTitle}>
                  {item.id} · {rubricEntry(item.criterion).name[lang]} · {text('gates.finding.where', { where: item.where })}
                </span>
                {struck ? <span className={styles.struckTag}>{text('gates.verify.knockedShort')}</span> : null}
              </summary>
              <div className={styles.findingBody}>
                <p className={styles.findingText}>{struck ? <s>{item.problem}</s> : item.problem}</p>
                <p className={styles.muted}>
                  <strong>{text('gates.finding.fix')}:</strong> {item.fix}
                </p>
                <p className={styles.muted}>
                  {reportersText(lang, item, run.simulated)}
                  {item.origin === 'revisor' ? ` · ${text('gates.finding.confidence', { value: gatesNumber(item.confidence, lang, 2) })}` : ''}
                </p>
                {item.carried ? <p className={styles.muted}>{text('gates.finding.carried')}</p> : null}
                {item.verification ? (
                  <p className={styles.verification} data-result={item.verification.result} data-cw-gates-verdict={item.verification.result}>
                    <strong>
                      {text(`gates.verify.${item.verification.result}` as GatesCopyKey)} · {text('gates.verify.by', { name: verifier ?? text('gates.provider.none') })}:
                    </strong>{' '}
                    {item.verification.reason}
                  </p>
                ) : null}
                {struck ? <p className={styles.muted}>{text('gates.verify.knocked')}</p> : null}
              </div>
            </details>
          </li>
        )
      })}
    </ul>
  )
}
