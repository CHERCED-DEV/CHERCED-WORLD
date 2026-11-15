import 'server-only'
import { z } from 'zod'
import { codeRawUrl, type CodePiece } from '@/content/ailab/code-tour'
import { generateJson } from '@/lib/ai/generate'
import type { Locale } from '@/lib/i18n/config'

export const CODE_MODEL = 'gemini-3.8-flash'

export const CODE_MAX_LINES = 1500

export const CODE_QUESTION_MAX = 200

export type CodeSection = { from: number; to: number; title: string; explanation: string }

export type CodeExplanation = {
  summary: string
  sections: CodeSection[]
  decisions: Array<{ decision: string; why: string; tradeoff: string }>
  questions: string[]
  answer: string | null
  simulated: boolean
}

export type CodeFile = { path: string; lines: string[]; truncated: boolean }

export async function fetchCode(piece: CodePiece, fetcher: typeof fetch = fetch): Promise<CodeFile> {
  const response = await fetcher(codeRawUrl(piece), { signal: AbortSignal.timeout(10_000), next: { revalidate: 3600 } } as RequestInit)
  if (!response.ok) throw new Error(`GitHub respondió ${response.status}`)
  const all = (await response.text()).replace(/\r\n/g, '\n').split('\n')
  return { path: piece.path, lines: all.slice(0, CODE_MAX_LINES), truncated: all.length > CODE_MAX_LINES }
}

export function numbered(lines: readonly string[]): string {
  return lines.map((line, index) => `${String(index + 1).padStart(4, ' ')}  ${line}`).join('\n')
}

const reply = z.object({
  summary: z.string().trim().min(1).max(800),
  sections: z
    .array(z.object({ from: z.number().int(), to: z.number().int(), title: z.string().trim().min(1).max(80), explanation: z.string().trim().min(1).max(600) }))
    .max(8),
  decisions: z.array(z.object({ decision: z.string().trim().min(1).max(160), why: z.string().trim().min(1).max(300), tradeoff: z.string().trim().min(1).max(300) })).max(4),
  questions: z.array(z.string().trim().min(1).max(120)).max(4),
  answer: z.string().trim().max(900).nullable().optional(),
})

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    sections: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { from: { type: 'INTEGER' }, to: { type: 'INTEGER' }, title: { type: 'STRING' }, explanation: { type: 'STRING' } }, required: ['from', 'to', 'title', 'explanation'] },
    },
    decisions: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { decision: { type: 'STRING' }, why: { type: 'STRING' }, tradeoff: { type: 'STRING' } }, required: ['decision', 'why', 'tradeoff'] },
    },
    questions: { type: 'ARRAY', items: { type: 'STRING' } },
    answer: { type: 'STRING' },
  },
  required: ['summary', 'sections', 'decisions', 'questions'],
} as const

export function validRanges(sections: readonly CodeSection[], total: number): CodeSection[] {
  return sections
    .filter((section) => section.from >= 1 && section.to >= section.from && section.to <= total)
    .sort((a, b) => a.from - b.from)
}

export async function explainCode(
  input: { key: string; piece: CodePiece; file: CodeFile; lang: Locale; question?: string },
  fetcher: typeof fetch = fetch,
): Promise<CodeExplanation> {
  const language = input.lang === 'es' ? 'español' : 'inglés'
  const ask = input.question ? `\n\nPregunta del visitante: «${input.question}». Respóndela en "answer", con honestidad: si no hay razón documentada, dilo.` : ''
  const result = await generateJson(
    {
      key: input.key,
      model: CODE_MODEL,
      system: `Eres un ingeniero que explica código real del portafolio de Camilo Hernández a un líder técnico. Escribe en ${language}, claro y concreto. Solo usas lo que está en el archivo: no inventes funciones, líneas ni decisiones. Las secciones citan rangos de líneas que existen en el archivo numerado.`,
      prompt: `Archivo ${input.piece.path} (${input.file.lines.length} líneas${input.file.truncated ? ', recortado' : ''}):\n\n${numbered(input.file.lines)}\n\nExplica qué hace, por qué está escrito así y qué decisión de arquitectura refleja. De 3 a 6 secciones con su rango de líneas, hasta 3 decisiones (decisión, por qué, qué se sacrifica) y 3 preguntas que un entrevistador haría.${ask}`,
      schema: SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 2000,
    },
    fetcher,
  )
  const parsed = reply.parse(JSON.parse(result.text || '{}'))
  return {
    summary: parsed.summary,
    sections: validRanges(parsed.sections, input.file.lines.length),
    decisions: parsed.decisions,
    questions: parsed.questions,
    answer: input.question ? (parsed.answer ?? null) : null,
    simulated: false,
  }
}

export function simulateExplanation(file: CodeFile, lang: Locale): CodeExplanation {
  const starts = file.lines.flatMap((line, index) => (/^export (async )?(function|const|class|type) (\w+)/.test(line) ? [index + 1] : []))
  const sections = starts.slice(0, 6).map((from, position) => {
    const to = (starts[position + 1] ?? file.lines.length + 1) - 1
    const name = /^export (?:async )?(?:function|const|class|type) (\w+)/.exec(file.lines[from - 1]!)?.[1] ?? '—'
    return {
      from,
      to: Math.max(from, to),
      title: name,
      explanation: lang === 'es' ? 'Simulador local: aquí Gemini explica qué hace esta parte y por qué.' : 'Local simulator: here Gemini explains what this part does and why.',
    }
  })
  return {
    summary: lang === 'es' ? 'Estás en el simulador: con la clave de Gemini, aquí va la explicación real del archivo.' : 'You are in the simulator: with the Gemini key, the real explanation of the file goes here.',
    sections,
    decisions: [],
    questions: [],
    answer: null,
    simulated: true,
  }
}
