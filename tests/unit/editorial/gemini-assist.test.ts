import { describe, expect, it } from 'vitest'
import { styleRules } from '@/content/style-rules'
import { coverPrompt, rankSpam, reviewSchemaFor, simulatedMeta, simulatedReview, simulatedSpam, simulatedTranslation, suggestMeta, translateDraft } from '@/lib/ai/editorial/assist'
import { bodyImages, compareShape, markdownShape, replaceAlt } from '@/lib/ai/editorial/check'

const BODY = ['# Título', '', 'Texto con [enlace](https://a.b/c) y `código`.', '', '![Diagrama viejo](/img/a.png)', '', '```ts', 'const x = 1', '```'].join('\n')

const draft = { lang: 'es' as const, title: 'Un post', description: 'Algo', body: BODY, tags: ['pruebas'] }

const gemini = (value: unknown, seen?: string[]) =>
  (async (_url: unknown, init: RequestInit) => {
    seen?.push(String(init.body))
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] }))
  }) as unknown as typeof fetch

describe('el panel con Gemini (027)', () => {
  it('P-2701: las reglas de estilo viven en un solo archivo con ids únicos', () => {
    expect(new Set(styleRules.map((rule) => rule.id)).size).toBe(styleRules.length)
    expect(styleRules.length).toBeGreaterThanOrEqual(10)
  })

  it('FR-2703: la traducción conserva el Markdown y avisa si cambia la estructura', async () => {
    expect(markdownShape(BODY)).toEqual({ fences: 2, headings: 1, links: ['https://a.b/c'], images: ['/img/a.png'], inlineCode: 1 })
    const good = BODY.replace('Texto con', 'Text with').replace('Diagrama viejo', 'Old diagram').replace('# Título', '# Title')
    expect(compareShape(BODY, good)).toEqual([])
    expect(compareShape(BODY, good.replace('https://a.b/c', 'https://otro'))).toEqual(['links'])
    expect(compareShape(BODY, good.replace('```ts\nconst x = 1\n```', ''))).toEqual(['fences'])
    const translated = await translateDraft('k', draft, gemini({ title: 'A post', description: 'Something', tags: ['testing'], body: good }))
    expect(translated.lang).toBe('en')
    expect(translated.issues).toEqual([])
    expect(simulatedTranslation(draft).title).toMatch(/^\[EN, simulated\]/)
  })

  it('la revisión señala líneas que existen y reglas del archivo', () => {
    const schema = reviewSchemaFor(9)
    expect(schema.safeParse({ hallazgos: [{ linea: 3, regla: 'E-07', cita: 'x', sugerencia: 'y' }] }).success).toBe(true)
    expect(schema.safeParse({ hallazgos: [{ linea: 99, regla: 'E-07', cita: 'x', sugerencia: 'y' }] }).success).toBe(false)
    expect(schema.safeParse({ hallazgos: [{ linea: 3, regla: 'Z-99', cita: 'x', sugerencia: 'y' }] }).success).toBe(false)
    expect(simulatedReview({ ...draft, body: 'Hola\nUn resultado increíble' })).toEqual([expect.objectContaining({ linea: 2, regla: 'E-07' })])
  })

  it('propone alt para las imágenes y lo aplica sin tocar lo demás', () => {
    expect(bodyImages(BODY)).toEqual([{ src: '/img/a.png', alt: 'Diagrama viejo', line: 5 }])
    expect(replaceAlt(BODY, '/img/a.png', 'Capas de [Synergos]')).toContain('![Capas de Synergos](/img/a.png)')
    expect(simulatedMeta(draft).alts).toEqual([{ src: '/img/a.png', alt: 'Diagrama viejo' }])
  })

  it('FR-2704: al ordenar spam solo viaja el texto del comentario', async () => {
    const seen: string[] = []
    const scores = await rankSpam(
      'k',
      [
        { id: 'c1', text: 'Muy buen post' },
        { id: 'c2', text: 'Compra backlinks https://x.y' },
      ],
      gemini({ puntajes: [{ i: 0, spam: 0.05, motivo: 'sincero' }, { i: 1, spam: 0.97, motivo: 'publicidad' }] }, seen),
    )
    expect(scores.map((score) => score.id)).toEqual(['c2', 'c1'])
    expect(seen[0]).not.toMatch(/c1|c2|@/)
    expect(simulatedSpam([{ id: 'a', text: 'hola' }, { id: 'b', text: 'casino https://x' }])[0]!.id).toBe('b')
    expect(coverPrompt({ title: 'Gates', tags: ['pruebas'] })).toMatch(/No text/)
  })

  it('si la respuesta no valida, reintenta una vez; y nunca propone un alt vacío (prueba real del 2026-11-26)', async () => {
    let calls = 0
    const flaky = (async () => {
      calls += 1
      const value = calls === 1 ? { title: '' } : { title: 'A post', description: 'x', tags: [], body: BODY }
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] }))
    }) as unknown as typeof fetch
    expect((await translateDraft('k', draft, flaky)).title).toBe('A post')
    expect(calls).toBe(2)
    const meta = await suggestMeta('k', draft, gemini({ description: 'Algo', tags: ['a'], alts: [{ src: '/img/a.png', alt: '  ' }] }))
    expect(meta.alts).toEqual([])
  })
})
