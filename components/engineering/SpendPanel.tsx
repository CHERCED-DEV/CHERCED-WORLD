'use client'

import { useEffect, useState } from 'react'
import type { EngineeringSpend } from '@/lib/engineering/spend'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { dateTime, integer, usd } from './format'
import styles from './Engineering.module.scss'

type Available = Extract<EngineeringSpend, { available: true }>

type Props = { lang: Locale; dict: Dictionary; endpoint: string }

type State = { status: 'idle' } | { status: 'ready'; spend: Available } | { status: 'error' }

function available(value: unknown): value is Available {
  if (!value || typeof value !== 'object') return false
  const body = value as Record<string, unknown>
  const mcp = body.mcp as Record<string, unknown> | null | undefined
  const rate = body.copRate as Record<string, unknown> | null | undefined
  return (
    body.available === true &&
    typeof body.takenAt === 'string' &&
    typeof body.targetUsd === 'number' &&
    typeof mcp?.calls === 'number' &&
    typeof rate?.value === 'number' &&
    typeof rate.date === 'string'
  )
}

function Ready({ lang, dict, spend }: { lang: Locale; dict: Dictionary; spend: Available }) {
  const rate = spend.copRate.value
  const cop = (value: number) => integer(value * rate, lang)
  return (
    <>
      {spend.month ? (
        <>
          <p className={styles.headline} data-cw-eng-spend-month={spend.month.month}>
            {t(dict, 'engineering.spend.month', { month: spend.month.month, usd: usd(spend.month.usd, lang), cop: cop(spend.month.usd) })}
          </p>
          {spend.month.usd > spend.targetUsd ? <p className={styles.warn}>{t(dict, 'engineering.spend.overTarget')}</p> : null}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t(dict, 'engineering.spend.provider')}</th>
                  <th scope="col" className={styles.num}>
                    USD
                  </th>
                </tr>
              </thead>
              <tbody>
                {spend.month.byProvider.map((row) => (
                  <tr key={row.provider}>
                    <th scope="row">{row.provider}</th>
                    <td className={styles.num}>{usd(row.usd, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      {spend.today ? (
        <>
          <p className={styles.headline} data-cw-eng-spend-today={spend.today.usd}>
            {t(dict, 'engineering.spend.today', { usd: usd(spend.today.usd, lang), cop: cop(spend.today.usd) })}
          </p>
          <p className={styles.muted}>{t(dict, 'engineering.spend.todayNote')}</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t(dict, 'engineering.spend.experiment')}</th>
                  <th scope="col" className={styles.num}>
                    {t(dict, 'engineering.spend.uses')}
                  </th>
                  <th scope="col" className={styles.num}>
                    {t(dict, 'engineering.spend.estimate')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {spend.today.lines.map((line) => (
                  <tr key={line.id}>
                    <th scope="row">{line.label[lang]}</th>
                    <td className={styles.num}>{integer(line.uses, lang)}</td>
                    <td className={styles.num}>{usd(line.usd, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      <p className={styles.headline} data-cw-eng-mcp={spend.mcp.calls}>
        {t(dict, 'engineering.spend.mcp', { count: integer(spend.mcp.calls, lang) })}
      </p>
      <p className={styles.muted}>{t(dict, 'engineering.spend.mcpNote')}</p>
      <p className={styles.muted}>
        {t(dict, 'engineering.spend.takenAt', { date: dateTime(spend.takenAt, lang), rateDate: spend.copRate.date, rate: integer(rate, lang) })}
      </p>
    </>
  )
}

export function SpendPanel({ lang, dict, endpoint }: Props) {
  const [state, setState] = useState<State>({ status: 'idle' })

  useEffect(() => {
    const controller = new AbortController()
    fetch(endpoint, { headers: { accept: 'application/json' }, signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        if (!controller.signal.aborted) setState(available(body) ? { status: 'ready', spend: body } : { status: 'error' })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      })
    return () => controller.abort()
  }, [endpoint])

  return (
    <>
      <p className={styles.muted}>{t(dict, 'engineering.spend.live')}</p>
      <p className={styles.noJs} data-cw-eng-nojs="">
        {t(dict, 'engineering.spend.noscript')}
      </p>
      <div className={styles.details} aria-live="polite" data-cw-eng-spend={state.status}>
        {state.status === 'ready' ? (
          <Ready lang={lang} dict={dict} spend={state.spend} />
        ) : state.status === 'error' ? (
          <p className={styles.warn}>{t(dict, 'engineering.spend.unavailable')}</p>
        ) : null}
      </div>
      <p className={styles.source}>
        <strong>{t(dict, 'engineering.source')}:</strong>{' '}
        <a className={styles.link} href={endpoint}>
          {t(dict, 'engineering.spend.json')}
        </a>{' '}
        <code>GET {endpoint}</code>
      </p>
    </>
  )
}
