import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import type { CapabilityInput, CapabilityName } from '@/lib/capabilities'
import type { Locale } from '@/lib/i18n/config'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { buildSearchIndex } = await import('@/lib/search/build-index')
const { getDictionary } = await import('@/lib/i18n/server')
const { getProjects, getSite, postIds } = await import('@/lib/content')
const caps = await import('@/lib/capabilities')
const { confidentialityFindings, personalData } = await import('../../e2e/integration/support/scan')

const site = getSite()
const AREAS = (site.about.skills.lobes ?? []).map((lobe) => lobe.id)
const PUBLIC_EMAILS = ['chernandezcediel@gmail.com']
const ORIGIN = 'https://cherced-world.test'
const LEARNING = [/azure ai foundry/i, /semantic kernel/i, /\bRAG\b/, /embeddings/i]

const indexes = { es: await buildSearchIndex('es'), en: await buildSearchIndex('en') }
const descriptions = caps.capabilityDescriptions(await getDictionary('es', 'experience'), await getDictionary('en', 'experience'))

function fakePreferences(lang: Locale = 'es', theme: 'dark' | 'light' = 'dark') {
  return {
    language: vi.fn(() => lang),
    setLanguage: vi.fn(),
    theme: vi.fn(() => theme),
    setTheme: vi.fn(),
  }
}

function registry(preferences: ReturnType<typeof fakePreferences> | null = null) {
  return caps.createCapabilities({
    loadIndex: async (lang) => indexes[lang],
    descriptions,
    areas: AREAS,
    origin: ORIGIN,
    preferences,
  })
}

function tool(name: CapabilityName, preferences: ReturnType<typeof fakePreferences> | null = null) {
  return caps.findCapability(registry(preferences), name)
}

function declared(schema: unknown): unknown {
  return schema
}

function validated(schema: z.ZodType): unknown {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, { io: 'input' }) as Record<string, unknown>
  return rest
}

function equivalent(input: CapabilityInput): boolean {
  return isDeepStrictEqual(declared(input.json), validated(input.zod))
}

const SPEC_DESCRIPTIONS: Record<string, { es: string; en: string }> = {
  search_portfolio: {
    es: 'Busca en los proyectos, posts, experiencia y skills de Camilo Hernández. Devuelve títulos, resúmenes cortos y enlaces.',
    en: "Searches Camilo Hernández's projects, blog posts, experience and skills. Returns titles, short summaries and links.",
  },
  get_project: {
    es: 'Devuelve un caso de estudio: contexto, rol, decisiones, resultado y tecnologías.',
    en: 'Returns a case study: context, role, decisions, result and technologies.',
  },
  list_projects: {
    es: 'Lista los proyectos del portafolio, opcionalmente filtrados por tecnología.',
    en: 'Lists portfolio projects, optionally filtered by technology.',
  },
  get_experience: {
    es: 'Devuelve la experiencia profesional con cargos, empresas y fechas oficiales.',
    en: 'Returns professional experience with official titles, companies and dates.',
  },
  get_skills: {
    es: 'Devuelve las skills por área, con su nivel y sus años de uso.',
    en: 'Returns skills by area, with their level and years of use.',
  },
  list_posts: { es: 'Lista los posts del blog, opcionalmente por etiqueta.', en: 'Lists blog posts, optionally by tag.' },
  get_cv: {
    es: 'Devuelve el CV oficial: el enlace a LinkedIn y los PDF descargables de este sitio, en español y en inglés.',
    en: 'Returns the official CV: the LinkedIn link and the downloadable PDFs on this site, in English and in Spanish.',
  },
  set_preferences: {
    es: 'Cambia el idioma o el tema del sitio para esta visita. Se puede deshacer.',
    en: 'Changes the site language or theme for this visit. It can be undone.',
  },
}

describe('registro de capacidades (E-13, FR-485, FR-487)', () => {
  it('declara las ocho herramientas de la v1, sin draft_contact_message (P-416)', () => {
    expect(registry().map((capability) => capability.name)).toEqual([
      'search_portfolio',
      'get_project',
      'list_projects',
      'get_experience',
      'get_skills',
      'list_posts',
      'get_cv',
      'set_preferences',
    ])
    expect(caps.isCapabilityName('draft_contact_message')).toBe(false)
  })

  it('siete son de lectura y set_preferences solo cambia la vista', () => {
    for (const capability of registry()) {
      expect(capability.effect, capability.name).toBe(capability.name === 'set_preferences' ? 'view' : 'read')
    }
  })

  it('las descripciones son las de contenido.md §25, en ES y EN, sin instrucciones ocultas', () => {
    for (const capability of registry()) {
      expect(capability.description, capability.name).toEqual(SPEC_DESCRIPTIONS[capability.name])
      for (const text of Object.values(capability.description)) {
        expect(text).not.toMatch(/<|>|\{|\}|ignore|ignora|system|instruc/i)
      }
    }
  })

  it('cada herramienta corresponde a algo que ya se hace desde la UI (FR-489b)', () => {
    for (const name of caps.CAPABILITY_NAMES) expect(caps.CAPABILITY_UI[name].trim(), name).not.toBe('')
  })
})

describe('esquema declarado contra esquema validado (FR-488)', () => {
  it('el JSON Schema de cada herramienta es exactamente el que produce su zod', () => {
    const inputs = caps.capabilityInputs(AREAS)
    for (const name of caps.CAPABILITY_NAMES) {
      expect(declared(inputs[name].json), name).toEqual(validated(inputs[name].zod))
      expect((inputs[name].json as { type?: string }).type, name).toBe('object')
      expect((inputs[name].json as { additionalProperties?: boolean }).additionalProperties, name).toBe(false)
    }
  })

  it('la comparación falla si alguno de los dos lados cambia (mutación)', () => {
    const inputs = caps.capabilityInputs(AREAS)
    const original = inputs.search_portfolio
    expect(equivalent(original)).toBe(true)
    const json = structuredClone(original.json) as { properties: { query: { maxLength: number } } }
    json.properties.query.maxLength = 101
    expect(equivalent({ json, zod: original.zod })).toBe(false)
    const zod = z.object({ query: z.string().min(1).max(101), limit: z.number().int().min(1).max(10).default(5) }).strict()
    expect(equivalent({ json: original.json, zod })).toBe(false)
  })

  it('las áreas de get_skills son los lóbulos de T229', () => {
    const json = caps.capabilityInputs(AREAS).get_skills.json as { properties: { area: { enum: string[] } } }
    expect(json.properties.area.enum).toEqual(['frontend', 'architecture', 'backend-cloud', 'applied-ai', 'practices', 'business'])
  })

  it('rechaza entradas fuera del esquema con un error claro', async () => {
    const lang = { lang: 'es' as const }
    const rejects = async (name: CapabilityName, input: unknown) => {
      await expect(tool(name).execute(input, lang), `${name} ${JSON.stringify(input)}`).rejects.toMatchObject({
        name: 'CapabilityError',
        code: 'invalid_input',
      })
    }
    await rejects('search_portfolio', { query: 'x'.repeat(101) })
    await rejects('search_portfolio', { query: '   ' })
    await rejects('search_portfolio', { query: 'saga', limit: 11 })
    await rejects('search_portfolio', { query: 'saga', limit: 0 })
    await rejects('search_portfolio', { query: 'saga', limit: 2.5 })
    await rejects('search_portfolio', { query: 'saga', extra: true })
    await rejects('search_portfolio', {})
    await rejects('get_project', { id: '../12' })
    await rejects('get_project', { id: 'x'.repeat(41) })
    await rejects('list_projects', { technology: 'x'.repeat(61) })
    await rejects('get_skills', { area: 'cocina' })
    await rejects('get_experience', { leak: true })
    await rejects('set_preferences', { theme: 'blue' })
    await rejects('set_preferences', { language: 'fr' })
    await expect(tool('get_project').execute({ id: '99' }, lang)).rejects.toMatchObject({ code: 'not_found' })
  })
})

describe.each(['es', 'en'] as const)('salidas de las herramientas de lectura (%s)', (lang) => {
  const context = { lang }

  async function allOutputs() {
    const runs: Array<{ name: string; input: unknown; output: unknown }> = []
    const inputs: Array<[CapabilityName, unknown]> = [
      ...['Synergos', 'saga', 'Angular', 'experiencia', 'experience', 'fintech', 'correo', 'cv', 'aprendiendo', 'learning', 'RAG', 'Event bridge'].map(
        (query): [CapabilityName, unknown] => ['search_portfolio', { query, limit: 10 }],
      ),
      ...getProjects().map((project): [CapabilityName, unknown] => ['get_project', { id: project.id }]),
      ['list_projects', {}],
      ['list_projects', { technology: 'Angular' }],
      ['get_experience', {}],
      ['get_skills', {}],
      ['list_posts', {}],
      ['get_cv', {}],
    ]
    for (const [name, input] of inputs) runs.push({ name, input, output: await tool(name).execute(input, context) })
    return runs
  }

  it('solo traen datos públicos: ni datos personales ni credenciales (FR-488, constitución III)', async () => {
    for (const run of await allOutputs()) {
      const text = JSON.stringify(run.output)
      expect(personalData(text, PUBLIC_EMAILS), `${run.name} ${JSON.stringify(run.input)}`).toEqual([])
      for (const forbidden of ['ipHash', 'passwordHash', 'consentAt', 'MONGODB', 'unread', '"phone"', 'interest']) {
        expect(text, `${run.name}: ${forbidden}`).not.toContain(forbidden)
      }
    }
  })

  it('sin cifras del empleador ni cantidades en Event bridge (FR-444, FR-498)', async () => {
    for (const run of await allOutputs()) {
      expect(confidentialityFindings(run.output, ['15']), `${run.name} ${JSON.stringify(run.input)}`).toEqual([])
    }
  })

  it('no presentan "Aprendiendo ahora" como skills en uso ni el contenido del CV (FR-422, FR-498)', async () => {
    const skills = JSON.stringify(await tool('get_skills').execute({}, context))
    for (const pattern of LEARNING) expect(skills).not.toMatch(pattern)
    for (const run of await allOutputs()) {
      const text = JSON.stringify({ ...(run.output as object), query: undefined })
      expect(text.replaceAll('/cv/camilo-hernandez-cv-es.pdf', '').replaceAll('/cv/camilo-hernandez-cv-en.pdf', ''), run.name).not.toMatch(/\.pdf\b/i)
      if (run.name !== 'get_project' && run.name !== 'list_projects') {
        for (const pattern of LEARNING) expect(text, `${run.name} ${JSON.stringify(run.input)}`).not.toMatch(pattern)
      }
    }
  })

  it('search_portfolio devuelve títulos, resúmenes y enlaces absolutos desde el índice de la paleta', async () => {
    const output = (await tool('search_portfolio').execute({ query: 'sagas' }, context)) as {
      results: Array<{ kind: string; title: string; summary: string; url: string }>
    }
    expect(output.results.length).toBeGreaterThan(0)
    expect(output.results.length).toBeLessThanOrEqual(5)
    const titles = new Set(indexes[lang].docs.map((doc) => doc.title))
    for (const result of output.results) {
      expect(titles.has(result.title), result.title).toBe(true)
      expect(result.url.startsWith(`${ORIGIN}/${lang}`), result.url).toBe(true)
      expect(result.summary.length).toBeLessThanOrEqual(201)
    }
    expect(output.results.some((result) => result.kind === 'skill' || result.kind === 'project')).toBe(true)
  })

  it('get_project trae el caso completo y list_projects filtra por tecnología', async () => {
    const synergos = (await tool('get_project').execute({ id: '12' }, context)) as Record<string, unknown> & {
      adrs: unknown[]
      links: { repos: unknown[] }
    }
    expect(synergos).toMatchObject({ id: '12', title: 'Synergos', era: '2024-2026', url: `${ORIGIN}/${lang}/portfolio/12` })
    for (const key of ['summary', 'context', 'role', 'decisions', 'result', 'technologies']) expect(synergos[key], key).toBeTruthy()
    expect(synergos.adrs).toHaveLength(4)
    expect(synergos.links.repos).toHaveLength(3)

    const all = (await tool('list_projects').execute({}, context)) as { projects: Array<{ id: string }> }
    expect(all.projects.map((project) => project.id)).toEqual(getProjects().map((project) => project.id))
    for (const technology of ['Angular', 'angular', ' ANGULAR ']) {
      const filtered = (await tool('list_projects').execute({ technology }, context)) as {
        count: number
        projects: Array<{ technologies: string[] }>
      }
      expect(filtered.count).toBeGreaterThan(0)
      expect(filtered.count).toBe(filtered.projects.length)
      for (const project of filtered.projects) expect(project.technologies.some((name) => /angular/i.test(name))).toBe(true)
    }
    expect(((await tool('list_projects').execute({ technology: 'Rust' }, context)) as { count: number }).count).toBe(0)
  })

  it('get_experience trae cargos, empresas y fechas oficiales; get_skills trae nivel y años por lóbulo', async () => {
    const experience = (await tool('get_experience').execute({}, context)) as {
      career: Array<{ company: string; role: string; start: string; end: string | null }>
    }
    expect(experience.career.map((entry) => [entry.company, entry.start, entry.end])).toEqual(
      site.about.career.map((entry) => [entry.company, entry.start, entry.end]),
    )
    const skills = (await tool('get_skills').execute({ area: 'frontend' }, context)) as {
      areas: Array<{ id: string; url: string; skills: Array<{ name: string; level: number; years: string | null }> }>
    }
    expect(skills.areas).toHaveLength(1)
    expect(skills.areas[0]?.url).toBe(`${ORIGIN}/${lang}/aboutMe#lobe-frontend`)
    expect(skills.areas[0]?.skills[0]).toEqual({ id: 'angular', name: 'ANGULAR', level: 92, years: lang === 'es' ? '2022–hoy' : '2022–now' })
    const everything = (await tool('get_skills').execute({}, context)) as { areas: Array<{ id: string }> }
    expect(everything.areas.map((area) => area.id)).toEqual(AREAS)
  })

  it('list_posts filtra por etiqueta y get_cv da LinkedIn y los dos PDF, primero el del idioma', async () => {
    const posts = (await tool('list_posts').execute({}, context)) as { posts: Array<{ id: string; tags: string[] }> }
    expect(posts.posts.map((post) => post.id).sort()).toEqual([...postIds()].sort())
    const tag = posts.posts[0]?.tags[0] ?? ''
    const tagged = (await tool('list_posts').execute({ tag: tag.toUpperCase() }, context)) as { posts: Array<{ tags: string[] }> }
    expect(tagged.posts.length).toBeGreaterThan(0)
    for (const post of tagged.posts) expect(post.tags.map((item) => item.toLowerCase())).toContain(tag.toLowerCase())
    const es = { lang: 'es', url: `${ORIGIN}/cv/camilo-hernandez-cv-es.pdf`, bytes: 174_507 }
    const en = { lang: 'en', url: `${ORIGIN}/cv/camilo-hernandez-cv-en.pdf`, bytes: 172_753 }
    expect(await tool('get_cv').execute({}, context)).toEqual({
      url: 'https://www.linkedin.com/in/cherced/',
      label: lang === 'es' ? 'Ver mi CV en LinkedIn' : 'See my CV on LinkedIn',
      pdfs:
        lang === 'es'
          ? [
              { ...es, label: 'Descargar CV en español (PDF)' },
              { ...en, label: 'Descargar CV en inglés (PDF)' },
            ]
          : [
              { ...en, label: 'Download CV in English (PDF)' },
              { ...es, label: 'Download CV in Spanish (PDF)' },
            ],
    })
  })
})

describe('set_preferences: cambia la vista y se puede deshacer (FR-489)', () => {
  it('cambia el tema y el idioma con el mismo puerto que usa la paleta', async () => {
    const preferences = fakePreferences('es', 'dark')
    const output = await tool('set_preferences', preferences).execute({ theme: 'light', language: 'en' }, { lang: 'es' })
    expect(preferences.setTheme).toHaveBeenCalledWith('light')
    expect(preferences.setLanguage).toHaveBeenCalledWith('en')
    expect(output).toEqual({ previous: { language: 'es', theme: 'dark' }, current: { language: 'en', theme: 'light' } })
  })

  it('no hace nada si ya está así, y sin navegador responde que no está disponible', async () => {
    const preferences = fakePreferences('en', 'light')
    await tool('set_preferences', preferences).execute({ theme: 'light', language: 'en' }, { lang: 'en' })
    await tool('set_preferences', preferences).execute({}, { lang: 'en' })
    expect(preferences.setTheme).not.toHaveBeenCalled()
    expect(preferences.setLanguage).not.toHaveBeenCalled()
    await expect(tool('set_preferences').execute({ theme: 'dark' }, { lang: 'es' })).rejects.toMatchObject({ code: 'unavailable' })
  })
})

describe('un solo adaptador conoce WebMCP (FR-486)', () => {
  function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) return sources(path)
      return /\.(ts|tsx)$/.test(entry) ? [path] : []
    })
  }

  it('solo lib/agent/webmcp.ts nombra modelContext', () => {
    const root = process.cwd()
    const mentions = ['app', 'components', 'lib']
      .flatMap((dir) => sources(join(root, dir)))
      .filter((file) => readFileSync(file, 'utf8').includes('modelContext'))
      .map((file) => relative(root, file).replace(/\\/g, '/'))
    expect(mentions).toEqual(['lib/agent/webmcp.ts'])
  })

  it('las capacidades no leen la capa de datos ni el almacenamiento del navegador', () => {
    const dir = join(process.cwd(), 'lib', 'capabilities')
    for (const file of readdirSync(dir)) {
      const source = readFileSync(join(dir, file), 'utf8')
      expect(source, file).not.toMatch(/@\/lib\/data|localStorage|sessionStorage|document\.cookie|process\.env|fetch\(/)
    }
  })
})
