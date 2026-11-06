import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { formatFact, synergosFacts } from '@/content/synergos'
import { showcaseTasks, showcaseVerticals, synergosShowcase, type ShowcaseLineState, type ShowcaseMilestoneState } from '@/content/synergos-showcase'
import { mentionsEmployer, personalData, strings } from '../../e2e/integration/support/scan'

const SOURCE = readFileSync(join(process.cwd(), 'specs', '009-synergos-showcase', 'fuente-publica.md'), 'utf8')

const LINE_STATE: Record<string, ShowcaseLineState> = { activa: 'active', cerrada: 'closed', 'en pausa': 'paused' }

const MILESTONE_STATE: Record<string, ShowcaseMilestoneState> = { hecho: 'done', 'en curso': 'doing', pendiente: 'todo' }

function rows(section: string): string[][] {
  const start = SOURCE.indexOf(section)
  const end = SOURCE.indexOf('\n## ', start + section.length)
  return SOURCE.slice(start, end < 0 ? undefined : end)
    .split('\n')
    .filter((line) => line.startsWith('|') && !/^\|\s*-/.test(line))
    .slice(1)
    .map((line) =>
      line
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim()),
    )
}

const sourceLines = rows('## Las 14 líneas').map(([id = '', name = '', does = '', state = '', tasks = '']) => {
  const [done, total] = tasks.split('/').map((part) => Number(part.trim()))
  return { id, name, does, state: LINE_STATE[state], done, total }
})

const sourceMilestones = rows('## El MVP').map(([text = '', state = '']) => ({ text, state: MILESTONE_STATE[state] }))

const { lines, milestones } = synergosShowcase

describe('las 14 líneas salen de la fuente pública (FR-904)', () => {
  it('son 14, en el orden de la fuente, con nombre, qué hacen, estado y tareas idénticos en ES', () => {
    expect(lines).toHaveLength(14)
    expect(sourceLines).toHaveLength(14)
    expect(lines.map((line) => ({ id: line.id, name: line.name.es, does: line.does.es, state: line.state, done: line.done, total: line.total }))).toEqual(sourceLines)
  })

  it('los ids no se repiten y nunca hay más tareas hechas que totales', () => {
    expect(new Set(lines.map((line) => line.id)).size).toBe(lines.length)
    for (const line of lines) {
      expect(line.done, line.id).toBeGreaterThanOrEqual(0)
      expect(line.done, line.id).toBeLessThanOrEqual(line.total)
    }
  })

  it('suman 587 de 709 tareas, como dice la fuente', () => {
    expect(showcaseTasks()).toEqual({ done: 587, total: 709 })
    expect(SOURCE).toContain('587 de 709 tareas cerradas')
  })

  it('cuatro activas, nueve cerradas y una en pausa', () => {
    const count = (state: ShowcaseLineState) => lines.filter((line) => line.state === state).map((line) => line.name.es)
    expect(count('active')).toEqual(['Núcleo', 'Producción', 'Salud', 'Blogs/Social'])
    expect(count('closed')).toHaveLength(9)
    expect(count('paused')).toEqual(['Eventos'])
  })

  it('los verticales son las once líneas de negocio: fuera Núcleo, Producción y el piloto Lego', () => {
    const verticals = showcaseVerticals().map((line) => line.id)
    expect(verticals).toHaveLength(11)
    for (const id of ['001', '002', '014']) expect(verticals, id).not.toContain(id)
    for (const name of ['Alquiler', 'Viajes', 'Gobierno', 'Educación', 'Booking', 'Propiedades', 'Seller']) {
      expect(showcaseVerticals().some((line) => line.name.es.startsWith(name)), name).toBe(true)
    }
  })
})

describe('hitos y cifras (FR-904)', () => {
  it('nueve hitos con el estado de la fuente; el texto de cada uno empieza igual', () => {
    expect(milestones.map((milestone) => milestone.state)).toEqual(sourceMilestones.map((milestone) => milestone.state))
    milestones.forEach((milestone, index) => {
      expect(sourceMilestones[index]?.text.startsWith(milestone.text.es), milestone.id).toBe(true)
    })
    expect(milestones.filter((milestone) => milestone.state === 'done')).toHaveLength(5)
    expect(milestones.filter((milestone) => milestone.state === 'doing')).toHaveLength(2)
    expect(milestones.filter((milestone) => milestone.state === 'todo')).toHaveLength(2)
  })

  it('las cifras coinciden con la fuente y la fecha del conteo es el 5 de noviembre de 2026', () => {
    expect(synergosShowcase.countedAt).toBe('2026-11-05')
    expect(SOURCE).toContain('conteo del 5 de noviembre de 2026')
    expect(SOURCE).toContain(`${synergosShowcase.gates} gates de arquitectura`)
    expect(SOURCE).toContain(`Más de ${formatFact(synergosFacts.testsAtLeast, 'es')} tests automáticos`)
    expect(SOURCE).toContain(`(${formatFact(synergosShowcase.testsCounted, 'es')} en tres suites)`)
    expect(SOURCE).toContain(`Más de ${synergosFacts.adrsAtLeast} ADR escritas`)
    expect(SOURCE).toContain(`${synergosShowcase.backend.api} servicios \`Api\` y ${synergosShowcase.backend.bff} \`Bff\``)
    expect(SOURCE).toContain(`${lines.length} líneas con su spec`)
  })

  it('Sobre mí y la página dicen las mismas cifras de tests y ADR, medidas el mismo día (P-901)', () => {
    expect(synergosFacts.testsAtLeast).toBe(6600)
    expect(synergosFacts.adrsAtLeast).toBe(140)
    expect(synergosFacts.measuredAt).toBe(synergosShowcase.countedAt)
    expect(synergosFacts.pieces).toBe(31)
  })
})

describe('el contenido se puede publicar', () => {
  const texts = strings(synergosShowcase)

  it('cada texto tiene ES y EN, sin vacíos', () => {
    const pairs: Array<{ es: string; en: string }> = []
    const visit = (value: unknown) => {
      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>
        if (typeof record.es === 'string' || typeof record.en === 'string') pairs.push(record as { es: string; en: string })
        else Object.values(record).forEach(visit)
      }
    }
    visit(synergosShowcase)
    expect(pairs.length).toBeGreaterThan(60)
    for (const pair of pairs) {
      expect(typeof pair.es).toBe('string')
      expect(typeof pair.en).toBe('string')
      expect(pair.es.trim(), JSON.stringify(pair)).not.toBe('')
      expect(pair.en.trim(), JSON.stringify(pair)).not.toBe('')
      expect(pair.es.match(/\{\w+\}/g) ?? [], JSON.stringify(pair)).toEqual(pair.en.match(/\{\w+\}/g) ?? [])
    }
  })

  it('no trae datos personales, ni al empleador, ni URLs', () => {
    expect(personalData(texts.join('\n'))).toEqual([])
    expect(texts.filter(mentionsEmployer)).toEqual([])
    expect(texts.filter((text) => /https?:\/\/|www\./i.test(text))).toEqual([])
  })

  it('no nombra proveedores, costos, rutas locales, hashes ni textos legales en borrador', () => {
    const forbidden: Array<[string, RegExp]> = [
      ['proveedor', /\b(aws|azure|gcp|google cloud|cloudflare|vercel|netlify|hetzner|digitalocean|heroku|railway|supabase|stripe|wompi|mercado ?pago|twilio|sendgrid|openai|anthropic)\b/i],
      ['costo', /[$€£]\s?\d|\b(usd|cop|eur)\b|\b(costo|coste|precio|price|pricing|presupuesto|budget|factura|invoice)s?\b/i],
      ['ruta local', /[a-z]:\\|\/users\/|\/home\/|\.worktrees|~\//i],
      ['hash', /\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/i],
      ['borrador legal', /retenci[oó]n|retention/i],
      ['código de compra', /\b(orden|order|compra|purchase)\s*#?\s*[A-Z0-9-]{5,}\b/],
    ]
    const findings = texts.flatMap((text) => forbidden.filter(([, pattern]) => pattern.test(text)).map(([kind]) => `${kind}: ${text}`))
    expect(findings).toEqual([])
  })

  it('las reglas de lo sensible detectan lo que tienen que bloquear', () => {
    const samples = ['Desplegado en Azure', 'cuesta $20', 'C:\\Users\\yo', 'commit 06bfb01', 'retención de la historia clínica']
    const patterns = [/\bazure\b/i, /[$€£]\s?\d/, /[a-z]:\\/i, /\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/i, /retenci[oó]n/i]
    samples.forEach((sample, index) => expect(patterns[index]!.test(sample), sample).toBe(true))
  })
})
