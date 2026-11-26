import type { WeekCount } from '@/lib/engineering/commits'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { dayMonth, integer } from './format'
import styles from './Engineering.module.scss'

type Props = { lang: Locale; dict: Dictionary; weeks: readonly WeekCount[]; id: string }

const WIDTH = 400
const HEIGHT = 190
const TOP = 26
const BOTTOM = 34
const SIDE = 8

export function WeeklyBars({ lang, dict, weeks, id }: Props) {
  const max = Math.max(0, ...weeks.map((week) => week.count))
  const total = weeks.reduce((sum, week) => sum + week.count, 0)
  const slot = (WIDTH - SIDE * 2) / Math.max(1, weeks.length)
  const barWidth = Math.min(36, slot * 0.6)
  const plot = HEIGHT - TOP - BOTTOM
  const title = t(dict, 'engineering.delivery.chartTitle', { total: integer(total, lang), weeks: integer(weeks.length, lang), max: integer(max, lang) })
  return (
    <figure className={styles.figure} data-cw-eng-weekly={weeks.map((week) => week.count).join(',')}>
      <svg className={styles.chart} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>{title}</title>
        <line className={styles.axis} x1={SIDE} x2={WIDTH - SIDE} y1={HEIGHT - BOTTOM} y2={HEIGHT - BOTTOM} />
        {weeks.map((week, index) => {
          const height = max === 0 ? 0 : Math.max(week.count > 0 ? 2 : 0, (week.count / max) * plot)
          const x = SIDE + slot * index + (slot - barWidth) / 2
          const y = HEIGHT - BOTTOM - height
          return (
            <g key={week.start}>
              <rect className={styles.bar} x={x} y={y} width={barWidth} height={height} rx={4} />
              <text className={styles.chartValue} x={x + barWidth / 2} y={y - 8} textAnchor="middle">
                {integer(week.count, lang)}
              </text>
              <text className={styles.chartLabel} x={x + barWidth / 2} y={HEIGHT - BOTTOM + 20} textAnchor="middle">
                {dayMonth(week.start, lang)}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className={styles.muted}>{title}</figcaption>
      <details className={styles.more}>
        <summary>{t(dict, 'engineering.delivery.table')}</summary>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="cw-visually-hidden">{title}</caption>
            <thead>
              <tr>
                <th scope="col">{t(dict, 'engineering.delivery.week')}</th>
                <th scope="col" className={styles.num}>
                  {t(dict, 'engineering.delivery.count')}
                </th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.start}>
                  <th scope="row">{t(dict, 'engineering.delivery.weekRange', { start: dayMonth(week.start, lang), end: dayMonth(week.end, lang) })}</th>
                  <td className={styles.num}>{integer(week.count, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
