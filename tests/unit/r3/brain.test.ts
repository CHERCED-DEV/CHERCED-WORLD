import { describe, expect, it } from 'vitest'
import {
  BAR_CELLS,
  blockBar,
  brainData,
  decodeFrame,
  neuronGeometry,
  projectsForSkills,
  SOURCE_ORDER,
  techKey,
} from '@/components/site/about/brain'
import { rainActive, rainAlphabet, RAIN_FPS, RAIN_FRAME_MS, shouldDraw } from '@/components/site/about/rain'
import type { Project } from '@/content/types'
import { getProjects, getSite } from '@/lib/content'

const { about } = getSite()
const projects = getProjects()
const es = brainData(about, projects, 'es', 'Actualidad')
const en = brainData(about, projects, 'en', 'Present')

describe('lóbulos del mapa cerebral (E-03)', () => {
  it('son seis y cubren todas las skills y los 2 idiomas, cada una una sola vez', () => {
    expect(es.lobes.map((lobe) => lobe.id)).toEqual(['frontend', 'architecture', 'backend-cloud', 'applied-ai', 'practices', 'business'])
    const ids = es.lobes.flatMap((lobe) => lobe.skills.map((skill) => skill.id))
    expect(new Set(ids).size).toBe(ids.length)
    expect([...ids].sort()).toEqual([...about.skills.tech.map((tech) => tech.id), ...about.languages.map((language) => language.id)].sort())
  })

  it('no inventa skills ni cambia niveles', () => {
    for (const lobe of es.lobes) {
      for (const skill of lobe.skills) {
        const tech = about.skills.tech.find((item) => item.id === skill.id)
        const language = about.languages.find((item) => item.id === skill.id)
        expect(tech ?? language, skill.id).toBeDefined()
        expect(skill.level).toBe((tech ?? language)!.progress)
        if (tech?.label) expect(skill.name).toBe(tech.label.es)
        if (tech?.used) expect(skill.used).toBe(tech.used.es)
      }
    }
  })

  it('las fuentes son empleos, el caso Legal workspace, cursos y estudios, con título y detalle del contenido', () => {
    expect(SOURCE_ORDER).toEqual(['sistecredito', 'flyr', 'newshore', 'synergos', 'squadra', 'legalWorkspace', 'platziMaster', 'architecture', 'fullStackJs', 'nextjs', 'unad', 'eam'])
    expect(es.sources.map((source) => source.label)).toEqual([
      'Sistecrédito',
      'FLYR',
      'Newshore',
      'Synergos',
      'Squadra Arquitectura',
      'Espacio de trabajo legal',
      'Platzi Master',
      'Fundamentos de Arquitectura',
      'Full Stack JS',
      'Next.js',
      'UNAD',
      'EAM',
    ])
    for (const source of [...es.sources, ...en.sources]) {
      expect(source.title.length, source.id).toBeGreaterThan(3)
      if (source.id === 'legalWorkspace') expect(source.detail).toBeNull()
      else expect(source.detail!.length, source.id).toBeGreaterThan(10)
      expect(source.detail ?? '', source.id).not.toMatch(/\b(700|1[.,]000|90\s?%)/)
    }
    for (const lobe of es.lobes) for (const id of lobe.sources) expect(SOURCE_ORDER, `${lobe.id} → ${id}`).toContain(id)
  })

  it('los nombres de los lóbulos están en ambos idiomas', () => {
    expect(es.lobes.map((lobe) => lobe.name)).toEqual(['Frontend', 'Arquitectura', 'Backend y nube', 'IA aplicada', 'Prácticas de ingeniería', 'Idiomas y negocio'])
    expect(en.lobes.map((lobe) => lobe.name)).toEqual(['Frontend', 'Architecture', 'Backend & cloud', 'Applied AI', 'Engineering practices', 'Languages & business'])
  })
})

describe('corrección de skills (T229)', () => {
  const RESTORED = ['REACT', 'NEXT.JS', 'NODE.JS', 'MONGODB', 'FIGMA']
  const SKILLS_2023 = ['ANGULAR', 'TYPESCRIPT', 'JAVASCRIPT', 'HTML5', 'CSS', 'SASS', 'GIT', 'AZURE', 'REACT', 'NEXT.JS', 'NODE.JS', 'MONGODB', 'FIGMA']
  const SKILLS_001 = [
    'angular', 'typescript', 'dotnet', 'csharp', 'micro-frontends', 'native-federation', 'azure', 'umbraco',
    'spec-driven-development', 'ai-coding-agents', 'javascript', 'html5', 'css', 'sass', 'git',
  ]
  const names = es.lobes.flatMap((lobe) => lobe.skills.map((skill) => skill.name))

  it('ningún skill de 2023 ni de la 001 se pierde, y vuelven React, Next.js, Node.js, MongoDB y Figma', () => {
    for (const name of [...RESTORED, ...SKILLS_2023]) expect(names.some((item) => item.toUpperCase().startsWith(name)), name).toBe(true)
    const ids = new Set(es.lobes.flatMap((lobe) => lobe.skills.map((skill) => skill.id)))
    for (const id of SKILLS_001) expect(ids.has(id), id).toBe(true)
  })

  it('el mapa tiene seis lóbulos: Oficio se parte en Prácticas de ingeniería e Idiomas y negocio', () => {
    expect(es.lobes).toHaveLength(6)
    expect(es.lobes.map((lobe) => lobe.id)).not.toContain('craft')
    const practices = es.lobes.find((lobe) => lobe.id === 'practices')!
    const business = es.lobes.find((lobe) => lobe.id === 'business')!
    expect(practices.skills.map((skill) => skill.id)).toEqual(['git', 'testing', 'ci-cd', 'code-review', 'docs-as-code', 'agile'])
    expect(business.skills.map((skill) => skill.name)).toEqual(['ESPAÑOL', 'INGLÉS', 'DEL NEGOCIO A LA ARQUITECTURA', 'COMUNICACIÓN CON STAKEHOLDERS', 'PENSAMIENTO DE PRODUCTO'])
    expect(en.lobes.find((lobe) => lobe.id === 'business')!.skills.map((skill) => skill.name)).toEqual([
      'SPANISH', 'ENGLISH', 'BUSINESS → ARCHITECTURE', 'STAKEHOLDER COMMUNICATION', 'PRODUCT THINKING',
    ])
    expect(es.lobes.find((lobe) => lobe.id === 'architecture')!.skills).toHaveLength(16)
  })

  it('los chips de años salen del contenido y se traducen', () => {
    const used = (lang: typeof es, id: string) => lang.lobes.flatMap((lobe) => lobe.skills).find((skill) => skill.id === id)?.used
    expect(used(es, 'react')).toBe('2022–2023 · 2026')
    expect(used(es, 'angular')).toBe('2022–hoy')
    expect(used(en, 'angular')).toBe('2022–now')
    expect(used(es, 'mongodb')).toBe('2022–2023')
    expect(used(es, 'solid')).toBeUndefined()
  })

  it('ningún lóbulo queda con la lista de proyectos vacía y la fuente Legal workspace va con su nombre publicado', () => {
    for (const lobe of [...es.lobes, ...en.lobes]) expect(lobe.projects.length, lobe.id).toBeGreaterThan(0)
    expect(es.lobes.find((lobe) => lobe.id === 'applied-ai')!.sources).toContain('legalWorkspace')
    expect(JSON.stringify(es.sources)).not.toContain('legal-workspace')
  })

  it('"Mis habilidades, en palabras" trae el texto de T229 para Arquitectura e Idiomas y negocio, el de la 004 para tres lóbulos y nada para Prácticas (FR-434, P-424)', () => {
    expect(es.lobes.filter((lobe) => lobe.words).map((lobe) => lobe.id)).toEqual(['frontend', 'architecture', 'backend-cloud', 'applied-ai', 'business'])
    expect(es.lobes.find((lobe) => lobe.id === 'architecture')!.words).toMatch(/^Diseño con Clean Architecture, SOLID y patrones de diseño/)
    expect(en.lobes.find((lobe) => lobe.id === 'business')!.words).toMatch(/^Before coding, I was a business administrator/)
    expect(es.lobes.find((lobe) => lobe.id === 'frontend')!.words).toMatch(/^Angular es mi casa desde 2022\./)
    expect(es.lobes.find((lobe) => lobe.id === 'practices')!.words).toBeUndefined()
  })
})

describe('cruce de lóbulo a proyectos', () => {
  const project = (id: string, technologies: string[], order = Number(id)): Project =>
    ({ id, title: `P${id}`, technologies, order }) as unknown as Project

  it('normaliza nombres de tecnología', () => {
    expect(techKey('.NET')).toBe('NET')
    expect(techKey('MICRO-FRONTENDS')).toBe('MICROFRONTENDS')
    expect(techKey('C#')).toBe('C#')
    expect(techKey('AI coding agents')).toBe('AICODINGAGENTS')
  })

  it('cruza por tecnología, con alias para HTML5 y Spec Kit, en el orden del portafolio', () => {
    const list = [project('3', ['HTML', 'CSS']), project('1', ['SPEC KIT']), project('2', ['PYTHON'])]
    expect(projectsForSkills([{ id: 'html5', name: 'HTML5' }], list)).toEqual([{ id: '3', title: 'P3' }])
    expect(projectsForSkills([{ id: 'spec-driven-development', name: 'SPEC-DRIVEN DEVELOPMENT' }], list)).toEqual([{ id: '1', title: 'P1' }])
    expect(projectsForSkills([{ id: 'git', name: 'GIT' }], list)).toEqual([])
  })

  it('con el contenido real: los proyectos de cada lóbulo son los de la tabla de T229', () => {
    const titles = (id: string) => es.lobes.find((lobe) => lobe.id === id)!.projects.map((item) => item.title)
    expect(titles('backend-cloud')).toContain('Synergos')
    expect(titles('architecture')).toEqual(expect.arrayContaining(['CHERCED-WORLD 2026', 'Synergos']))
    expect(titles('applied-ai')).toEqual(['CHERCED-WORLD 2026', 'Synergos'])
    expect(titles('backend-cloud')).toEqual(['Synergos', 'CENTRIBAL'])
    expect(titles('practices')).toEqual(['Synergos', 'CHERCED-WORLD 2026'])
    expect(titles('business')).toEqual(['Synergos'])
    expect(titles('frontend').length).toBeGreaterThan(5)
    expect(titles('frontend')).toEqual(expect.arrayContaining(['Synergos', 'CHERCED-WORLD 2026']))
    for (const lobe of es.lobes.filter((item) => !about.skills.lobes!.find((raw) => raw.id === item.id)!.projects)) {
      for (const item of lobe.projects) {
        const real = projects.find((candidate) => candidate.id === item.id)!
        const keys = new Set(real.technologies.map(techKey))
        const skillKeys = lobe.skills.flatMap((skill) => [techKey(skill.name), ...(skill.id === 'html5' ? ['HTML'] : []), ...(skill.id === 'spec-driven-development' ? ['SPECKIT'] : [])])
        expect(skillKeys.some((key) => keys.has(key)), `${lobe.id} → ${real.title}`).toBe(true)
      }
    }
  })
})

describe('dibujo y terminal', () => {
  it('cada neurona crece con el nivel', () => {
    const geometry = neuronGeometry(0, [60, 92])
    expect(geometry.neurons[1]!.r).toBeGreaterThan(geometry.neurons[0]!.r)
    expect(geometry.synapse.startsWith('M')).toBe(true)
  })

  it('la barra de bloques tiene siempre el mismo ancho', () => {
    for (const level of [0, 60, 92, 100, 140]) {
      const bar = blockBar(level)
      expect(bar.on.length + bar.off.length).toBe(BAR_CELLS)
    }
    expect(blockBar(100).off).toBe('')
    expect(blockBar(50).on.length).toBe(BAR_CELLS / 2)
  })

  it('el título se descifra desde glifos y termina exacto', () => {
    const text = 'BACKEND Y NUBE'
    expect(decodeFrame(text, 14, 14)).toBe(text)
    const middle = decodeFrame(text, 7, 14, () => 0)
    expect(middle.length).toBe(text.length)
    expect(middle.slice(0, 6)).toBe('BACKEN')
    expect(middle[7]).toBe(' ')
  })
})

describe('lluvia de código', () => {
  it('dibuja a 20 fps como máximo', () => {
    expect(RAIN_FPS).toBe(20)
    expect(shouldDraw(1000, 1000 - RAIN_FRAME_MS + 5)).toBe(false)
    expect(shouldDraw(1000, 1000 - RAIN_FRAME_MS)).toBe(true)
  })

  it('solo corre visible, en pantalla y sin movimiento reducido', () => {
    const base = { running: true, visible: true, inView: true, reduced: false }
    expect(rainActive(base)).toBe(true)
    expect(rainActive({ ...base, visible: false })).toBe(false)
    expect(rainActive({ ...base, inView: false })).toBe(false)
    expect(rainActive({ ...base, reduced: true })).toBe(false)
    expect(rainActive({ ...base, running: false })).toBe(false)
  })

  it('mezcla katakana, dígitos y los nombres de las skills', () => {
    const alphabet = rainAlphabet(['RAG'])
    expect(alphabet).toContain('ア')
    expect(alphabet).toContain('7')
    expect(alphabet).toContain('R')
  })
})
