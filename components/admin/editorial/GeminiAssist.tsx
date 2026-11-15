'use client'

import { useState } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import type { Locale } from '@/content/types'
import { assistCover, assistMeta, assistReview, assistTranslate, type AssistError } from '@/lib/actions/editorial-ai'
import type { MetaSuggestion, ReviewFinding, Translation } from '@/lib/ai/editorial/assist'
import { replaceAlt, type ShapeIssue } from '@/lib/ai/editorial/check'
import type { DraftInput } from '@/lib/editorial/model'
import styles from './GeminiAssist.module.scss'

const COPY = {
  es: {
    title: 'Asistente con Gemini',
    note: 'Nada se aplica solo: cada propuesta se acepta o se descarta. A Google va solo el texto del borrador.',
    translateTo: { es: 'Traducir al español', en: 'Traducir al inglés' },
    review: 'Revisar el estilo',
    meta: 'Proponer descripción, etiquetas y alt',
    cover: 'Proponer una portada',
    working: 'Pensando…',
    simulated: 'Simulador local: sin la clave de Gemini, esta propuesta es de ejemplo.',
    discard: 'Descartar',
    adopt: { es: 'Crear el borrador en español con esto', en: 'Crear el borrador en inglés con esto' },
    issues: 'Ojo, la estructura cambió:',
    issue: { fences: 'bloques de código', headings: 'títulos', links: 'enlaces', images: 'imágenes', inlineCode: 'código en línea' } satisfies Record<ShapeIssue, string>,
    shapeOk: 'La estructura se conservó: mismos títulos, enlaces, imágenes y código.',
    noFindings: 'No encontré nada que incumpla las reglas de estilo.',
    line: 'Línea',
    goTo: 'Ir a la línea',
    use: 'Usar',
    apply: 'Aplicar',
    description: 'Descripción',
    tags: 'Etiquetas',
    alts: 'Texto alternativo',
    noImages: 'El borrador no tiene imágenes.',
    coverNote: 'El sitio todavía no guarda portadas de imagen: si te gusta, descárgala. La portada generada en SVG sigue siendo la del post.',
    noCover: 'Sin la clave de Gemini no hay portada de ejemplo.',
    download: 'Descargar PNG',
    errors: {
      unauthorized: 'No tienes permiso para esto.',
      validation: 'Al borrador le falta el título o el cuerpo.',
      rate_limited: 'Llegaste al límite de hoy del asistente.',
      unavailable: 'Gemini no está disponible ahora.',
      failed: 'No salió bien. Prueba otra vez.',
    } satisfies Record<AssistError, string>,
  },
  en: {
    title: 'Gemini assistant',
    note: 'Nothing is applied on its own: each proposal is accepted or discarded. Only the draft text goes to Google.',
    translateTo: { es: 'Translate to Spanish', en: 'Translate to English' },
    review: 'Review the style',
    meta: 'Suggest description, tags and alt',
    cover: 'Suggest a cover',
    working: 'Thinking…',
    simulated: 'Local simulator: without the Gemini key, this proposal is a sample.',
    discard: 'Discard',
    adopt: { es: 'Create the Spanish draft with this', en: 'Create the English draft with this' },
    issues: 'Careful, the structure changed:',
    issue: { fences: 'code blocks', headings: 'headings', links: 'links', images: 'images', inlineCode: 'inline code' } satisfies Record<ShapeIssue, string>,
    shapeOk: 'The structure was kept: same headings, links, images and code.',
    noFindings: 'I found nothing that breaks the style rules.',
    line: 'Line',
    goTo: 'Go to line',
    use: 'Use',
    apply: 'Apply',
    description: 'Description',
    tags: 'Tags',
    alts: 'Alt text',
    noImages: 'The draft has no images.',
    coverNote: 'The site doesn’t store image covers yet: download it if you like it. The generated SVG cover is still the post’s cover.',
    noCover: 'Without the Gemini key there is no sample cover.',
    download: 'Download PNG',
    errors: {
      unauthorized: 'You don’t have permission for this.',
      validation: 'The draft is missing its title or body.',
      rate_limited: 'You reached today’s assistant limit.',
      unavailable: 'Gemini is not available right now.',
      failed: 'It didn’t work. Try again.',
    } satisfies Record<AssistError, string>,
  },
} as const

type Proposal =
  | { kind: 'translate'; value: Translation }
  | { kind: 'review'; value: ReviewFinding[] }
  | { kind: 'meta'; value: MetaSuggestion }
  | { kind: 'cover'; value: { mimeType: string; data: string } | null }

function goToLine(line: number) {
  const area = document.querySelector<HTMLTextAreaElement>('[data-cw-blog-studio] textarea[name="body"]')
  if (!area) return
  const lines = area.value.split('\n')
  const start = lines.slice(0, line - 1).reduce((total, text) => total + text.length + 1, 0)
  area.focus()
  area.setSelectionRange(start, start + (lines[line - 1]?.length ?? 0))
  const height = area.scrollHeight / Math.max(1, lines.length)
  area.scrollTop = Math.max(0, (line - 3) * height)
}

export function GeminiAssist({
  lang,
  draft,
  disabled,
  onAdopt,
  onPatch,
  onTags,
}: {
  lang: Locale
  draft: DraftInput
  disabled: boolean
  onAdopt: (next: DraftInput) => void
  onPatch: (patch: Partial<DraftInput>) => void
  onTags: (tags: string[]) => void
}) {
  const copy = COPY[lang]
  const [busy, setBusy] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [simulated, setSimulated] = useState(false)
  const [error, setError] = useState<AssistError | null>(null)
  const target = draft.lang === 'es' ? 'en' : 'es'
  const text = { lang: draft.lang, title: draft.title, description: draft.description, body: draft.body, tags: draft.tags }

  async function run(kind: Proposal['kind']) {
    setBusy(true)
    setError(null)
    setProposal(null)
    try {
      const result =
        kind === 'translate'
          ? await assistTranslate(text)
          : kind === 'review'
            ? await assistReview(text)
            : kind === 'meta'
              ? await assistMeta(text)
              : await assistCover({ title: draft.title, tags: draft.tags })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSimulated(result.simulated)
      setProposal({ kind, value: result.data } as Proposal)
    } catch {
      setError('failed')
    } finally {
      setBusy(false)
    }
  }

  const ready = Boolean(draft.title.trim() && draft.body.trim())
  const button = (kind: Proposal['kind'], label: string, needsBody = true) => (
    <button type="button" className={buttonClassName({ size: 'sm' })} disabled={busy || disabled || (needsBody ? !ready : !draft.title.trim())} onClick={() => void run(kind)} data-cw-assist={kind}>
      {label}
    </button>
  )

  return (
    <section className={styles.assist} aria-labelledby="gemini-assist-title" data-cw-gemini-assist="">
      <h3 id="gemini-assist-title">{copy.title}</h3>
      <p className={styles.note}>{copy.note}</p>
      <div className={styles.buttons}>
        {button('translate', copy.translateTo[target])}
        {button('review', copy.review)}
        {button('meta', copy.meta)}
        {button('cover', copy.cover, false)}
      </div>
      <p role="status" aria-live="polite" className={styles.note}>
        {busy ? copy.working : ''}
      </p>
      {error ? <p role="alert">{copy.errors[error]}</p> : null}
      {proposal && simulated ? <p className={styles.note}>{copy.simulated}</p> : null}

      {proposal?.kind === 'translate' ? (
        <div className={styles.proposal} data-cw-assist-result="translate">
          <p>
            <strong>{proposal.value.title}</strong>
          </p>
          <p>{proposal.value.description}</p>
          <p className={styles.note}>{proposal.value.tags.join(', ')}</p>
          <pre className={styles.body}>{proposal.value.body}</pre>
          {proposal.value.issues.length ? (
            <p role="alert">
              {copy.issues} {proposal.value.issues.map((issue) => copy.issue[issue]).join(', ')}.
            </p>
          ) : (
            <p className={styles.note}>{copy.shapeOk}</p>
          )}
          <div className={styles.buttons}>
            <button
              type="button"
              className={buttonClassName({ variant: 'solid', size: 'sm' })}
              onClick={() => {
                onAdopt({ id: crypto.randomUUID(), version: 0, lang: proposal.value.lang, title: proposal.value.title, description: proposal.value.description, body: proposal.value.body, tags: proposal.value.tags })
                setProposal(null)
              }}
              data-cw-assist-adopt=""
            >
              {copy.adopt[proposal.value.lang]}
            </button>
            <button type="button" className={buttonClassName({ size: 'sm' })} onClick={() => setProposal(null)}>
              {copy.discard}
            </button>
          </div>
        </div>
      ) : null}

      {proposal?.kind === 'review' ? (
        <div className={styles.proposal} data-cw-assist-result="review">
          {proposal.value.length === 0 ? (
            <p>{copy.noFindings}</p>
          ) : (
            <ol className={styles.findings}>
              {proposal.value.map((finding, index) => (
                <li key={index}>
                  <strong>
                    {copy.line} {finding.linea} · {finding.regla}
                  </strong>{' '}
                  «{finding.cita}» → {finding.sugerencia}{' '}
                  <button type="button" className={styles.link} onClick={() => goToLine(finding.linea)}>
                    {copy.goTo}
                  </button>
                </li>
              ))}
            </ol>
          )}
          <button type="button" className={buttonClassName({ size: 'sm' })} onClick={() => setProposal(null)}>
            {copy.discard}
          </button>
        </div>
      ) : null}

      {proposal?.kind === 'meta' ? (
        <div className={styles.proposal} data-cw-assist-result="meta">
          <p>
            <strong>{copy.description}:</strong> {proposal.value.description}{' '}
            <button type="button" className={styles.link} onClick={() => onPatch({ description: proposal.value.description })}>
              {copy.use}
            </button>
          </p>
          <p>
            <strong>{copy.tags}:</strong> {proposal.value.tags.join(', ')}{' '}
            <button type="button" className={styles.link} onClick={() => onTags(proposal.value.tags)}>
              {copy.use}
            </button>
          </p>
          <p>
            <strong>{copy.alts}:</strong>
          </p>
          {proposal.value.alts.length ? (
            <ul className={styles.findings}>
              {proposal.value.alts.map((item) => (
                <li key={item.src}>
                  <code>{item.src}</code> → «{item.alt}»{' '}
                  <button type="button" className={styles.link} onClick={() => onPatch({ body: replaceAlt(draft.body, item.src, item.alt) })}>
                    {copy.apply}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.note}>{copy.noImages}</p>
          )}
          <button type="button" className={buttonClassName({ size: 'sm' })} onClick={() => setProposal(null)}>
            {copy.discard}
          </button>
        </div>
      ) : null}

      {proposal?.kind === 'cover' ? (
        <div className={styles.proposal} data-cw-assist-result="cover">
          {proposal.value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.cover} src={`data:${proposal.value.mimeType};base64,${proposal.value.data}`} alt={draft.title} />
              <p className={styles.note}>{copy.coverNote}</p>
              <a className={buttonClassName({ size: 'sm' })} href={`data:${proposal.value.mimeType};base64,${proposal.value.data}`} download={`portada-${draft.id}.png`}>
                {copy.download}
              </a>
            </>
          ) : (
            <p className={styles.note}>{copy.noCover}</p>
          )}
          <button type="button" className={buttonClassName({ size: 'sm' })} onClick={() => setProposal(null)}>
            {copy.discard}
          </button>
        </div>
      ) : null}
    </section>
  )
}
