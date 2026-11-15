'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { AdrCards } from '@/components/ui/AdrCards'
import { Button } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CODE_PIECES, codeBlobUrl, codePiece } from '@/content/ailab/code-tour'
import type { Locale } from '@/lib/i18n/config'
import styles from './CodeTour.module.scss'

type Explanation = {
  summary: string
  sections: Array<{ from: number; to: number; title: string; explanation: string }>
  decisions: Array<{ decision: string; why: string; tradeoff: string }>
  questions: string[]
  answer: string | null
  simulated: boolean
}

type Loaded = { file: { path: string; lines: string[]; truncated: boolean; url: string }; explanation: Explanation }

const COPY = {
  es: {
    back: 'Volver al AI Lab',
    title: 'Recorrido por el código',
    intro: 'Elige una pieza real de este sitio. Gemini lee el archivo público de GitHub y explica qué hace, por qué está escrito así y qué decisión refleja, con enlaces a las líneas exactas.',
    privacy: 'Solo se envía código público: nada tuyo va a Google, salvo la pregunta que escribas.',
    loading: 'Leyendo el archivo…',
    ask: 'Pregúntale algo de este archivo',
    placeholder: '¿Por qué no usaste…?',
    send: 'Preguntar',
    answer: 'Respuesta',
    decisions: 'Decisiones que refleja',
    questions: 'Preguntas que haría un entrevistador',
    lines: 'Líneas',
    github: 'Ver en GitHub',
    truncated: 'El archivo es largo: se muestran las primeras 1.500 líneas.',
    error: 'No pude leer o explicar ese archivo ahora. Prueba otra vez en un rato.',
    adr: { decision: 'Decisión', why: 'Por qué', tradeoff: 'Qué se sacrifica' },
  },
  en: {
    back: 'Back to the AI Lab',
    title: 'A walk through the code',
    intro: 'Pick a real piece of this site. Gemini reads the public file from GitHub and explains what it does, why it’s written that way and which decision it reflects, with links to the exact lines.',
    privacy: 'Only public code is sent: nothing of yours goes to Google, except the question you type.',
    loading: 'Reading the file…',
    ask: 'Ask something about this file',
    placeholder: 'Why didn’t you use…?',
    send: 'Ask',
    answer: 'Answer',
    decisions: 'Decisions it reflects',
    questions: 'Questions an interviewer would ask',
    lines: 'Lines',
    github: 'See on GitHub',
    truncated: 'The file is long: the first 1,500 lines are shown.',
    error: 'I couldn’t read or explain that file right now. Try again in a while.',
    adr: { decision: 'Decision', why: 'Why', tradeoff: 'What it costs' },
  },
} as const

export function CodeTour({ lang }: { lang: Locale }) {
  const copy = COPY[lang]
  const [selected, setSelected] = useState<string | null>(null)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const [question, setQuestion] = useState('')
  const [active, setActive] = useState<number | null>(null)

  const load = async (id: string, ask?: string) => {
    setPending(true)
    setFailed(false)
    try {
      const response = await fetch('/api/ailab/code', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, lang, question: ask }) })
      const body = (await response.json()) as Loaded | { error: string }
      if (!response.ok || 'error' in body) throw new Error('failed')
      setLoaded(body)
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  const pick = (id: string) => {
    setSelected(id)
    setLoaded(null)
    setActive(null)
    void load(id)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selected && question.trim()) void load(selected, question.trim())
  }

  const piece = selected ? codePiece(selected) : undefined
  const section = active !== null ? loaded?.explanation.sections[active] : undefined

  return (
    <div className={styles.tour} data-cw-code-tour="">
      <header className={styles.header}>
        <Link href={`/${lang}/ai-lab`} className={styles.back}>
          ← {copy.back}
        </Link>
        <h1 className={styles.h1}>{copy.title}</h1>
        <p>{copy.intro}</p>
        <p className={styles.muted}>{copy.privacy}</p>
      </header>

      <ul className={styles.pieces}>
        {CODE_PIECES.map((item) => (
          <li key={item.id}>
            <button type="button" className={styles.piece} aria-pressed={selected === item.id} onClick={() => pick(item.id)} data-cw-code-piece={item.id}>
              <strong>{item.title[lang]}</strong>
              <span>{item.hint[lang]}</span>
              <code>{item.path}</code>
            </button>
          </li>
        ))}
      </ul>

      {pending ? <p role="status">{copy.loading}</p> : null}
      {failed ? <p role="alert">{copy.error}</p> : null}

      {loaded && piece ? (
        <div className={styles.split} data-cw-code-loaded={piece.id}>
          <GlassSurface as="section" className={styles.panel} aria-label={copy.title}>
            <p>{loaded.explanation.summary}</p>
            {loaded.explanation.answer ? (
              <p className={styles.answer} data-cw-code-answer="">
                <strong>{copy.answer}:</strong> {loaded.explanation.answer}
              </p>
            ) : null}
            <ol className={styles.sections}>
              {loaded.explanation.sections.map((item, index) => (
                <li key={`${item.from}-${item.to}`}>
                  <button type="button" className={styles.sectionButton} aria-pressed={active === index} onClick={() => setActive(index)}>
                    <strong>{item.title}</strong> · {copy.lines} {item.from}–{item.to}
                  </button>
                  <p>{item.explanation}</p>
                  <a href={codeBlobUrl(piece, item.from, item.to)} target="_blank" rel="noopener noreferrer">
                    {copy.github}
                  </a>
                </li>
              ))}
            </ol>
            {loaded.explanation.decisions.length ? (
              <>
                <h2 className={styles.h2}>{copy.decisions}</h2>
                <AdrCards cards={loaded.explanation.decisions} labels={copy.adr} columns={1} />
              </>
            ) : null}
            {loaded.explanation.questions.length ? (
              <>
                <h2 className={styles.h2}>{copy.questions}</h2>
                <ul>
                  {loaded.explanation.questions.map((item) => (
                    <li key={item}>
                      <button type="button" className={styles.link} onClick={() => selected && void load(selected, item)}>
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <form className={styles.ask} onSubmit={submit}>
              <label htmlFor="code-question">{copy.ask}</label>
              <div className={styles.row}>
                <input id="code-question" value={question} maxLength={200} placeholder={copy.placeholder} onChange={(event) => setQuestion(event.target.value)} />
                <Button type="submit" variant="glass" disabled={!question.trim() || pending}>
                  {copy.send}
                </Button>
              </div>
            </form>
          </GlassSurface>
          <GlassSurface as="section" className={styles.code} aria-label={loaded.file.path}>
            <p className={styles.muted}>
              <a href={loaded.file.url} target="_blank" rel="noopener noreferrer">
                {loaded.file.path}
              </a>
              {loaded.file.truncated ? ` · ${copy.truncated}` : ''}
            </p>
            <pre className={styles.pre}>
              <code>
                {loaded.file.lines.map((line, index) => {
                  const number = index + 1
                  const lit = section ? number >= section.from && number <= section.to : false
                  return (
                    <span key={number} className={styles.line} data-lit={lit ? '' : undefined}>
                      <span className={styles.number} aria-hidden="true">
                        {number}
                      </span>
                      {line || ' '}
                      {'\n'}
                    </span>
                  )
                })}
              </code>
            </pre>
          </GlassSurface>
        </div>
      ) : null}
    </div>
  )
}
