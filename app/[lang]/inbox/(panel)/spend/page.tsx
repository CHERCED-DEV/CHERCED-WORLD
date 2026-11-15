import '@/lib/data/mongo/register'
import { notFound } from 'next/navigation'
import styles from '@/components/admin/admin.module.scss'
import { guardPanel } from '@/components/admin/gate'
import { adminText } from '@/components/admin/labels'
import { SessionExpired } from '@/components/admin/Views'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { formatUsd } from '@/lib/ai/models'
import { PRICES_CHECKED_AT, toCop, USD_TO_COP_DATE } from '@/lib/ai/pricing'
import { spendToday, type SpendLine } from '@/lib/ai/spend'
import { getRepos } from '@/lib/data'
import { isLocale, type Locale } from '@/lib/i18n'
import { logServerError } from '@/lib/security/log'

type Props = { params: Promise<{ lang: string }> }

export const dynamic = 'force-dynamic'

const COPY = {
  es: {
    title: 'Gasto en Gemini',
    intro: 'Usos de las últimas 24 horas por experimento y su costo estimado con el costo típico de cada uso. No guarda nada de los visitantes: solo los contadores de los límites.',
    experiment: 'Experimento',
    uses: 'Usos',
    unit: 'Costo típico',
    total: 'Estimado',
    since: 'Desde',
    sum: 'Total estimado',
    note: `Precios revisados el ${PRICES_CHECKED_AT}; pesos con la TRM del ${USD_TO_COP_DATE}. El saldo real está en AI Studio.`,
    unavailable: 'No pude leer los contadores ahora.',
  },
  en: {
    title: 'Gemini spend',
    intro: 'Uses in the last 24 hours per experiment and their estimated cost from each use’s typical cost. It stores nothing about visitors: only the rate-limit counters.',
    experiment: 'Experiment',
    uses: 'Uses',
    unit: 'Typical cost',
    total: 'Estimate',
    since: 'Since',
    sum: 'Estimated total',
    note: `Prices checked on ${PRICES_CHECKED_AT}; pesos at the ${USD_TO_COP_DATE} rate. The real balance lives in AI Studio.`,
    unavailable: 'I couldn’t read the counters right now.',
  },
} as const

function time(value: Date | null, lang: Locale): string {
  return value ? new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Bogota' }).format(value) : '—'
}

export default async function SpendPage({ params }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const text = await adminText(lang)
  if (!(await guardPanel(lang, 'owner'))) return <SessionExpired text={text} />
  const copy = COPY[lang]
  let lines: SpendLine[] = []
  let failed = false
  try {
    lines = await spendToday(getRepos().rateLimits)
  } catch (error) {
    logServerError('panel.spend', error)
    failed = true
  }
  const total = lines.reduce((sum, line) => sum + line.usd, 0)
  const cop = new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US', { maximumFractionDigits: 0 }).format(toCop(total))

  return (
    <section className={styles.section} aria-labelledby="spend-title" data-cw-spend="">
      <h2 id="spend-title" className={styles.sectionTitle}>
        {copy.title}
      </h2>
      <p className={styles.muted}>{failed ? copy.unavailable : copy.intro}</p>
      <GlassSurface as="div" variant="subtle" className={styles.item}>
        <table>
          <thead>
            <tr>
              <th scope="col">{copy.experiment}</th>
              <th scope="col">{copy.uses}</th>
              <th scope="col">{copy.unit}</th>
              <th scope="col">{copy.total}</th>
              <th scope="col">{copy.since}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} data-cw-spend-line={line.id}>
                <td>{line.label[lang]}</td>
                <td>{line.uses}</td>
                <td>{line.unitUsd === null ? '—' : `${formatUsd(line.unitUsd, lang)} USD`}</td>
                <td>{formatUsd(line.usd, lang)} USD</td>
                <td>{time(line.since, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          <strong>{copy.sum}:</strong> {formatUsd(total, lang)} USD · {cop} COP
        </p>
        <p className={styles.muted}>{copy.note}</p>
      </GlassSurface>
    </section>
  )
}
