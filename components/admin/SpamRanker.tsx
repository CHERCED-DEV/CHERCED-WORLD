'use client'

import { useState } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import type { Locale } from '@/content/types'
import { rankPendingComments, type AssistError } from '@/lib/actions/editorial-ai'
import type { SpamScore } from '@/lib/ai/editorial/assist'
import styles from './editorial/GeminiAssist.module.scss'

const COPY = {
  es: {
    title: 'Ordenar por probabilidad de spam',
    run: 'Calificar con Gemini',
    working: 'Calificando…',
    note: 'A Google va solo el texto de cada comentario, sin nombre ni correo. Nada se aprueba ni se rechaza solo.',
    simulated: 'Simulador local: sin la clave de Gemini, la calificación usa reglas simples.',
    open: 'Ver',
    empty: 'No hay comentarios pendientes.',
    errors: { unauthorized: 'No tienes permiso para esto.', validation: 'Algo no cuadra.', rate_limited: 'Llegaste al límite de hoy.', unavailable: 'Gemini no está disponible ahora.', failed: 'No salió bien. Prueba otra vez.' } satisfies Record<AssistError, string>,
  },
  en: {
    title: 'Sort by spam probability',
    run: 'Score with Gemini',
    working: 'Scoring…',
    note: 'Only each comment’s text goes to Google, with no name or email. Nothing is approved or rejected on its own.',
    simulated: 'Local simulator: without the Gemini key, scoring uses simple rules.',
    open: 'View',
    empty: 'There are no pending comments.',
    errors: { unauthorized: 'You don’t have permission for this.', validation: 'Something doesn’t add up.', rate_limited: 'You reached today’s limit.', unavailable: 'Gemini is not available right now.', failed: 'It didn’t work. Try again.' } satisfies Record<AssistError, string>,
  },
} as const

export function SpamRanker({ lang, excerpts }: { lang: Locale; excerpts: Record<string, string> }) {
  const copy = COPY[lang]
  const [busy, setBusy] = useState(false)
  const [scores, setScores] = useState<SpamScore[] | null>(null)
  const [simulated, setSimulated] = useState(false)
  const [error, setError] = useState<AssistError | null>(null)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const result = await rankPendingComments()
      if (!result.ok) {
        setError(result.error)
        return
      }
      setScores(result.data)
      setSimulated(result.simulated)
    } catch {
      setError('failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.assist} aria-labelledby="spam-ranker-title" data-cw-spam-ranker="">
      <h3 id="spam-ranker-title">{copy.title}</h3>
      <p className={styles.note}>{copy.note}</p>
      <div className={styles.buttons}>
        <button type="button" className={buttonClassName({ size: 'sm' })} disabled={busy} onClick={() => void run()} data-cw-spam-run="">
          {busy ? copy.working : copy.run}
        </button>
      </div>
      {error ? <p role="alert">{copy.errors[error]}</p> : null}
      {scores && simulated ? <p className={styles.note}>{copy.simulated}</p> : null}
      {scores ? (
        scores.length ? (
          <ol className={styles.findings} data-cw-spam-list="">
            {scores.map((score) => (
              <li key={score.id} data-cw-spam-score={score.spam.toFixed(2)}>
                <strong>{Math.round(score.spam * 100)} %</strong> · {excerpts[score.id] ?? score.id} — {score.why}{' '}
                <a className={styles.link} href={`#comment-${score.id}`}>
                  {copy.open}
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.note}>{copy.empty}</p>
        )
      ) : null}
    </section>
  )
}
