import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NEW_PIECE, SHOT_SAMPLE_SRC, uiPieces } from '@/content/ailab/ui-pieces'
import { generateJsonBody } from '@/lib/ai/generate'
import { analyzeShot, SHOT_RESPONSE_SCHEMA, shotInstruction } from '@/lib/ai/shot/analyze'
import { SHOT_GRID, shotSchema, shotTree, simulatedShot } from '@/lib/ai/shot/model'

const node = (id: string, padre = '', pieza = 'button') => ({ id, nombre: id, pieza, padre, props: '', caja: { x: 1, y: 1, an: 4, al: 4 } })

const reply = (body: unknown) => (async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(body) }] } }] }))) as unknown as typeof fetch

describe('de captura a componentes (024, A8)', () => {
  it('P-2401: el catálogo usa solo piezas que existen en el repo público', () => {
    expect(uiPieces.length).toBeGreaterThanOrEqual(15)
    for (const piece of uiPieces) expect(existsSync(join(process.cwd(), piece.path)), piece.path).toBe(true)
    expect(new Set(uiPieces.map((piece) => piece.id)).size).toBe(uiPieces.length)
    expect(existsSync(join(process.cwd(), 'public', SHOT_SAMPLE_SRC))).toBe(true)
    expect(shotInstruction('es')).toContain('choice-chips (ChoiceChips, primitiva)')
    expect(JSON.stringify(SHOT_RESPONSE_SCHEMA)).toContain(`"${NEW_PIECE}"`)
  })

  it('FR-2402: el esquema rechaza piezas inventadas, padres rotos, ids repetidos y ciclos, y acomoda las cajas', () => {
    const ok = { resumen: 'x', nodos: [node('a'), node('b', 'a')], huecos: [] }
    expect(shotSchema.safeParse(ok).success).toBe(true)
    expect(shotSchema.safeParse({ ...ok, nodos: [node('a', '', 'MegaBoton')] }).success).toBe(false)
    expect(shotSchema.safeParse({ ...ok, nodos: [node('a', 'zz')] }).success).toBe(false)
    expect(shotSchema.safeParse({ ...ok, nodos: [node('a'), node('a')] }).success).toBe(false)
    expect(shotSchema.safeParse({ ...ok, nodos: [node('a', 'b'), node('b', 'a')] }).success).toBe(false)
    const wide = shotSchema.parse({ ...ok, nodos: [{ ...node('a'), caja: { x: 40, y: -3, an: 99, al: 2.6 } }] })
    expect(wide.nodos[0]!.caja).toEqual({ x: SHOT_GRID - 1, y: 0, an: 1, al: 3 })
  })

  it('arma el árbol por padres', () => {
    const tree = shotTree({ nodos: shotSchema.parse({ resumen: 'x', nodos: [node('a'), node('b', 'a'), node('c')], huecos: [] }).nodos })
    expect(tree.map((item) => [item.id, item.hijos.map((child) => child.id)])).toEqual([
      ['a', ['b']],
      ['c', []],
    ])
  })

  it('el simulador analiza la captura de ejemplo con huecos honestos', () => {
    const sample = simulatedShot('es')
    expect(sample.nodos.some((item) => item.pieza === NEW_PIECE)).toBe(true)
    expect(sample.huecos[0]!.que).toBe('Tabla de datos')
    expect(simulatedShot('en').huecos[0]!.que).toBe('Data table')
  })

  it('manda la imagen a Gemini con visión y reintenta una vez si no valida', async () => {
    const body = generateJsonBody({ key: 'k', model: 'm', system: 's', prompt: 'p', schema: {}, images: [{ mimeType: 'image/jpeg', data: 'AAAA' }] })
    expect(body.contents[0]!.parts[0]).toEqual({ inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } })
    expect(body.contents[0]!.parts[1]).toEqual({ text: 'p' })
    let calls = 0
    const flaky = (async () => {
      calls += 1
      const result = calls === 1 ? { resumen: 'x', nodos: [node('a', 'nadie')], huecos: [] } : { resumen: 'x', nodos: [node('a')], huecos: [] }
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }] }))
    }) as unknown as typeof fetch
    const result = await analyzeShot({ key: 'k', lang: 'es', image: { mimeType: 'image/jpeg', data: 'AAAA' } }, flaky)
    expect(calls).toBe(2)
    expect(result.nodos[0]!.id).toBe('a')
    await expect(analyzeShot({ key: 'k', lang: 'es', image: { mimeType: 'image/jpeg', data: 'AAAA' } }, reply({ nodos: [] }))).rejects.toThrow()
  })
})
