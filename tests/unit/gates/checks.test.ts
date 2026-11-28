import * as cotejo from 'cotejo-core'
import { describe, expect, it } from 'vitest'
import { runChecks, unitlessPerformanceNumbers } from '@/lib/ai/gates/checks'
import { specToMarkdown } from '@/lib/ai/gates/markdown'
import type { SpecBreve } from '@/lib/ai/gates/schema'
import { SPEC } from './fixtures'

const EN: SpecBreve = {
  ...SPEC,
  title: 'Contact form with attachments',
  problem: 'People who write to the studio cannot send files with their message.',
  includes: ['A form with name, email, message and attachments.'],
  excludes: ['Live chat.'],
  requirements: [
    { id: 'R-1', text: 'The form accepts up to 3 attachments of 5 MB or less each.' },
    { id: 'R-2', text: 'On submit, the studio gets an email with the message.' },
  ],
  criteria: [
    { id: 'C-1', covers: ['R-1'], given: 'a 6 MB attachment', when: 'it is sent', then: 'the form rejects it' },
    { id: 'C-2', covers: ['R-2'], given: 'a valid message', when: 'it is sent', then: 'the studio gets the email' },
  ],
  questions: [{ id: 'Q-1', question: 'How long are attachments kept?', byDefault: '30 days.' }],
}

describe('chequeos deterministas con el núcleo de Cotejo (FR-4603)', () => {
  it('la spec breve sale en el formato del perfil breve, que Cotejo reconoce', () => {
    const markdown = specToMarkdown(SPEC, 'es')
    expect(markdown).toContain('## No incluye')
    expect(markdown).toContain('- **C-1** (cubre R-1): Dado un adjunto de 6 MB, cuando la persona lo envía, entonces el formulario lo rechaza y dice que el máximo es 5 MB.')
    expect(markdown).toContain('- **Q-1**: ¿Cuánto tiempo se guardan los adjuntos? Por defecto: Se borran a los 30 días.')
    expect(cotejo.analyze({ text: markdown, path: 'spec.md', profile: 'breve', lang: 'es' }).profile).toBe('breve')
    expect(specToMarkdown(EN, 'en')).toContain('- **C-1** (covers R-1): Given a 6 MB attachment, when it is sent, then the form rejects it.')
  })

  it.each([
    ['es', SPEC],
    ['en', EN],
  ] as const)('%s: una spec limpia pasa sin fallos, con costo cero', (lang, spec) => {
    const result = runChecks(spec, lang, cotejo)
    expect(result.failures).toEqual([])
    expect(result.model).toBe(`cotejo-core ${cotejo.CORE_VERSION} · breve`)
  })

  it('un criterio que cubre un requisito que no existe es un fallo bloqueante en esa línea, con la regla de Cotejo y la propia', () => {
    const spec: SpecBreve = { ...SPEC, criteria: [...SPEC.criteria, { id: 'C-3', covers: ['R-7'], given: 'un mensaje', when: 'se envía', then: 'llega' }] }
    const result = runChecks(spec, 'es', cotejo)
    const rules = result.failures.filter((item) => item.where === 'C-3').map((item) => item.rule)
    expect(rules).toEqual(expect.arrayContaining(['coverage.unknown-requirement', 'criterio-sin-requisito']))
    expect(result.failures.every((item) => item.gravity === 'bloqueante')).toBe(true)
  })

  it('un número de rendimiento sin unidad es un fallo propio; con unidad, no', () => {
    const spec: SpecBreve = { ...SPEC, requirements: [...SPEC.requirements, { id: 'R-3', text: 'El formulario responde en menos de 2.' }] }
    const failures = runChecks(spec, 'es', cotejo).failures.filter((item) => item.rule === 'rendimiento-sin-unidad')
    expect(failures.map((item) => [item.where, item.problem])).toEqual([['R-3', 'Habla de tiempo o rendimiento con números sin unidad: 2.']])
    expect(unitlessPerformanceNumbers('El formulario responde en menos de 2 s.')).toEqual([])
    expect(unitlessPerformanceNumbers('La página carga en 300 ms con 50 usuarios simultáneos.')).toEqual([])
    expect(unitlessPerformanceNumbers('The board handles 500 concurrent and loads within 3.')).toEqual(['500', '3'])
    expect(unitlessPerformanceNumbers('El p95 de respuesta es 300.')).toEqual(['300'])
    expect(unitlessPerformanceNumbers('El formulario acepta hasta 3 adjuntos de R-2.')).toEqual([])
    expect(unitlessPerformanceNumbers('Una cita el martes a las 10:30.')).toEqual([])
  })

  it('las advertencias de Cotejo entran como menores y no detienen nada', () => {
    const spec: SpecBreve = { ...SPEC, requirements: [...SPEC.requirements, { id: 'R-3', text: 'El estudio responde de forma adecuada.' }] }
    const result = runChecks(spec, 'es', cotejo)
    expect(result.failures).toEqual([])
    expect(result.warnings.some((item) => item.where === 'R-3' && item.gravity === 'menor')).toBe(true)
  })

  it('SC-4606: 50 ms o menos por spec breve, ya en caliente', () => {
    runChecks(SPEC, 'es', cotejo)
    const times = Array.from({ length: 5 }, () => runChecks(SPEC, 'es', cotejo).ms)
    expect(Math.min(...times)).toBeLessThanOrEqual(50)
  })
})
