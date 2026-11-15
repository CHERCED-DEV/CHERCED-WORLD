import { describe, expect, it } from 'vitest'
import { CODE_PIECES, codeBlobUrl, codePiece, codeRawUrl } from '@/content/ailab/code-tour'
import { CODE_MAX_LINES, explainCode, fetchCode, numbered, simulateExplanation, validRanges } from '@/lib/ai/code/explain'
import { existsSync } from 'node:fs'

const piece = CODE_PIECES[0]!

describe('recorrido por el código (035)', () => {
  it('FR-3501: solo piezas de la lista, todas archivos que existen en el repo', () => {
    expect(codePiece('live')?.path).toBe('lib/ai/agent/live.ts')
    expect(codePiece('../../.env.local')).toBeUndefined()
    expect(codePiece(42)).toBeUndefined()
    for (const item of CODE_PIECES) expect(existsSync(item.path), item.path).toBe(true)
    expect(codeRawUrl(piece)).toBe(`https://raw.githubusercontent.com/CHERCED-DEV/CHERCED-WORLD/dev/${piece.path}`)
    expect(codeBlobUrl(piece, 10, 20)).toMatch(/#L10-L20$/)
  })

  it('FR-3502: un archivo largo se recorta a 1.500 líneas', async () => {
    const long = Array.from({ length: CODE_MAX_LINES + 20 }, (_, index) => `line ${index}`).join('\n')
    const file = await fetchCode(piece, (async () => new Response(long)) as typeof fetch)
    expect(file.lines).toHaveLength(CODE_MAX_LINES)
    expect(file.truncated).toBe(true)
    expect(numbered(['a', 'b'])).toBe('   1  a\n   2  b')
  })

  it('FR-3503: los rangos de líneas se validan contra el archivo', () => {
    const sections = [
      { from: 5, to: 3, title: 'al revés', explanation: 'x' },
      { from: 10, to: 12, title: 'bien', explanation: 'x' },
      { from: 40, to: 60, title: 'fuera', explanation: 'x' },
      { from: 1, to: 4, title: 'primera', explanation: 'x' },
    ]
    expect(validRanges(sections, 30).map((section) => section.title)).toEqual(['primera', 'bien'])
  })

  it('explica con salida validada y descarta rangos inventados', async () => {
    const lines = Array.from({ length: 20 }, (_, index) => `const x${index} = ${index}`)
    const json = {
      summary: 'Un archivo de prueba.',
      sections: [
        { from: 1, to: 5, title: 'Inicio', explanation: 'Declara variables.' },
        { from: 90, to: 99, title: 'Inventada', explanation: 'No existe.' },
      ],
      decisions: [{ decision: 'Constantes', why: 'Simples', tradeoff: 'Nada' }],
      questions: ['¿Por qué constantes?'],
      answer: 'Porque sí.',
    }
    const fetcher = (async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }] }))) as typeof fetch
    const result = await explainCode({ key: 'k', piece, file: { path: piece.path, lines, truncated: false }, lang: 'es', question: '¿Y?' }, fetcher)
    expect(result.sections.map((section) => section.title)).toEqual(['Inicio'])
    expect(result.answer).toBe('Porque sí.')
    expect(result.simulated).toBe(false)
  })

  it('el simulador arma secciones por cada export, sin llamar a Gemini', () => {
    const lines = ['import x', 'export function a() {', '}', 'export const b = 1']
    const result = simulateExplanation({ path: 'p', lines, truncated: false }, 'es')
    expect(result.sections.map((section) => [section.title, section.from, section.to])).toEqual([
      ['a', 2, 3],
      ['b', 4, 4],
    ])
    expect(result.simulated).toBe(true)
  })
})
