import type { Evidence, Finding } from 'cotejo-core'
import type { CotejoSeededDefect } from '@/content/ailab/cotejo/truth'
import type { Locale } from '@/lib/i18n/config'
import { cotejoHas, cotejoNumber, cotejoRatio, cotejoText, type CotejoCopyKey } from './copy'
import styles from './CotejoStage.module.scss'

export type FindingDetailProps = {
  id: string
  lang: Locale
  finding: Finding
  lines: readonly string[]
  defect: CotejoSeededDefect | null | undefined
}

const CONTEXT = 1

function componentLabel(lang: Locale, key: string): string {
  const copyKey = `cotejo.component.${key}`
  return cotejoHas(lang, copyKey) ? cotejoText(lang)(copyKey) : key
}

function componentValue(lang: Locale, key: string, value: number | string): string {
  if (key === 'basis' && (value === 'fact' || value === 'signal')) return cotejoText(lang)(`cotejo.component.basis.${value}`)
  if (typeof value === 'number') return cotejoNumber(value, lang, 3)
  return value
}

const NEEDLE_KEYS = ['term', 'acronym', 'marker', 'ref', 'number', 'id'] as const

export function needleOf(finding: Pick<Finding, 'components'>): string | null {
  for (const key of NEEDLE_KEYS) {
    const value = finding.components[key]
    if (typeof value === 'string' && value.trim() !== '') return value
    if (typeof value === 'number') return String(value)
  }
  return null
}

export function markRange(line: string, evidence: Evidence, needle: string | null): [number, number] | null {
  if (needle) {
    const lower = line.toLocaleLowerCase()
    const target = needle.toLocaleLowerCase()
    const near = lower.indexOf(target, Math.max(0, evidence.column - 1))
    const at = near >= 0 ? near : lower.indexOf(target)
    if (at >= 0) return [at, at + needle.length]
  }
  const fragment = evidence.fragment.trim().replace(/…$/, '')
  const at = fragment ? line.indexOf(fragment) : -1
  return at >= 0 ? [at, at + fragment.length] : null
}

function Marked({ line, evidence, needle }: { line: string; evidence: Evidence; needle: string | null }) {
  const range = markRange(line, evidence, needle)
  if (!range) return <mark className={styles.mark}>{line}</mark>
  return (
    <>
      {line.slice(0, range[0])}
      <mark className={styles.mark}>{line.slice(range[0], range[1])}</mark>
      {line.slice(range[1])}
    </>
  )
}

function Excerpt({ lang, lines, evidence, needle }: { lang: Locale; lines: readonly string[]; evidence: Evidence; needle: string | null }) {
  const text = cotejoText(lang)
  const from = Math.max(1, evidence.line - CONTEXT)
  const to = Math.min(lines.length, evidence.line + CONTEXT)
  const numbers = Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index)
  return (
    <ol className={styles.source} tabIndex={0} aria-label={text('cotejo.detail.excerpt', { line: evidence.line })}>
      {numbers.map((number) => {
        const line = lines[number - 1] ?? ''
        const target = number === evidence.line
        return (
          <li key={number} className={target ? styles.sourceTarget : undefined} data-cw-cotejo-line={number} data-marked={target ? '' : undefined}>
            <span className={styles.gutter} aria-hidden="true">
              {number}
            </span>
            {target ? (
              <span>
                <span className={styles.pointer} aria-hidden="true">
                  ▶{' '}
                </span>
                <span className={styles.srOnly}>{text('cotejo.detail.marked', { line: number })} </span>
                <Marked line={line} evidence={evidence} needle={needle} />
              </span>
            ) : (
              <span>{line || ' '}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function FindingDetail({ id, lang, finding, lines, defect }: FindingDetailProps) {
  const text = cotejoText(lang)
  const basis = finding.components.basis === 'fact' ? 'fact' : 'signal'
  const scoreKey: CotejoCopyKey = basis === 'fact' ? 'cotejo.detail.score.fact' : 'cotejo.detail.score.signal'
  const components = Object.entries(finding.components)
  const needle = needleOf(finding)
  return (
    <div id={id} className={styles.detail} data-cw-cotejo-detail={finding.id}>
      <dl className={styles.facts}>
        <div>
          <dt>{text('cotejo.detail.rule')}</dt>
          <dd>
            <code>{finding.rule}</code>
          </dd>
        </div>
        <div>
          <dt>{text('cotejo.detail.layers')}</dt>
          <dd>{finding.layers.join(' + ')}</dd>
        </div>
        <div>
          <dt>{text('cotejo.detail.severity')}</dt>
          <dd>{text(`cotejo.severity.${finding.severity}`)}</dd>
        </div>
        <div>
          <dt>{text('cotejo.detail.score')}</dt>
          <dd data-cw-cotejo-score="">{text(scoreKey, { score: cotejoRatio(finding.score, lang) })}</dd>
        </div>
      </dl>
      {components.length > 0 ? (
        <div className={styles.tableWrap} role="region" aria-label={text('cotejo.detail.components')} tabIndex={0}>
          <table className={styles.table} data-cw-cotejo-components="">
            <caption>{text('cotejo.detail.components')}</caption>
            <tbody>
              {components.map(([key, value]) => (
                <tr key={key}>
                  <th scope="row">{componentLabel(lang, key)}</th>
                  <td>{componentValue(lang, key, value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className={styles.para}>
        <strong>{text('cotejo.detail.why')}:</strong> {finding.why[lang]}
      </p>
      <p className={styles.para}>
        <strong>{text('cotejo.detail.refute')}:</strong> {finding.howToRefute[lang]}
      </p>
      <div className={styles.evidence}>
        <p className={styles.label}>{text('cotejo.detail.evidence')}</p>
        <ul className={styles.plain}>
          {finding.evidence.map((item, index) => (
            <li key={`${item.line}-${item.column}-${index}`}>
              <p className={styles.muted}>
                {text('cotejo.detail.evidenceItem', { line: item.line, column: item.column })}
                {item.unitId ? ` · ${item.unitId}` : ''}
              </p>
              <Excerpt lang={lang} lines={lines} evidence={item} needle={needle} />
            </li>
          ))}
        </ul>
      </div>
      <p className={styles.muted}>
        {text('cotejo.detail.fingerprint')}: <code>{finding.fingerprint.slice(0, 16)}</code>
      </p>
      {defect === undefined ? null : (
        <p className={defect ? styles.truthHit : styles.truthMiss} data-cw-cotejo-truth={defect ? defect.id : 'none'}>
          <span aria-hidden="true">{defect ? '✓ ' : '✗ '}</span>
          {defect ? text('cotejo.detail.truth.seeded', { id: defect.id, note: defect.note[lang] }) : text('cotejo.detail.truth.extra')}
        </p>
      )}
    </div>
  )
}
