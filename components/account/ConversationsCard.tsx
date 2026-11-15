'use client'

import { buttonClassName } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { DashboardConversation } from '@/lib/accounts/dashboard'
import { deleteLabSession, revokeLabConsent } from '@/lib/actions/lab'
import type { Locale } from '@/lib/i18n'
import styles from './Dashboard.module.scss'
import { useRunner } from './useRunner'

const COPY = {
  es: {
    title: 'Mis conversaciones con Mini Cherced',
    none: 'Todavía no hay conversaciones guardadas. Se guardan solo si lo autorizas al empezar una conversación.',
    off: 'No has autorizado guardar tus conversaciones. Puedes hacerlo la próxima vez que hables con Mini Cherced.',
    retention: 'Se guardan en texto, nunca tu voz, y se borran solas a los 90 días.',
    interview: 'Entrevista',
    minutes: 'min',
    summary: 'Resumen',
    pending: 'El resumen se está preparando.',
    transcript: 'Transcripción',
    you: 'Tú',
    agent: 'Mini Cherced',
    delete: 'Borrar esta',
    revoke: 'Borrar todo y retirar la autorización',
  },
  en: {
    title: 'My conversations with Mini Cherced',
    none: 'No saved conversations yet. They are only saved if you allow it when you start a conversation.',
    off: 'You haven’t allowed saving your conversations. You can do it the next time you talk to Mini Cherced.',
    retention: 'They are stored as text, never your voice, and are deleted automatically after 90 days.',
    interview: 'Interview',
    minutes: 'min',
    summary: 'Summary',
    pending: 'The summary is being prepared.',
    transcript: 'Transcript',
    you: 'You',
    agent: 'Mini Cherced',
    delete: 'Delete this one',
    revoke: 'Delete everything and withdraw consent',
  },
} as const

function Delete({ id, label }: { id: string; label: string }) {
  const runner = useRunner()
  return (
    <button type="button" className={buttonClassName({ variant: 'ghost', size: 'sm' })} onClick={() => runner.run(() => deleteLabSession(id))} disabled={runner.pending}>
      {label}
    </button>
  )
}

function Revoke({ label }: { label: string }) {
  const runner = useRunner()
  return (
    <button type="button" className={buttonClassName({ variant: 'ghost', size: 'sm' })} onClick={() => runner.run(() => revokeLabConsent())} disabled={runner.pending}>
      {label}
    </button>
  )
}

export function ConversationsCard({ lang, consent, conversations }: { lang: Locale; consent: boolean; conversations: readonly DashboardConversation[] }) {
  const copy = COPY[lang]
  return (
    <GlassSurface as="section" variant="standard" className={styles.card} aria-labelledby="cw-account-conversations" data-cw-account-conversations="">
      <h2 id="cw-account-conversations" className={styles.cardTitle}>
        {copy.title}
      </h2>
      <p className={styles.muted}>{consent ? copy.retention : copy.off}</p>
      {conversations.length === 0 ? (
        consent ? <p>{copy.none}</p> : null
      ) : (
        <ul className={styles.conversations}>
          {conversations.map((item) => (
            <li key={item.id} data-cw-account-conversation={item.id}>
              <p className={styles.conversationHead}>
                <time dateTime={item.dateTime}>{item.date}</time> · {item.minutes} {copy.minutes}
                {item.interview ? ` · ${copy.interview}` : ''}
                {item.topic ? ` · ${item.topic}` : ''}
              </p>
              {item.points.length ? (
                <ul className={styles.points} aria-label={copy.summary}>
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>{copy.pending}</p>
              )}
              <details>
                <summary>{copy.transcript}</summary>
                <ol className={styles.transcript}>
                  {item.turns.map((turn, index) => (
                    <li key={index}>
                      <strong>{turn.who === 'you' ? copy.you : copy.agent}:</strong> {turn.text}
                    </li>
                  ))}
                </ol>
              </details>
              <Delete id={item.id} label={copy.delete} />
            </li>
          ))}
        </ul>
      )}
      {consent ? <Revoke label={copy.revoke} /> : null}
    </GlassSurface>
  )
}
