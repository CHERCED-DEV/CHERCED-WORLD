import '@/lib/data/mongo/register'
import { notFound } from 'next/navigation'
import styles from '@/components/admin/admin.module.scss'
import { guardPanel } from '@/components/admin/gate'
import { adminText } from '@/components/admin/labels'
import { SessionExpired } from '@/components/admin/Views'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { groupUnanswered } from '@/lib/ai/lab/traces'
import { getRepos } from '@/lib/data'
import type { LabIntent } from '@/lib/data/types'
import { isLocale, type Locale } from '@/lib/i18n'
import { logServerError } from '@/lib/security/log'

type Props = { params: Promise<{ lang: string }> }

export const dynamic = 'force-dynamic'

const COPY = {
  es: {
    title: 'Conversaciones con Mini Cherced',
    intro: 'Lo que hablan con Mini Cherced las personas que entraron con su cuenta y lo autorizaron. Se borra solo a los 90 días.',
    unanswered: 'Preguntas sin respuesta',
    unansweredIntro: 'Lo que Mini Cherced no supo responder, agrupado. Llévalo a personalidad.md o a las evals de la 032.',
    times: 'veces',
    none: 'Todavía no hay conversaciones guardadas.',
    recent: 'Recientes',
    pending: 'Resumen en preparación.',
    transcript: 'Transcripción',
    you: 'Visitante',
    agent: 'Mini Cherced',
    cost: 'Costo',
    unavailable: 'No pude leer las conversaciones ahora.',
    intents: { reclutador: 'Reclutador', lider_tecnico: 'Líder técnico', curioso: 'Curioso', otro: 'Otro' } satisfies Record<LabIntent, string>,
  },
  en: {
    title: 'Conversations with Mini Cherced',
    intro: 'What people who signed in and allowed it talk about with Mini Cherced. Deleted automatically after 90 days.',
    unanswered: 'Unanswered questions',
    unansweredIntro: 'What Mini Cherced couldn’t answer, grouped. Take it to personalidad.md or to the 032 evals.',
    times: 'times',
    none: 'No saved conversations yet.',
    recent: 'Recent',
    pending: 'Summary being prepared.',
    transcript: 'Transcript',
    you: 'Visitor',
    agent: 'Mini Cherced',
    cost: 'Cost',
    unavailable: 'I couldn’t read the conversations right now.',
    intents: { reclutador: 'Recruiter', lider_tecnico: 'Tech lead', curioso: 'Curious', otro: 'Other' } satisfies Record<LabIntent, string>,
  },
} as const

function when(value: Date, lang: Locale): string {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(value)
}

export default async function ConversationsPage({ params }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const text = await adminText(lang)
  if (!(await guardPanel(lang, 'owner'))) return <SessionExpired text={text} />
  const copy = COPY[lang]
  let records: Awaited<ReturnType<ReturnType<typeof getRepos>['lab']['listRecent']>> = []
  let failed = false
  try {
    records = await getRepos().lab.listRecent(100)
  } catch (error) {
    logServerError('panel.conversations', error)
    failed = true
  }
  const groups = groupUnanswered(records)

  return (
    <section className={styles.section} aria-labelledby="conversations-title" data-cw-conversations="">
      <h2 id="conversations-title" className={styles.sectionTitle}>
        {copy.title}
      </h2>
      <p className={styles.muted}>{failed ? copy.unavailable : copy.intro}</p>

      {groups.length ? (
        <GlassSurface as="section" variant="subtle" className={styles.item} aria-labelledby="unanswered-title">
          <h3 id="unanswered-title" className={styles.cardTitle}>
            {copy.unanswered}
          </h3>
          <p className={styles.muted}>{copy.unansweredIntro}</p>
          <ul className={styles.list} data-cw-unanswered="">
            {groups.slice(0, 30).map((group) => (
              <li key={group.question}>
                <strong>{group.count}</strong> {copy.times} · {group.question}
              </li>
            ))}
          </ul>
        </GlassSurface>
      ) : null}

      <h3 className={styles.cardTitle}>{copy.recent}</h3>
      {records.length === 0 ? (
        <p className={styles.empty}>{copy.none}</p>
      ) : (
        <ul className={styles.list}>
          {records.map((record) => (
            <li key={record.id}>
              <GlassSurface as="article" variant="subtle" className={styles.item} data-cw-conversation={record.id}>
                <p className={styles.muted}>
                  {when(record.startedAt, lang)}
                  {record.summary ? ` · ${copy.intents[record.summary.intent]}` : ''}
                  {record.summary?.topic ? ` · ${record.summary.topic}` : ''}
                  {record.interview ? ` · ${record.interview}` : ''}
                  {record.trace ? ` · ${copy.cost} ${record.trace.costUsd.toFixed(4)} USD` : ''}
                </p>
                {record.summary ? (
                  <ul>
                    {record.summary.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.muted}>{copy.pending}</p>
                )}
                <details>
                  <summary>{copy.transcript}</summary>
                  <ol>
                    {record.turns.map((turn, index) => (
                      <li key={index}>
                        <strong>{turn.who === 'you' ? copy.you : copy.agent}:</strong> {turn.text}
                      </li>
                    ))}
                  </ol>
                </details>
              </GlassSurface>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
