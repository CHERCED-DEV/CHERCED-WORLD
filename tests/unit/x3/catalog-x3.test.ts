import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { x3Demos } from '@/components/ailab/shell/demos/x3-saga'
import { PYODIDE_CORE, PYODIDE_NUMPY, labExperiment } from '@/content/ailab/catalog'

function lines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

describe('las tarjetas de X3 dicen la verdad de lo que hay (T740 a T743)', () => {
  it('X3 registra la demo del simulador de sagas y la de las vitrinas', () => {
    expect(Object.keys(x3Demos).sort()).toEqual(['A4', 'R1'])
    for (const demo of Object.values(x3Demos)) expect(demo).toBeTypeOf('function')
  })

  it.each(['R1', 'A4'] as const)('%s: el fragmento está, tal cual, en el archivo que enlaza', (id) => {
    const code = labExperiment(id).code
    expect(code?.repoPath, id).toMatch(/^lib\/ailab\/(saga|pyodide)\//)
    const file = lines(readFileSync(join(process.cwd(), code!.repoPath!), 'utf8'))
    const snippet = lines(code!.snippet)
    const start = file.indexOf(snippet[0]!)
    expect(start, snippet[0]).toBeGreaterThanOrEqual(0)
    expect(file.slice(start, start + snippet.length)).toEqual(snippet)
  })

  it('R1 no descarga nada y A4 pide Pyodide y numpy, sin descarga por defecto', () => {
    expect(labExperiment('R1').downloads).toEqual([])
    expect(labExperiment('A4').downloads).toEqual([PYODIDE_CORE, PYODIDE_NUMPY])
    expect(labExperiment('A4').downloads.some((download) => download.default)).toBe(false)
  })

  it('el recorrido y las decisiones nombran lo que se construyó', () => {
    const r1 = labExperiment('R1')
    expect(r1.flow.map((step) => step.es).join(' ')).toMatch(/suelta los apartados y cancela la reserva/)
    expect(r1.adrCards.map((card) => card.decision.es)).toContain('El cobro va de último')
    const a4 = labExperiment('A4')
    expect(a4.flow.map((step) => step.es).join(' ')).toMatch(/código que corrió/)
    expect(a4.code?.lang).toBe('python')
    expect(a4.adrCards.map((card) => card.tradeoff.es).join(' ')).toMatch(/pide permiso para cada uno/)
  })
})
