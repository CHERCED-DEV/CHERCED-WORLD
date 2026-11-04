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
  it('son cinco y cubren todas las tecnologías y los 2 idiomas, cada una una sola vez', () => {
    expect(es.lobes.map((lobe) => lobe.id)).toEqual(['frontend', 'architecture', 'backend-cloud', 'applied-ai', 'craft'])
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
      }
    }
  })

  it('las fuentes son las seis de la fila, en orden, con título y detalle del contenido', () => {
    expect(SOURCE_ORDER).toEqual(['platziMaster', 'architecture', 'fullStackJs', 'nextjs', 'unad', 'eam'])
    expect(es.sources.map((source) => source.label)).toEqual(['Platzi Master', 'Fundamentos de Arquitectura', 'Full Stack JS', 'Next.js', 'UNAD', 'EAM'])
    for (const source of [...es.sources, ...en.sources]) {
      expect(source.title.length, source.id).toBeGreaterThan(3)
      expect(source.detail.length, source.id).toBeGreaterThan(10)
    }
    for (const lobe of es.lobes) for (const id of lobe.sources) expect(SOURCE_ORDER, `${lobe.id} → ${id}`).toContain(id)
  })

  it('los nombres de los lóbulos están en ambos idiomas', () => {
    expect(es.lobes.map((lobe) => lobe.name)).toEqual(['Frontend', 'Arquitectura', 'Backend y nube', 'IA aplicada', 'Oficio'])
    expect(en.lobes.map((lobe) => lobe.name)).toEqual(['Frontend', 'Architecture', 'Backend & cloud', 'Applied AI', 'Craft'])
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

  it('con el contenido real: Backend y nube incluye Synergos y Arquitectura incluye CHERCED-WORLD 2026', () => {
    const titles = (id: string) => es.lobes.find((lobe) => lobe.id === id)!.projects.map((item) => item.title)
    expect(titles('backend-cloud')).toContain('Synergos')
    expect(titles('architecture')).toEqual(expect.arrayContaining(['CHERCED-WORLD 2026', 'Synergos']))
    expect(titles('applied-ai')).toEqual(['CHERCED-WORLD 2026'])
    expect(titles('frontend').length).toBeGreaterThan(5)
    for (const lobe of es.lobes) {
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
