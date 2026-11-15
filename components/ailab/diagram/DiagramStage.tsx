'use client'

import { useRef, useState, type FormEvent } from 'react'
import { DesignBoard } from '@/components/ailab/agent/DesignBoard'
import { GeminiConsent } from '@/components/ailab/shell/GeminiConsent'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import type { Diagram } from '@/lib/ai/agent/design'
import styles from './Diagram.module.scss'

const COPY = {
  es: {
    sends: 'la descripción de la arquitectura que escribas',
    prompt: 'Describe una arquitectura',
    placeholder: 'Un BFF que llama a tres servicios y una cola',
    draw: 'Dibujar',
    change: 'Pide un cambio',
    changePlaceholder: 'Agrega un caché delante de la base',
    apply: 'Aplicar',
    undo: 'Deshacer',
    working: 'Dibujando…',
    simulated: 'Simulador local: sin la clave de Gemini, este es un diagrama de ejemplo.',
    description: 'Descripción del diagrama',
    nodes: 'Nodos',
    links: 'Conexiones',
    png: 'Descargar PNG',
    errors: { failed: 'No pude dibujarlo. Prueba con otras palabras.', rate_limited: 'Llegaste al límite de diagramas de hoy.', daily_cap: 'El laboratorio llegó a su límite de hoy.', unavailable: 'Gemini no está disponible ahora.', off: 'Este experimento todavía no está activo.' },
    board: {
      title: 'Diagrama',
      empty: '',
      decisions: '',
      exportSvg: 'Descargar SVG',
      exportMd: '',
      adr: { decision: 'Decisión', why: 'Por qué', tradeoff: 'Qué se sacrifica' },
      file: 'diagrama-cherced',
    },
  },
  en: {
    sends: 'the architecture description you type',
    prompt: 'Describe an architecture',
    placeholder: 'A BFF that calls three services and a queue',
    draw: 'Draw',
    change: 'Ask for a change',
    changePlaceholder: 'Add a cache in front of the database',
    apply: 'Apply',
    undo: 'Undo',
    working: 'Drawing…',
    simulated: 'Local simulator: without the Gemini key, this is a sample diagram.',
    description: 'Diagram description',
    nodes: 'Nodes',
    links: 'Connections',
    png: 'Download PNG',
    errors: { failed: 'I couldn’t draw it. Try other words.', rate_limited: 'You reached today’s diagram limit.', daily_cap: 'The lab reached today’s limit.', unavailable: 'Gemini is not available right now.', off: 'This experiment isn’t active yet.' },
    board: {
      title: 'Diagram',
      empty: '',
      decisions: '',
      exportSvg: 'Download SVG',
      exportMd: '',
      adr: { decision: 'Decision', why: 'Why', tradeoff: 'What it costs' },
      file: 'cherced-diagram',
    },
  },
} as const

type ErrorKey = keyof (typeof COPY)['es']['errors']

export default function DiagramStage({ lang }: LabDemoProps) {
  const copy = COPY[lang]
  const [prompt, setPrompt] = useState('')
  const [change, setChange] = useState('')
  const [history, setHistory] = useState<Diagram[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ErrorKey | null>(null)
  const [simulated, setSimulated] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const current = history.at(-1) ?? null

  const run = async (text: string, base: Diagram | null) => {
    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/ailab/diagram', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lang, prompt: text, current: base }) })
      const body = (await response.json()) as { diagram?: Diagram; simulated?: boolean; error?: string }
      if (!response.ok || !body.diagram) throw new Error(body.error ?? 'failed')
      setSimulated(Boolean(body.simulated))
      setHistory((list) => [...list, body.diagram!].slice(-20))
    } catch (cause) {
      const key = cause instanceof Error && cause.message in copy.errors ? (cause.message as ErrorKey) : 'failed'
      setError(key)
    } finally {
      setPending(false)
    }
  }

  const draw = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (prompt.trim().length >= 3) void run(prompt.trim(), null)
  }

  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (change.trim().length >= 3 && current) {
      void run(change.trim(), current)
      setChange('')
    }
  }

  const exportPng = () => {
    const svg = boardRef.current?.querySelector('svg')
    if (!svg) return
    const width = Number(svg.getAttribute('width')) || 800
    const height = Number(svg.getAttribute('height')) || 400
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * 2
      canvas.height = height * 2
      const context = canvas.getContext('2d')
      if (!context) return
      context.scale(2, 2)
      context.drawImage(image, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob) return
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${copy.board.file}.png`
        link.click()
        URL.revokeObjectURL(link.href)
      }, 'image/png')
    }
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`
  }

  return (
    <GeminiConsent lang={lang} sends={copy.sends}>
      <div className={styles.stage} data-cw-diagram-stage="">
        <form className={styles.form} onSubmit={draw}>
          <label htmlFor="diagram-prompt">{copy.prompt}</label>
          <textarea id="diagram-prompt" value={prompt} maxLength={600} rows={3} placeholder={copy.placeholder} onChange={(event) => setPrompt(event.target.value)} />
          <Button type="submit" variant="solid" disabled={pending || prompt.trim().length < 3} data-cw-diagram-draw="">
            {pending ? copy.working : copy.draw}
          </Button>
        </form>
        {error ? <p role="alert">{copy.errors[error]}</p> : null}
        {current ? (
          <>
            {simulated ? <p className={styles.note}>{copy.simulated}</p> : null}
            <div ref={boardRef}>
              <DesignBoard diagram={current} decisions={[]} copy={copy.board} />
            </div>
            <div className={styles.row}>
              <Button variant="ghost" size="sm" onClick={exportPng}>
                {copy.png}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setHistory((list) => list.slice(0, -1))} disabled={history.length < 2} data-cw-diagram-undo="">
                {copy.undo}
              </Button>
            </div>
            <form className={styles.form} onSubmit={apply}>
              <label htmlFor="diagram-change">{copy.change}</label>
              <div className={styles.row}>
                <input id="diagram-change" value={change} maxLength={600} placeholder={copy.changePlaceholder} onChange={(event) => setChange(event.target.value)} />
                <Button type="submit" variant="glass" disabled={pending || change.trim().length < 3}>
                  {copy.apply}
                </Button>
              </div>
            </form>
            <details className={styles.text} data-cw-diagram-text="">
              <summary>{copy.description}</summary>
              <p>
                <strong>{copy.nodes}:</strong>
              </p>
              <ul>
                {current.nodos.map((node) => (
                  <li key={node.id}>
                    {node.etiqueta} ({node.tipo})
                  </li>
                ))}
              </ul>
              <p>
                <strong>{copy.links}:</strong>
              </p>
              <ul>
                {current.conexiones.map((edge, index) => {
                  const from = current.nodos.find((node) => node.id === edge.de)?.etiqueta ?? edge.de
                  const to = current.nodos.find((node) => node.id === edge.a)?.etiqueta ?? edge.a
                  return (
                    <li key={index}>
                      {from} → {to}
                      {edge.etiqueta ? ` (${edge.etiqueta})` : ''}
                    </li>
                  )
                })}
              </ul>
            </details>
          </>
        ) : null}
      </div>
    </GeminiConsent>
  )
}
