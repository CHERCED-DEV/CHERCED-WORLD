'use client'

import { useRef, useState, type FormEvent } from 'react'
import { GeminiConsent } from '@/components/ailab/shell/GeminiConsent'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import { WRITE_LIMITS, WRITE_TOOLS, type WriteTool } from '@/lib/ai/write/prompts'
import { downloadText } from '@/lib/ailab/skill/download'
import styles from './Write.module.scss'

const COPY = {
  es: {
    sends: 'la idea, la decisión o el diff que pegues',
    tabs: { spec: 'De idea a spec', adr: 'Generador de ADR', commit: 'Haiku del commit' },
    labels: { spec: 'Tu idea, en una línea', adr: 'Describe la decisión', commit: 'Pega un diff' },
    placeholders: {
      spec: 'Un botón que lea en voz alta el resumen de cada caso del portafolio',
      adr: 'Usar una cola entre el BFF y el servicio de pagos en vez de llamarlo directo',
      commit: 'diff --git a/... b/...',
    },
    generate: 'Generar',
    working: 'Escribiendo…',
    copy: 'Copiar',
    copied: 'Copiado',
    download: 'Descargar .md',
    left: 'caracteres',
    errors: { failed: 'No pude generarlo. Prueba otra vez.', rate_limited: 'Llegaste al límite de hoy.', daily_cap: 'El laboratorio llegó a su límite de hoy.', unavailable: 'Gemini no está disponible ahora.', too_long: 'Es demasiado largo.', off: 'Este experimento todavía no está activo.' },
  },
  en: {
    sends: 'the idea, decision or diff you paste',
    tabs: { spec: 'Idea to spec', adr: 'ADR generator', commit: 'Commit haiku' },
    labels: { spec: 'Your idea, in one line', adr: 'Describe the decision', commit: 'Paste a diff' },
    placeholders: {
      spec: 'A button that reads aloud the summary of each portfolio case',
      adr: 'Use a queue between the BFF and the payments service instead of calling it directly',
      commit: 'diff --git a/... b/...',
    },
    generate: 'Generate',
    working: 'Writing…',
    copy: 'Copy',
    copied: 'Copied',
    download: 'Download .md',
    left: 'characters',
    errors: { failed: 'I couldn’t generate it. Try again.', rate_limited: 'You reached today’s limit.', daily_cap: 'The lab reached today’s limit.', unavailable: 'Gemini is not available right now.', too_long: 'It’s too long.', off: 'This experiment isn’t active yet.' },
  },
} as const

type ErrorKey = keyof (typeof COPY)['es']['errors']

export default function WriteStage({ lang }: LabDemoProps) {
  const copy = COPY[lang]
  const [tool, setTool] = useState<WriteTool>('spec')
  const [inputs, setInputs] = useState<Record<WriteTool, string>>({ spec: '', adr: '', commit: '' })
  const [output, setOutput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ErrorKey | null>(null)
  const [copied, setCopied] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const input = inputs[tool]

  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (input.trim().length < 3) return
    abort.current?.abort()
    const controller = new AbortController()
    abort.current = controller
    setPending(true)
    setError(null)
    setOutput('')
    setCopied(false)
    try {
      const response = await fetch('/api/ailab/write', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lang, tool, input: input.trim() }),
        signal: controller.signal,
      })
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'failed')
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        setOutput((current) => current + decoder.decode(value, { stream: true }))
      }
    } catch (cause) {
      if (controller.signal.aborted) return
      const key = cause instanceof Error && cause.message in copy.errors ? (cause.message as ErrorKey) : 'failed'
      setError(key)
    } finally {
      if (abort.current === controller) setPending(false)
    }
  }

  return (
    <GeminiConsent lang={lang} sends={copy.sends}>
      <div className={styles.stage} data-cw-write-stage="">
        <div className={styles.tabs} role="tablist" aria-label={copy.generate}>
          {WRITE_TOOLS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tool === item}
              className={styles.tab}
              onClick={() => {
                setTool(item)
                setOutput('')
                setError(null)
              }}
              data-cw-write-tab={item}
            >
              {copy.tabs[item]}
            </button>
          ))}
        </div>
        <form className={styles.form} onSubmit={generate}>
          <label htmlFor="write-input">{copy.labels[tool]}</label>
          <textarea
            id="write-input"
            value={input}
            rows={tool === 'commit' ? 8 : 3}
            maxLength={WRITE_LIMITS[tool]}
            placeholder={copy.placeholders[tool]}
            onChange={(event) => setInputs((current) => ({ ...current, [tool]: event.target.value }))}
          />
          <p className={styles.note}>
            {input.length} / {WRITE_LIMITS[tool]} {copy.left}
          </p>
          <Button type="submit" variant="solid" disabled={pending || input.trim().length < 3} data-cw-write-generate="">
            {pending ? copy.working : copy.generate}
          </Button>
        </form>
        {error ? <p role="alert">{copy.errors[error]}</p> : null}
        {output ? (
          <>
            <pre className={styles.output} aria-live="polite" data-cw-write-output="">
              {output}
            </pre>
            <div className={styles.row}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void navigator.clipboard?.writeText(output).then(() => setCopied(true))
                }}
              >
                {copied ? copy.copied : copy.copy}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => downloadText(`${tool}-${new Date().toISOString().slice(0, 10)}.md`, output)}>
                {copy.download}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </GeminiConsent>
  )
}
