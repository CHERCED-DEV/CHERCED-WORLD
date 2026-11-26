import 'server-only'
import { z } from 'zod'
import { styleRules, styleRulesText } from '@/content/style-rules'
import { GEMINI_API_BASE } from '@/lib/ai/gemini'
import { GeminiError, generateJson, googleReason } from '@/lib/ai/generate'
import { GEMINI_MODELS } from '@/lib/ai/models'
import type { Locale } from '@/lib/i18n/config'
import { bodyImages, compareShape, lineCount, type ShapeIssue } from './check'

export type DraftText = { lang: Locale; title: string; description: string; body: string; tags: string[] }

const LANGUAGE: Record<Locale, string> = { es: 'español', en: 'inglés' }

function other(lang: Locale): Locale {
  return lang === 'es' ? 'en' : 'es'
}

async function json<T>(key: string, system: string, prompt: string, schema: unknown, parser: z.ZodType<T>, fetcher: typeof fetch, maxOutputTokens = 8000): Promise<T> {
  let lastError: unknown = null
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const reply = await generateJson({ key, model: GEMINI_MODELS.text, system, prompt, schema, temperature: 0.2, maxOutputTokens, timeoutMs: 55_000 }, fetcher)
    try {
      return parser.parse(JSON.parse(reply.text || '{}'))
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('respuesta inválida')
}

const translationSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(320),
  tags: z.array(z.string().trim().min(1).max(60)).max(12),
  body: z.string().max(100_000),
})

export type Translation = z.infer<typeof translationSchema> & { lang: Locale; issues: ShapeIssue[] }

export async function translateDraft(key: string, draft: DraftText, fetcher: typeof fetch = fetch): Promise<Translation> {
  const target = other(draft.lang)
  const system = [
    `Traduces un borrador del blog de ${LANGUAGE[draft.lang]} a ${LANGUAGE[target]}.`,
    'Conservas el Markdown tal cual: títulos, listas, enlaces y sus URLs, imágenes y sus rutas, código en línea y bloques de código sin traducir su contenido.',
    'Traduces el texto alternativo de las imágenes y el texto de los enlaces, no las URLs.',
    'Reglas de estilo del sitio:',
    styleRulesText(),
  ].join('\n')
  const prompt = JSON.stringify({ title: draft.title, description: draft.description, tags: draft.tags, body: draft.body })
  const schema = {
    type: 'OBJECT',
    properties: { title: { type: 'STRING' }, description: { type: 'STRING' }, tags: { type: 'ARRAY', items: { type: 'STRING' } }, body: { type: 'STRING' } },
    required: ['title', 'description', 'tags', 'body'],
  }
  const result = await json(key, system, prompt, schema, translationSchema, fetcher, 16_000)
  return { ...result, lang: target, issues: compareShape(draft.body, result.body) }
}

export function reviewSchemaFor(lines: number) {
  return z.object({
    hallazgos: z
      .array(
        z.object({
          linea: z.number().int().min(1).max(Math.max(1, lines)),
          regla: z.string().refine((value) => styleRules.some((rule) => rule.id === value), 'regla desconocida'),
          cita: z.string().trim().max(200),
          sugerencia: z.string().trim().max(400),
        }),
      )
      .max(30),
  })
}

export type ReviewFinding = { linea: number; regla: string; cita: string; sugerencia: string }

export async function reviewDraft(key: string, draft: DraftText, fetcher: typeof fetch = fetch): Promise<ReviewFinding[]> {
  const numbered = draft.body
    .split('\n')
    .map((line, index) => `${index + 1}| ${line}`)
    .join('\n')
  const system = [
    `Revisas un borrador del blog escrito en ${LANGUAGE[draft.lang]} contra las reglas de estilo del sitio. Solo señalas lo que de verdad incumple una regla; si todo está bien, devuelves la lista vacía.`,
    'Cada hallazgo dice la línea (el número antes de "|"), el id de la regla, la cita exacta y una sugerencia concreta en el idioma del borrador.',
    'Reglas:',
    styleRulesText(),
  ].join('\n')
  const schema = {
    type: 'OBJECT',
    properties: {
      hallazgos: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: { linea: { type: 'INTEGER' }, regla: { type: 'STRING', enum: styleRules.map((rule) => rule.id) }, cita: { type: 'STRING' }, sugerencia: { type: 'STRING' } },
          required: ['linea', 'regla', 'cita', 'sugerencia'],
        },
      },
    },
    required: ['hallazgos'],
  }
  const result = await json(key, system, `Título: ${draft.title}\nDescripción: ${draft.description}\n\n${numbered}`, schema, reviewSchemaFor(lineCount(draft.body)), fetcher)
  return result.hallazgos.sort((a, b) => a.linea - b.linea)
}

const metaSchema = z.object({
  description: z.string().trim().min(1).max(320),
  tags: z.array(z.string().trim().min(1).max(60)).min(1).max(6),
  alts: z.array(z.object({ src: z.string(), alt: z.string().trim().max(200) })).max(20),
})

export type MetaSuggestion = z.infer<typeof metaSchema>

export async function suggestMeta(key: string, draft: DraftText, fetcher: typeof fetch = fetch): Promise<MetaSuggestion> {
  const images = bodyImages(draft.body)
  const system = [
    `Propones metadatos para un post del blog en ${LANGUAGE[draft.lang]}: una descripción de una o dos frases (máximo 300 caracteres) que diga de qué trata sin exagerar, de 3 a 6 etiquetas cortas en minúscula, y un texto alternativo para cada imagen según lo que el texto dice de ella.`,
    'No ves las imágenes: deduce el texto alternativo del nombre del archivo, del texto que la rodea y del tema del post. Nunca lo dejes vacío; si de verdad no hay cómo saberlo, describe lo más probable de forma general.',
    'Reglas de estilo:',
    styleRulesText(),
  ].join('\n')
  const schema = {
    type: 'OBJECT',
    properties: {
      description: { type: 'STRING' },
      tags: { type: 'ARRAY', items: { type: 'STRING' } },
      alts: { type: 'ARRAY', items: { type: 'OBJECT', properties: { src: { type: 'STRING' }, alt: { type: 'STRING' } }, required: ['src', 'alt'] } },
    },
    required: ['description', 'tags', 'alts'],
  }
  const prompt = `Título: ${draft.title}\nImágenes: ${JSON.stringify(images.map((image) => ({ src: image.src, altActual: image.alt })))}\n\n${draft.body.slice(0, 40_000)}`
  const result = await json(key, system, prompt, schema, metaSchema, fetcher)
  const known = new Set(images.map((image) => image.src))
  return { ...result, alts: result.alts.filter((item) => known.has(item.src) && item.alt.trim() !== '') }
}

const spamSchema = z.object({ puntajes: z.array(z.object({ i: z.number().int().min(0), spam: z.number().min(0).max(1), motivo: z.string().trim().max(160) })) })

export type SpamScore = { id: string; spam: number; why: string }

export async function rankSpam(key: string, comments: ReadonlyArray<{ id: string; text: string }>, fetcher: typeof fetch = fetch): Promise<SpamScore[]> {
  if (comments.length === 0) return []
  const system =
    'Calificas la probabilidad de que cada comentario de un blog técnico sea spam (publicidad, enlaces sospechosos, texto genérico que no habla del post, estafas) de 0 a 1, con un motivo corto en español. Un comentario corto pero sincero no es spam.'
  const schema = {
    type: 'OBJECT',
    properties: {
      puntajes: { type: 'ARRAY', items: { type: 'OBJECT', properties: { i: { type: 'INTEGER' }, spam: { type: 'NUMBER' }, motivo: { type: 'STRING' } }, required: ['i', 'spam', 'motivo'] } },
    },
    required: ['puntajes'],
  }
  const prompt = JSON.stringify(comments.map((comment, i) => ({ i, texto: comment.text.slice(0, 1500) })))
  const result = await json(key, system, prompt, schema, spamSchema, fetcher)
  const scores = new Map(result.puntajes.map((item) => [item.i, item]))
  return comments
    .map((comment, i) => ({ id: comment.id, spam: scores.get(i)?.spam ?? 0, why: scores.get(i)?.motivo ?? '' }))
    .sort((a, b) => b.spam - a.spam)
}

export function coverPrompt(draft: Pick<DraftText, 'title' | 'tags'>): string {
  return [
    'A blog cover in the style of the site CHERCED-WORLD: a dark, almost black background with a faint grid,',
    'a glowing green (#25ED9E) abstract technical illustration about the topic, glass panels with soft highlights,',
    `inspired by the post "${draft.title}" (topics: ${draft.tags.join(', ') || 'software'}).`,
    'No text, no letters, no logos, no people. Wide 16:9 composition.',
  ].join(' ')
}

export async function generateCover(key: string, draft: Pick<DraftText, 'title' | 'tags'>, fetcher: typeof fetch = fetch): Promise<{ mimeType: string; data: string }> {
  const response = await fetcher(`${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_MODELS.image)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: coverPrompt(draft) }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } },
    }),
    signal: AbortSignal.timeout(55_000),
    cache: 'no-store',
  })
  if (!response.ok) throw new GeminiError(response.status, await googleReason(response))
  const data = (await response.json().catch(() => null)) as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }> } | null
  const inline = data?.candidates?.[0]?.content?.parts?.find((part) => typeof part.inlineData?.data === 'string')?.inlineData
  if (!inline?.data) throw new GeminiError(502, 'sin imagen')
  return { mimeType: inline.mimeType ?? 'image/png', data: inline.data }
}

export function simulatedTranslation(draft: DraftText): Translation {
  const target = other(draft.lang)
  const mark = target === 'en' ? '[EN, simulated]' : '[ES, simulado]'
  return { lang: target, title: `${mark} ${draft.title}`.slice(0, 180), description: draft.description, tags: draft.tags, body: draft.body, issues: [] }
}

export function simulatedReview(draft: DraftText): ReviewFinding[] {
  const lines = draft.body.split('\n')
  const at = lines.findIndex((line) => /\b(revolucionari\w*|increíble|de clase mundial|amazing|world-class|revolutionary)\b/i.test(line))
  if (at === -1) return []
  return [{ linea: at + 1, regla: 'E-07', cita: lines[at]!.trim().slice(0, 200), sugerencia: 'Cambia el superlativo por el hecho que lo sostiene.' }]
}

export function simulatedMeta(draft: DraftText): MetaSuggestion {
  const firstParagraph = draft.body.split(/\n\s*\n/).find((part) => part.trim() && !part.trim().startsWith('#')) ?? draft.title
  return {
    description: firstParagraph.replace(/\s+/g, ' ').trim().slice(0, 300),
    tags: draft.tags.length ? draft.tags.slice(0, 6) : ['blog'],
    alts: bodyImages(draft.body).map((image) => ({ src: image.src, alt: image.alt || draft.title })),
  }
}

export function simulatedSpam(comments: ReadonlyArray<{ id: string; text: string }>): SpamScore[] {
  return comments
    .map((comment) => {
      const links = (comment.text.match(/https?:\/\//g) ?? []).length
      const spam = Math.min(1, links * 0.35 + (/(casino|crypto|bitcoin|viagra|seo|backlink|promo)/i.test(comment.text) ? 0.6 : 0))
      return { id: comment.id, spam, why: spam > 0 ? 'Enlaces o palabras típicas de spam (simulador local).' : 'Sin señales de spam (simulador local).' }
    })
    .sort((a, b) => b.spam - a.spam)
}
