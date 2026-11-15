'use client'

import { useId, useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import { GeminiConsent } from '@/components/ailab/shell/GeminiConsent'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import { labRepoHref } from '@/content/ailab/catalog'
import { NEW_PIECE, SHOT_SAMPLE_SRC, uiPiece } from '@/content/ailab/ui-pieces'
import { SHOT_FILE_MAX_BYTES, SHOT_GRID, SHOT_MIME_TYPES, shotTree, type ShotResult, type ShotTreeNode } from '@/lib/ai/shot/model'
import styles from './Shot.module.scss'

const COPY = {
  es: {
    sends: 'la captura que subas',
    pick: 'Elegir imagen',
    drop: 'Arrastra aquí una captura, pégala con Ctrl+V o elige un archivo. PNG, JPG o WebP, hasta 5 MB.',
    sample: 'Usar una captura de ejemplo',
    analyze: 'Analizar',
    working: 'Analizando…',
    preview: 'Captura elegida',
    simulated: 'Simulador local: sin la clave de Gemini, este es el análisis de la captura de ejemplo.',
    tree: 'Árbol de componentes',
    sketch: 'Bosquejo en pixel art',
    sketchAlt: (count: number) => `Bosquejo de la pantalla en pixel art, con ${count} regiones numeradas como en el árbol.`,
    gaps: 'Lo que falta',
    noGaps: 'No falta nada: todo sale de piezas que existen.',
    newPiece: 'pieza nueva',
    levels: { primitiva: 'primitiva', composicion: 'composición', modulo: 'módulo' },
    json: 'Descargar JSON',
    file: 'componentes-cherced',
    errors: {
      failed: 'No pude analizarla. Prueba con otra captura.',
      rate_limited: 'Llegaste al límite de análisis de hoy.',
      daily_cap: 'El laboratorio llegó a su límite de hoy.',
      unavailable: 'Gemini no está disponible ahora.',
      off: 'Este experimento todavía no está activo.',
      too_large: 'La imagen pesa demasiado. Prueba con una de menos de 5 MB.',
      invalid: 'Eso no parece una imagen PNG, JPG o WebP.',
    },
  },
  en: {
    sends: 'the screenshot you upload',
    pick: 'Choose image',
    drop: 'Drop a screenshot here, paste it with Ctrl+V or choose a file. PNG, JPG or WebP, up to 5 MB.',
    sample: 'Use a sample screenshot',
    analyze: 'Analyze',
    working: 'Analyzing…',
    preview: 'Chosen screenshot',
    simulated: 'Local simulator: without the Gemini key, this is the analysis of the sample screenshot.',
    tree: 'Component tree',
    sketch: 'Pixel art sketch',
    sketchAlt: (count: number) => `Pixel art sketch of the screen, with ${count} regions numbered as in the tree.`,
    gaps: 'What’s missing',
    noGaps: 'Nothing is missing: everything comes from existing pieces.',
    newPiece: 'new piece',
    levels: { primitiva: 'primitive', composicion: 'composition', modulo: 'module' },
    json: 'Download JSON',
    file: 'cherced-components',
    errors: {
      failed: 'I couldn’t analyze it. Try another screenshot.',
      rate_limited: 'You reached today’s analysis limit.',
      daily_cap: 'The lab reached today’s limit.',
      unavailable: 'Gemini is not available right now.',
      off: 'This experiment isn’t active yet.',
      too_large: 'The image is too heavy. Try one under 5 MB.',
      invalid: 'That doesn’t look like a PNG, JPG or WebP image.',
    },
  },
} as const

type ErrorKey = keyof (typeof COPY)['es']['errors']

type Prepared = { mimeType: 'image/jpeg'; data: string; preview: string; width: number; height: number }

const MAX_SIDE = 1024

const SKETCH_WIDTH = 256

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('invalid'))
    image.src = src
  })
}

async function prepare(src: string): Promise<Prepared> {
  const image = await loadImage(src)
  const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('invalid')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)
  const preview = canvas.toDataURL('image/jpeg', 0.85)
  return { mimeType: 'image/jpeg', data: preview.slice(preview.indexOf(',') + 1), preview, width, height }
}

function numbered(roots: ShotTreeNode[]): Map<string, number> {
  const order = new Map<string, number>()
  const walk = (list: ShotTreeNode[]) => {
    for (const item of list) {
      order.set(item.id, order.size + 1)
      walk(item.hijos)
    }
  }
  walk(roots)
  return order
}

export default function ShotStage({ lang }: LabDemoProps) {
  const copy = COPY[lang]
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<Prepared | null>(null)
  const [result, setResult] = useState<ShotResult | null>(null)
  const [simulated, setSimulated] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ErrorKey | null>(null)

  const choose = async (src: string, revoke?: () => void) => {
    setError(null)
    setResult(null)
    try {
      setImage(await prepare(src))
    } catch {
      setImage(null)
      setError('invalid')
    } finally {
      revoke?.()
    }
  }

  const takeFile = (file: File | null | undefined) => {
    if (!file) return
    if (!(SHOT_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError('invalid')
      return
    }
    if (file.size > SHOT_FILE_MAX_BYTES) {
      setError('too_large')
      return
    }
    const url = URL.createObjectURL(file)
    void choose(url, () => URL.revokeObjectURL(url))
  }

  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith('image/'))
    if (!file) return
    event.preventDefault()
    takeFile(file)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    takeFile(event.dataTransfer.files[0])
  }

  const analyze = async () => {
    if (!image) return
    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/ailab/shot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lang, image: { mimeType: image.mimeType, data: image.data } }),
      })
      const body = (await response.json()) as { result?: ShotResult; simulated?: boolean; error?: string }
      if (!response.ok || !body.result) throw new Error(body.error ?? 'failed')
      setSimulated(Boolean(body.simulated))
      setResult(body.result)
    } catch (cause) {
      const key = cause instanceof Error && cause.message in copy.errors ? (cause.message as ErrorKey) : 'failed'
      setError(key)
    } finally {
      setPending(false)
    }
  }

  const download = () => {
    if (!result) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }))
    link.download = `${copy.file}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const roots = result ? shotTree(result) : []
  const order = numbered(roots)
  const sketchHeight = image ? Math.max(SHOT_GRID, Math.round((SKETCH_WIDTH * image.height) / image.width / SHOT_GRID) * SHOT_GRID) : SKETCH_WIDTH
  const cellX = SKETCH_WIDTH / SHOT_GRID
  const cellY = sketchHeight / SHOT_GRID

  const branch = (list: ShotTreeNode[]) => (
    <ol className={styles.tree}>
      {list.map((item) => {
        const piece = item.pieza === NEW_PIECE ? null : uiPiece(item.pieza)
        return (
          <li key={item.id} data-cw-shot-node={item.pieza}>
            <span className={styles.number}>{order.get(item.id)}</span> <strong>{item.nombre}</strong>{' '}
            {piece ? (
              <a href={labRepoHref(piece.path)} target="_blank" rel="noreferrer" className={styles.piece}>
                {piece.name} · {copy.levels[piece.level]}
              </a>
            ) : (
              <span className={styles.newPiece}>{copy.newPiece}</span>
            )}
            {item.props ? <code className={styles.props}>{item.props}</code> : null}
            {item.hijos.length ? branch(item.hijos) : null}
          </li>
        )
      })}
    </ol>
  )

  return (
    <GeminiConsent lang={lang} sends={copy.sends}>
      <div className={styles.stage} data-cw-shot-stage="">
        <div
          className={styles.drop}
          onPaste={onPaste}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          tabIndex={0}
          aria-describedby={`${inputId}-hint`}
          data-cw-shot-drop=""
        >
          <p id={`${inputId}-hint`}>{copy.drop}</p>
          <div className={styles.row}>
            <Button variant="glass" size="sm" onClick={() => fileRef.current?.click()} data-cw-shot-pick="">
              {copy.pick}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void choose(SHOT_SAMPLE_SRC)} data-cw-shot-sample="">
              {copy.sample}
            </Button>
          </div>
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept={SHOT_MIME_TYPES.join(',')}
            className="cw-visually-hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              takeFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </div>

        {image ? (
          <div className={styles.preview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.preview} alt={copy.preview} width={image.width} height={image.height} />
            <Button variant="solid" onClick={() => void analyze()} disabled={pending} data-cw-shot-analyze="">
              {pending ? copy.working : copy.analyze}
            </Button>
          </div>
        ) : null}

        <p role="status" aria-live="polite" className="cw-visually-hidden">
          {pending ? copy.working : ''}
        </p>
        {error ? <p role="alert">{copy.errors[error]}</p> : null}

        {result ? (
          <div className={styles.result} data-cw-shot-result="">
            {simulated ? <p className={styles.note}>{copy.simulated}</p> : null}
            <p>{result.resumen}</p>
            <div className={styles.columns}>
              <section aria-labelledby={`${inputId}-sketch`}>
                <h4 id={`${inputId}-sketch`}>{copy.sketch}</h4>
                <svg
                  className={styles.sketch}
                  viewBox={`0 0 ${SKETCH_WIDTH} ${sketchHeight}`}
                  role="img"
                  aria-label={copy.sketchAlt(result.nodos.length)}
                  shapeRendering="crispEdges"
                  data-cw-shot-sketch=""
                >
                  <rect width={SKETCH_WIDTH} height={sketchHeight} fill="#050807" />
                  {result.nodos.map((item) => {
                    const x = item.caja.x * cellX
                    const y = item.caja.y * cellY
                    const fresh = item.pieza === NEW_PIECE
                    return (
                      <g key={item.id}>
                        <rect
                          x={x + 1}
                          y={y + 1}
                          width={Math.max(2, item.caja.an * cellX - 2)}
                          height={Math.max(2, item.caja.al * cellY - 2)}
                          fill={fresh ? 'rgba(255,196,0,0.10)' : 'rgba(37,237,158,0.08)'}
                          stroke={fresh ? '#ffc400' : '#25ed9e'}
                          strokeWidth={2}
                          strokeDasharray={fresh ? '4 2' : undefined}
                        />
                        <rect x={x + 1} y={y + 1} width={10} height={9} fill={fresh ? '#ffc400' : '#25ed9e'} />
                        <text x={x + 6} y={y + 8} fontSize={7} fontFamily="monospace" fontWeight={700} textAnchor="middle" fill="#050807">
                          {order.get(item.id)}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </section>
              <section aria-labelledby={`${inputId}-tree`}>
                <h4 id={`${inputId}-tree`}>{copy.tree}</h4>
                {branch(roots)}
              </section>
            </div>
            <section aria-labelledby={`${inputId}-gaps`}>
              <h4 id={`${inputId}-gaps`}>{copy.gaps}</h4>
              {result.huecos.length ? (
                <ul className={styles.gaps} data-cw-shot-gaps="">
                  {result.huecos.map((gap, index) => (
                    <li key={index}>
                      <strong>{gap.que}.</strong> {gap.por_que}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{copy.noGaps}</p>
              )}
            </section>
            <div className={styles.row}>
              <Button variant="ghost" size="sm" onClick={download} data-cw-shot-json="">
                {copy.json}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </GeminiConsent>
  )
}
