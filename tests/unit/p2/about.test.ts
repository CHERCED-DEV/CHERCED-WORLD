import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AboutFigures, type FigureLabels } from '@/components/site/about/AboutFigures'
import { brainData, isAppliedSource, lobeAnchor, lobeFromHash, PRINCIPLES_LOBE, SOURCE_REFS } from '@/components/site/about/brain'
import { aboutFigures, figureDigits, figureText } from '@/components/site/about/figures'
import { lobeWords, site } from '@/content/site'
import { synergosFacts } from '@/content/synergos'
import { getProjects, projectTitle } from '@/lib/content'

const { about } = site
const projects = getProjects()
const lobes = about.skills.lobes ?? []
const es = brainData(about, projects, 'es', 'Actualidad')
const en = brainData(about, projects, 'en', 'Present')

const LABELS: FigureLabels = {
  years: { label: 'años construyendo para la web' },
  pieces: { label: 'piezas desplegables en Synergos' },
  adrs: { label: 'decisiones de arquitectura escritas', note: 'ADRs' },
  tests: { label: 'tests automatizados' },
}

describe('"En cifras" (T431, FR-436)', () => {
  it('trae años, piezas, ADRs y tests, en ese orden, y ninguna de las cifras que salen', () => {
    const figures = aboutFigures(about)
    expect(figures.map((figure) => figure.id)).toEqual(['years', 'pieces', 'adrs', 'tests'])
    expect(figures.map((figure) => figure.value)).toEqual([6, synergosFacts.pieces, synergosFacts.adrsAtLeast, synergosFacts.testsAtLeast])
    expect(figures.map((figure) => figure.plus)).toEqual([false, false, true, true])
  })

  it('C3: los años son los del CV, fijos, sin "+" ni "desde"', () => {
    expect(aboutFigures(about)[0]).toEqual({ id: 'years', value: 6, plus: false })
  })

  it('formatea según el idioma: 6.600+ en ES y 6,600+ en EN', () => {
    const tests = aboutFigures(about).find((figure) => figure.id === 'tests')!
    expect(figureText(tests, 'es')).toBe('6.600+')
    expect(figureText(tests, 'en')).toBe('6,600+')
    expect(figureText({ value: synergosFacts.pieces, plus: false }, 'es')).toBe(String(synergosFacts.pieces))
    expect(figureDigits(synergosFacts.adrsAtLeast, 'en')).toBe(String(synergosFacts.adrsAtLeast))
  })

  it.each([
    ['es', '6.600', '6.600+'],
    ['en', '6,600', '6,600+'],
  ] as const)('%s: el servidor pinta el valor final formateado y el texto completo para lectores', (lang, digits, text) => {
    const html = renderToStaticMarkup(createElement(AboutFigures, { lang, title: 'En cifras', figures: aboutFigures(about), labels: LABELS }))
    expect(html).toContain(`data-cw-figure-value="${synergosFacts.testsAtLeast}">${digits}</span>`)
    expect(html).toContain(`<span class="cw-visually-hidden">${text}</span>`)
    for (const id of ['years', 'pieces', 'adrs', 'tests']) expect(html).toContain(`data-cw-figure="${id}"`)
    for (const id of ['projects', 'technologies', 'airlines']) expect(html).not.toContain(`data-cw-figure="${id}"`)
  })
})

describe('principios bajo Arquitectura (T432, FR-433)', () => {
  it('solo Arquitectura los lleva, con el texto corto de §8.6 y sin porcentaje', () => {
    expect(PRINCIPLES_LOBE).toBe('architecture')
    for (const data of [es, en]) {
      expect(data.lobes.filter((lobe) => lobe.principles).map((lobe) => lobe.id)).toEqual(['architecture'])
    }
    expect(es.lobes.find((lobe) => lobe.id === 'architecture')!.principles).toEqual(about.principles!.map((principle) => principle.short.es))
    expect(en.lobes.find((lobe) => lobe.id === 'architecture')!.principles).toEqual(about.principles!.map((principle) => principle.short.en))
    for (const principle of es.lobes.find((lobe) => lobe.id === 'architecture')!.principles!) expect(principle).not.toMatch(/\d\s?%/)
  })

  it('sin principios en el contenido, no hay fila', () => {
    const data = brainData({ ...about, principles: [] }, projects, 'es', 'Actualidad')
    expect(data.lobes.some((lobe) => lobe.principles)).toBe(false)
  })
})

describe('"Mis habilidades, en palabras" (T433, FR-434, FR-408)', () => {
  it('cada lóbulo usa el párrafo de lobeWords, la misma regla de P0', () => {
    for (const [data, lang] of [
      [es, 'es'],
      [en, 'en'],
    ] as const) {
      for (const lobe of lobes) {
        const expected = lobeWords(lobe)?.[lang]
        expect(data.lobes.find((item) => item.id === lobe.id)!.words, `${lang} ${lobe.id}`).toBe(expected)
      }
    }
  })

  it('cinco lóbulos con párrafo; Prácticas de ingeniería sin bloque mientras siga P-424', () => {
    expect(es.lobes.filter((lobe) => lobe.words).map((lobe) => lobe.id)).toEqual(['frontend', 'architecture', 'backend-cloud', 'applied-ai', 'business'])
    expect(es.lobes.find((lobe) => lobe.id === 'practices')!.words).toBeUndefined()
  })

  it('ningún párrafo repite el texto de 2023 ni trae cifras del empleador', () => {
    const text2023 = [about.skills.description.es, ...about.skills.bullets.map((bullet) => bullet.es)]
    for (const lobe of es.lobes.filter((item) => item.words)) {
      for (const old of text2023) expect(lobe.words).not.toContain(old)
      expect(lobe.words, lobe.id).not.toMatch(/\b\d{2,}\s?(%|\+)|\b(700|1[.,]000)\b/)
    }
  })
})

describe('"dónde lo apliqué" y proyectos de cada lóbulo (T435, FR-432, FR-435)', () => {
  it('parte las fuentes de T229 en aplicadas (empleos y casos) y aprendidas (cursos y estudios), sin perder ninguna', () => {
    for (const lobe of es.lobes) {
      expect([...lobe.applied, ...lobe.learned].sort()).toEqual([...lobe.sources].sort())
      for (const id of lobe.applied) expect(['company', 'case']).toContain(SOURCE_REFS[id]!.kind)
      for (const id of lobe.learned) expect(['education', 'course']).toContain(SOURCE_REFS[id]!.kind)
    }
    expect(isAppliedSource('legalWorkspace')).toBe(true)
    expect(isAppliedSource('platziMaster')).toBe(false)
    expect(isAppliedSource('no-existe')).toBe(false)
  })

  it('cada lóbulo dice dónde se aplicó, y cada referencia existe en la carrera o en los casos', () => {
    const sources = new Map(es.sources.map((source) => [source.id, source]))
    for (const lobe of es.lobes) {
      expect(lobe.applied.length, lobe.id).toBeGreaterThan(0)
      for (const id of lobe.applied) {
        const ref = SOURCE_REFS[id]!
        expect(sources.has(id), `${lobe.id} → ${id}`).toBe(true)
        if (ref.kind === 'company') expect(about.career.some((entry) => ref.match.test(entry.company)), id).toBe(true)
        if (ref.kind === 'case') {
          expect(projects.some((project) => projectTitle(project, 'es') === ref.label.es && projectTitle(project, 'en') === ref.label.en), id).toBe(true)
        }
      }
    }
  })

  it('ningún lóbulo queda con la línea de proyectos vacía y todos los proyectos existen', () => {
    for (const lobe of [...es.lobes, ...en.lobes]) {
      expect(lobe.projects.length, lobe.id).toBeGreaterThan(0)
      for (const project of lobe.projects) expect(projects.some((item) => item.id === project.id), `${lobe.id} → ${project.id}`).toBe(true)
    }
  })
})

describe('ancla de lóbulo (T437, contrato P2 → P6)', () => {
  const ids = lobes.map((lobe) => lobe.id)

  it('la forma es #lobe-<id> con los ids de site.about.skills.lobes', () => {
    expect(ids.map(lobeAnchor)).toEqual(['lobe-frontend', 'lobe-architecture', 'lobe-backend-cloud', 'lobe-applied-ai', 'lobe-practices', 'lobe-business'])
    for (const id of ids) expect(lobeFromHash(`#${lobeAnchor(id)}`, ids)).toBe(id)
  })

  it('ignora anclas que no son de lóbulo, lóbulos que no existen y codificaciones rotas', () => {
    for (const hash of ['', '#', '#scene-knowledge', '#lobe-', '#lobe-craft', '#LOBE-frontend', '#lobe-%E0%A4%A', 'lobe-frontend']) {
      expect(lobeFromHash(hash, ids), hash).toBeNull()
    }
    expect(lobeFromHash('#lobe-applied%2Dai', ids)).toBe('applied-ai')
  })
})
