'use client'

import { useId, useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import { AgentAvatar } from '@/components/ailab/agent/AgentAvatar'
import { GeminiConsent } from '@/components/ailab/shell/GeminiConsent'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import {
  nearestPalette,
  PIXEL_FILE_MAX_BYTES,
  PIXEL_LOCAL_GRID,
  PIXEL_MARK,
  PIXEL_OUTPUT_SIDE,
  PIXEL_PHOTO_MAX_SIDE,
  PIXEL_PHOTO_TYPES,
  PIXEL_SAMPLE_SRC,
} from '@/lib/ai/pixel/model'
import styles from './Pixel.module.scss'

const COPY = {
  es: {
    sends: 'la foto que subas',
    notice: 'La foto va a Google para generar la imagen y no se guarda en el sitio: ni la foto ni el resultado. Usa una foto tuya o de alguien que te haya dado permiso.',
    drop: 'Arrastra aquí una foto, pégala con Ctrl+V, elige un archivo o tómala con la cámara. JPG, PNG o WebP, hasta 5 MB.',
    pick: 'Elegir foto',
    camera: 'Tomar foto',
    sample: 'Probar con la foto de Camilo',
    photo: 'Tu foto',
    go: 'Pixélame',
    working: 'Pixelando… tarda unos segundos',
    done: 'Listo: tu chibi está junto a Mini Cherced.',
    alt: 'Tu foto convertida en un chibi pixel art con contorno verde sobre fondo negro',
    mini: 'Mini Cherced',
    download: 'Descargar PNG',
    again: 'Otra foto',
    simulated: 'Simulador local: sin la clave de Gemini, tu navegador pixeló la foto él solo. Con Gemini sale un chibi de verdad.',
    file: 'chibi-cherced',
    errors: {
      failed: 'No pude pixelarla. Prueba otra vez en un rato.',
      refused: 'No pude convertir esta foto. Prueba con otra en la que se vea bien la cara.',
      rate_limited: 'Ya hiciste tus 2 chibis de hoy. Vuelve mañana.',
      daily_cap: 'El laboratorio ya hizo todos los chibis de hoy. Vuelve mañana.',
      unavailable: 'Gemini no está disponible ahora.',
      off: 'Este experimento todavía no está activo.',
      too_large: 'La foto pesa demasiado. Prueba con una de menos de 5 MB.',
      invalid: 'Eso no parece una foto JPG, PNG o WebP.',
    },
  },
  en: {
    sends: 'the photo you upload',
    notice: 'The photo goes to Google to generate the image and is not stored on the site: neither the photo nor the result. Use a photo of yourself or of someone who gave you permission.',
    drop: 'Drop a photo here, paste it with Ctrl+V, choose a file or take one with the camera. JPG, PNG or WebP, up to 5 MB.',
    pick: 'Choose photo',
    camera: 'Take photo',
    sample: 'Try with Camilo’s photo',
    photo: 'Your photo',
    go: 'Pixelate me',
    working: 'Pixelating… it takes a few seconds',
    done: 'Done: your chibi is standing next to Mini Cherced.',
    alt: 'Your photo turned into a pixel art chibi with a green outline on a black background',
    mini: 'Mini Cherced',
    download: 'Download PNG',
    again: 'Another photo',
    simulated: 'Local simulator: without the Gemini key, your browser pixelated the photo on its own. With Gemini you get a real chibi.',
    file: 'cherced-chibi',
    errors: {
      failed: 'I couldn’t pixelate it. Try again in a while.',
      refused: 'I couldn’t convert this photo. Try another one where the face shows clearly.',
      rate_limited: 'You already made your 2 chibis today. Come back tomorrow.',
      daily_cap: 'The lab already made all of today’s chibis. Come back tomorrow.',
      unavailable: 'Gemini is not available right now.',
      off: 'This experiment isn’t active yet.',
      too_large: 'The photo is too heavy. Try one under 5 MB.',
      invalid: 'That doesn’t look like a JPG, PNG or WebP photo.',
    },
  },
} as const

type ErrorKey = keyof (typeof COPY)['es']['errors']

type Photo = { mimeType: 'image/jpeg'; data: string; preview: string }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('invalid'))
    image.src = src
  })
}

function canvasOf(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('invalid')
  return [canvas, context]
}

async function preparePhoto(src: string): Promise<Photo> {
  const image = await loadImage(src)
  const scale = Math.min(1, PIXEL_PHOTO_MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const [canvas, context] = canvasOf(width, height)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)
  const preview = canvas.toDataURL('image/jpeg', 0.88)
  return { mimeType: 'image/jpeg', data: preview.slice(preview.indexOf(',') + 1), preview }
}

function stamp(context: CanvasRenderingContext2D, side: number) {
  context.font = 'bold 11px monospace'
  const width = context.measureText(PIXEL_MARK).width + 12
  context.fillStyle = 'rgba(0, 0, 0, 0.75)'
  context.fillRect(side - width - 6, side - 22, width, 16)
  context.fillStyle = '#25ed9e'
  context.textBaseline = 'middle'
  context.fillText(PIXEL_MARK, side - width, side - 14)
}

async function finish(src: string): Promise<string> {
  const image = await loadImage(src)
  const side = PIXEL_OUTPUT_SIDE
  const [canvas, context] = canvasOf(side, side)
  context.imageSmoothingEnabled = false
  context.fillStyle = '#000000'
  context.fillRect(0, 0, side, side)
  const scale = Math.min(side / image.naturalWidth, side / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  context.drawImage(image, (side - width) / 2, (side - height) / 2, width, height)
  stamp(context, side)
  return canvas.toDataURL('image/png')
}

async function pixelLocally(src: string): Promise<string> {
  const image = await loadImage(src)
  const grid = PIXEL_LOCAL_GRID
  const crop = Math.min(image.naturalWidth, image.naturalHeight)
  const [, smallContext] = canvasOf(grid, grid)
  smallContext.fillStyle = '#ffffff'
  smallContext.fillRect(0, 0, grid, grid)
  smallContext.drawImage(image, (image.naturalWidth - crop) / 2, 0, crop, crop, 0, 0, grid, grid)
  const pixels = smallContext.getImageData(0, 0, grid, grid)
  const side = PIXEL_OUTPUT_SIDE
  const cell = side / grid
  const [canvas, context] = canvasOf(side, side)
  context.fillStyle = '#000000'
  context.fillRect(0, 0, side, side)
  for (let y = 0; y < grid; y += 1)
    for (let x = 0; x < grid; x += 1) {
      const at = (y * grid + x) * 4
      const [r, g, b] = nearestPalette(pixels.data[at]!, pixels.data[at + 1]!, pixels.data[at + 2]!)
      if (r > 235 && g > 235 && b > 235) continue
      context.fillStyle = `rgb(${r}, ${g}, ${b})`
      context.fillRect(x * cell, y * cell, cell, cell)
    }
  context.fillStyle = 'rgba(37, 237, 158, 0.08)'
  for (let y = 0; y < side; y += 4) context.fillRect(0, y, side, 1)
  stamp(context, side)
  return canvas.toDataURL('image/png')
}

export default function PixelStage({ lang }: LabDemoProps) {
  const copy = COPY[lang]
  const id = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [sample, setSample] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [simulated, setSimulated] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ErrorKey | null>(null)

  const choose = async (src: string, revoke?: () => void) => {
    setError(null)
    setResult(null)
    setSample(src === PIXEL_SAMPLE_SRC)
    try {
      setPhoto(await preparePhoto(src))
    } catch {
      setPhoto(null)
      setError('invalid')
    } finally {
      revoke?.()
    }
  }

  const takeFile = (file: File | null | undefined) => {
    if (!file) return
    if (!(PIXEL_PHOTO_TYPES as readonly string[]).includes(file.type)) {
      setError('invalid')
      return
    }
    if (file.size > PIXEL_FILE_MAX_BYTES) {
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

  const go = async () => {
    if (!photo) return
    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/ailab/pixel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lang, photo: { mimeType: photo.mimeType, data: photo.data }, sample }),
      })
      const body = (await response.json()) as { image?: { mimeType: string; data: string }; simulated?: boolean; error?: string }
      if (!response.ok) throw new Error(body.error ?? 'failed')
      if (body.simulated) {
        setSimulated(true)
        setResult(await pixelLocally(photo.preview))
      } else if (body.image) {
        setSimulated(false)
        setResult(await finish(`data:${body.image.mimeType};base64,${body.image.data}`))
      } else throw new Error('failed')
    } catch (cause) {
      const key = cause instanceof Error && cause.message in copy.errors ? (cause.message as ErrorKey) : 'failed'
      setError(key)
    } finally {
      setPending(false)
    }
  }

  const fileInput = (ref: typeof fileRef, camera: boolean) => (
    <input
      ref={ref}
      type="file"
      accept={camera ? 'image/*' : PIXEL_PHOTO_TYPES.join(',')}
      capture={camera ? 'user' : undefined}
      className="cw-visually-hidden"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(event) => {
        takeFile(event.target.files?.[0])
        event.target.value = ''
      }}
    />
  )

  return (
    <GeminiConsent lang={lang} sends={copy.sends}>
      <div className={styles.stage} data-cw-pixel-stage="">
        <p className={styles.notice} id={`${id}-notice`}>
          {copy.notice}
        </p>
        <div className={styles.drop} onPaste={onPaste} onDragOver={(event) => event.preventDefault()} onDrop={onDrop} tabIndex={0} aria-describedby={`${id}-drop`} data-cw-pixel-drop="">
          <p id={`${id}-drop`}>{copy.drop}</p>
          <div className={styles.row}>
            <Button variant="glass" size="sm" onClick={() => fileRef.current?.click()} data-cw-pixel-pick="">
              {copy.pick}
            </Button>
            <Button variant="glass" size="sm" onClick={() => cameraRef.current?.click()} data-cw-pixel-camera="">
              {copy.camera}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void choose(PIXEL_SAMPLE_SRC)} data-cw-pixel-sample="">
              {copy.sample}
            </Button>
          </div>
          {fileInput(fileRef, false)}
          {fileInput(cameraRef, true)}
        </div>

        {photo && !result ? (
          <div className={styles.photo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.preview} alt={copy.photo} />
            <Button variant="solid" onClick={() => void go()} disabled={pending} aria-describedby={`${id}-notice`} data-cw-pixel-go="">
              {pending ? copy.working : copy.go}
            </Button>
          </div>
        ) : null}

        <p role="status" aria-live="polite" className="cw-visually-hidden">
          {pending ? copy.working : result ? copy.done : ''}
        </p>
        {error ? <p role="alert">{copy.errors[error]}</p> : null}

        {result ? (
          <div className={styles.result} data-cw-pixel-result="">
            {simulated ? <p className={styles.note}>{copy.simulated}</p> : null}
            <div className={styles.scene}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result} alt={copy.alt} width={PIXEL_OUTPUT_SIDE} height={PIXEL_OUTPUT_SIDE} className={styles.chibi} data-cw-pixel-image="" />
              <figure className={styles.mini} aria-label={copy.mini}>
                <AgentAvatar />
                <figcaption>{copy.mini}</figcaption>
              </figure>
            </div>
            <div className={styles.row}>
              <a className={styles.download} href={result} download={`${copy.file}.png`} data-cw-pixel-download="">
                {copy.download}
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResult(null)
                  setPhoto(null)
                }}
              >
                {copy.again}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </GeminiConsent>
  )
}
