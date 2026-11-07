import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { monogram } from '@/components/site/about/monogram'
import { capsule } from '@/content/capsule'
import { projects } from '@/content/projects'
import { projectTitles } from '@/lib/content/project-title'
import { authorPending, site } from '@/content/site'
import { now } from '@/content/now'
import { terminalCommands, terminalNotFound } from '@/content/terminal'
import { SERVICE_IDS, type Locale, type Localized } from '@/content/types'
import { imageSize } from './image-size'
import { POSTS_DIR, readPostFile, type PostFile } from './post-files'

vi.mock('@/content/posts/registry', async () => {
  const { readFileSync: read } = await import('node:fs')
  const { join } = await import('node:path')
  const files = await import('./post-files')
  const text = read(join(files.POSTS_DIR, 'registry.ts'), 'utf8')
  const component = () => null
  const postRegistry: Record<string, Partial<Record<'es' | 'en', () => Promise<unknown>>>> = {}
  for (const [, id, lang] of text.matchAll(/import\('\.\/([^/']+)\/(es|en)\.mdx'\)/g)) {
    const post = files.readPostFile(id, lang as 'es' | 'en')
    if (!post) continue
    postRegistry[id] = { ...postRegistry[id], [lang]: async () => ({ default: component, meta: post.meta }) }
  }
  return { postRegistry }
})

const content = await import('@/lib/content')

const LOCALES: Locale[] = ['es', 'en']
const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const POST_IDS = ['post1', 'post2', 'post3', 'post4', 'post5', 'post6']
const PROJECT_IDS = ['12', '13', '2', '14', '15', '1', '3', '4', '5', '6', '7', '8', '9', '10', '11']
const PROJECTS_WITHOUT_LINKS = ['10', '14', '15']
const SYNERGOS_REPOS = ['Synergos.CMS', 'Synergos.UI', 'Synergos.Fabrica']
const REGISTRY_TEXT = readFileSync(path.join(POSTS_DIR, 'registry.ts'), 'utf8')

const POST_ORIGIN: Record<string, { originalLang: Locale; date: RegExp }> = {
  post1: { originalLang: 'en', date: /^2023-\d{2}-\d{2}$/ },
  post2: { originalLang: 'en', date: /^2023-\d{2}-\d{2}$/ },
  post3: { originalLang: 'en', date: /^2023-\d{2}-\d{2}$/ },
  post4: { originalLang: 'es', date: /^2026-11-02$/ },
  post5: { originalLang: 'es', date: /^2026-11-02$/ },
  post6: { originalLang: 'es', date: /^2026-11-07$/ },
}

const SKILLS_2026: Record<string, number> = {
  angular: 92,
  typescript: 92,
  css: 92,
  javascript: 90,
  sass: 90,
  html5: 90,
  react: 72,
  nextjs: 75,
  'web-components': 88,
  ngrx: 75,
  nx: 85,
  a11y: 82,
  figma: 70,
  'clean-architecture': 88,
  solid: 90,
  'design-patterns': 85,
  'distributed-systems': 82,
  microservices: 82,
  'micro-frontends': 90,
  'native-federation': 88,
  'composable-architecture': 92,
  'event-driven': 78,
  saga: 85,
  bff: 85,
  'api-design': 80,
  'fitness-functions': 88,
  adr: 90,
  'legacy-modernization': 80,
  'spec-driven-development': 90,
  dotnet: 88,
  csharp: 85,
  umbraco: 90,
  grpc: 75,
  azure: 78,
  'azure-service-bus': 75,
  sql: 72,
  nodejs: 62,
  mongodb: 55,
  docker: 80,
  'github-actions': 85,
  'cloudflare-workers': 75,
  'ai-coding-agents': 90,
  'multi-agent-orchestration': 88,
  'claude-code-skills': 90,
  mcp: 75,
  evals: 75,
  git: 85,
  testing: 80,
  'ci-cd': 85,
  'code-review': 85,
  'docs-as-code': 88,
  agile: 80,
  'business-to-architecture': 85,
  stakeholders: 85,
  'product-thinking': 80,
}

const SKILL_ICONS_2023 = [
  'angular.png',
  'azure.png',
  'cms.png',
  'css.png',
  'figma.png',
  'html-5.png',
  'js.png',
  'merge.png',
  'mongodb.png',
  'nextjs.png',
  'nodejs.png',
  'react.png',
  'sass.png',
  'typescript.png',
]

const SKILL_ICONS_KEPT: Record<string, string> = {
  angular: 'angular.png',
  typescript: 'typescript.png',
  azure: 'azure.png',
  javascript: 'js.png',
  html5: 'html-5.png',
  css: 'css.png',
  sass: 'sass.png',
  git: 'merge.png',
  react: 'react.png',
  nextjs: 'nextjs.png',
  nodejs: 'nodejs.png',
  mongodb: 'mongodb.png',
  figma: 'figma.png',
}

const SKILL_ICONS_SIMPLE: Record<string, { file: string; hex: string }> = {
  dotnet: { file: 'dotnet.svg', hex: '#512BD4' },
  umbraco: { file: 'umbraco.svg', hex: '#3544B1' },
}

const SKILL_ICONS_T229: Record<string, string> = {
  'web-components': 'web-components.svg',
  nx: 'nx.svg',
  'api-design': 'api-design.svg',
  docker: 'docker.svg',
  'github-actions': 'github-actions.svg',
  'ci-cd': 'github-actions.svg',
  'cloudflare-workers': 'cloudflare-workers.svg',
  'claude-code-skills': 'claude.svg',
  mcp: 'mcp.svg',
  testing: 'vitest.svg',
}

const SKILL_ICONS_SIMPLE_T229: Record<string, { file: string; hex: string }> = {
  'web-components': { file: 'web-components.svg', hex: '#29ABE2' },
  nx: { file: 'nx.svg', hex: '#143055' },
  'api-design': { file: 'api-design.svg', hex: '#6BA539' },
  docker: { file: 'docker.svg', hex: '#2496ED' },
  'github-actions': { file: 'github-actions.svg', hex: '#2088FF' },
  'cloudflare-workers': { file: 'cloudflare-workers.svg', hex: '#F38020' },
  'claude-code-skills': { file: 'claude.svg', hex: '#D97757' },
  mcp: { file: 'mcp.svg', hex: '#000000' },
  testing: { file: 'vitest.svg', hex: '#00FF74' },
}

const SKILL_PICTOGRAMS: Record<string, string> = {
  csharp: 'csharp.svg',
  'micro-frontends': 'micro-frontends.svg',
  'native-federation': 'native-federation.svg',
  'spec-driven-development': 'spec-driven-development.svg',
  'ai-coding-agents': 'ai-coding-agents.svg',
}

const PICTOGRAM_INK = new Set(['#0A0A0A', '#25ED9E'])

const MONOGRAMS: Record<string, string> = {
  dotnet: '.NET',
  csharp: 'C#',
  'micro-frontends': 'MF',
  'native-federation': 'NF',
  umbraco: 'U',
  'spec-driven-development': 'SDD',
  'ai-coding-agents': 'AI',
}

const CAREER_2026 = [
  'sistecredito-ai-first',
  'sistecredito-dev-solutions',
  'synergos-labs',
  'flyr',
  'newshore',
  'platzi-master',
  'growup-it',
  'squadra-arquitectura',
]

const SAME_IN_BOTH_LANGUAGES = new Set([
  'Software Solutions Engineer · AI-First',
  'Founder & Software Architect',
  'Frontend Development, Platzi Master',
  'Frontend Web Developer – Platzi Master [CX]',
  'Founder & Business Manager',
  'Micro-frontends · Web Components',
])

const CONFIDENTIAL: RegExp[] = [/\b700\b/, /\b1[.,]000\b/, /\b90\s?%/, /~\s?\d/]

const SHELL_ICONS = [
  'brandLogo.png',
  'brandLogoX2.png',
  'linkedInIcon.png',
  'instagramIcon.png',
  'githubCircle.png',
  'gmailIcon.png',
  'facebookIcon.png',
]

const UNCORRECTED_2023: Array<[string, RegExp]> = [
  ['C-01', /@2023/],
  ['C-01', /Rigths/i],
  ['C-02', /\bactually\b/i],
  ['C-03', /Bussines/i],
  ['C-04', /desing/i],
  ['C-05', /\bidioms?\b/i],
  ['C-06', /Theathrum/i],
  ['C-07', /company knowledge/i],
  ['C-08', /\b(3|three) years of experience/i],
  ['C-09', /shools/i],
  ['C-10', /i do this space|\bseccion\b|your instance here/i],
  ['C-11', /send me a post/i],
  ['C-13', /separator line/i],
  ['C-16', /contacting us/i],
  ['C-17', /mePortfolio/i],
  ['D-02', /bbc\.com/i],
  ['D-03', /the developer's/i],
  ['ortografía', /\b(ReactJs|NodeJs|NextJs)\b/],
  ['ortografía', /\bGithub\b/],
  ['ortografía', /programming\.I/],
]

const posts: PostFile[] = POST_IDS.flatMap((id) =>
  LOCALES.map((lang) => readPostFile(id, lang)).filter((post): post is PostFile => post !== null),
)

function isLocalized(value: object): value is Localized<unknown> {
  const keys = Object.keys(value)
  return keys.includes('es') && keys.includes('en') && keys.every((key) => key === 'es' || key === 'en' || key === 'lang')
}

function localizedValues(value: unknown, at: string): Array<{ at: string; value: Localized<unknown> }> {
  if (Array.isArray(value)) return value.flatMap((item, index) => localizedValues(item, `${at}[${index}]`))
  if (value && typeof value === 'object') {
    if (isLocalized(value)) return [{ at, value }]
    return Object.entries(value).flatMap(([key, item]) => localizedValues(item, `${at}.${key}`))
  }
  return []
}

type ImageUse = { at: string; src: string; width?: number; height?: number }

function imageUses(value: unknown, at: string): ImageUse[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => imageUses(item, `${at}[${index}]`))
  if (!value || typeof value !== 'object') return []
  const record = value as Record<string, unknown>
  const own: ImageUse[] = []
  if (typeof record.src === 'string' && typeof record.width === 'number' && typeof record.height === 'number') {
    own.push({ at, src: record.src, width: record.width, height: record.height })
  }
  if (typeof record.icon === 'string') own.push({ at: `${at}.icon`, src: record.icon })
  return [...own, ...Object.entries(record).flatMap(([key, item]) => imageUses(item, `${at}.${key}`))]
}

const allLocalized = [
  ...localizedValues(site, 'site'),
  ...localizedValues(projects, 'projects'),
  ...localizedValues(capsule, 'capsule'),
  ...localizedValues(now, 'now'),
  ...localizedValues(terminalCommands, 'terminal'),
  ...localizedValues(terminalNotFound, 'terminalNotFound'),
]

const allImages: ImageUse[] = [
  ...imageUses(site, 'site'),
  ...imageUses(projects, 'projects'),
  ...posts.map((post) => ({ at: `${post.id}/${post.lang}.mdx`, ...post.meta.image })),
]

const corpus = [JSON.stringify([site, projects, now, terminalCommands]), ...posts.map((post) => post.source)].join('\n')

function publicPath(src: string) {
  return path.join(PUBLIC_DIR, ...src.split('/').filter(Boolean))
}

function has(key: string) {
  return Object.prototype.hasOwnProperty.call(authorPending, key)
}

function career(id: string) {
  return site.about.career.find((entry) => entry.id === id)
}

describe('proyectos (FR-083, FR-443, FR-446)', () => {
  it('conserva los 11 proyectos de 2023 y suma Synergos y los tres casos de la 004 en el orden de §4', () => {
    const list = content.getProjects()
    expect(list.map((project) => project.id)).toEqual(PROJECT_IDS)
    expect(list.map((project) => project.order)).toEqual(PROJECT_IDS.map((_, index) => index + 1))
  })

  it('presenta cada proyecto como caso de estudio sin campos vacíos', () => {
    for (const project of projects) {
      for (const title of projectTitles(project)) expect(title.trim(), project.id).not.toBe('')
      expect(project.context, project.id).not.toBeNull()
      for (const field of [project.role, project.decisions, project.result]) {
        if (field !== null) expect(isLocalized(field), project.id).toBe(true)
      }
      expect(project.technologies.length, project.id).toBeGreaterThan(0)
      for (const tech of project.technologies) expect(tech, project.id).toBe(tech.toUpperCase())
    }
  })

  it('omite los enlaces del id 10 (muertos) y de los casos sin publicar, Synergos solo enlaza sus repos y los demás se conservan', () => {
    for (const project of projects) {
      if (PROJECTS_WITHOUT_LINKS.includes(project.id)) {
        expect(project.links, project.id).toEqual({ live: null, github: null })
        continue
      }
      if (project.id === '12' || project.id === '13') {
        expect(project.links.live).toBe(project.id === '12' ? 'https://synergos-ui.synergos-labs.workers.dev/' : null)
        expect(project.links.github).toBeNull()
        expect(project.links.repos?.map((repo) => repo.label)).toEqual(project.id === '12' ? SYNERGOS_REPOS : ['Synergos.Fabrica'])
        for (const repo of project.links.repos ?? []) expect(repo.href).toBe(`https://github.com/CHERCED-DEV/${repo.label}`)
        continue
      }
      expect(project.links.live, project.id).toMatch(/^https:\/\//)
      expect(project.links.github, project.id).toMatch(/^https:\/\/github\.com\//)
    }
  })

  it('corrige el título y el alt de 2023 (C-06, C-14)', () => {
    expect(content.getProject('1')?.title).toBe('Quantic Theatrum')
    for (const project of projects.filter((item) => item.id !== '6')) {
      expect(project.image.alt.en, project.id).not.toContain('My Website')
    }
  })

  it('reescribe CHERCED-WORLD 2026 como caso de estudio completo', () => {
    const project = content.getProject('2')!
    expect(project.title).toBe('CHERCED-WORLD 2026')
    expect(project.links).toEqual({
      live: 'https://cherced-world.vercel.app/',
      github: 'https://github.com/CHERCED-DEV/CHERCED-WORLD',
    })
    for (const field of [project.role, project.decisions, project.result]) expect(field).not.toBeNull()
    expect(project.result?.es).toContain('datos de contacto que no debían ser públicos')
    expect(project.result?.en).toContain("contact details that shouldn't have been public")
    expect(project.image).toMatchObject({ src: '/assets/imgs/projects/chercedWorld2026.webp', width: 420, height: 870 })
    expect(project.image.alt.en).toMatch(/^CHERCED-WORLD 2026 home in dark theme/)
  })

  it('abre el portafolio con Synergos y conserva su diagrama SVG', () => {
    const project = content.getProject('12')!
    expect(project.title).toBe('Synergos')
    expect(project.order).toBe(1)
    expect(project.image.src).toBe('/assets/imgs/projects/synergos-en.svg')
    expect(project.image.localizedSrc).toEqual({ es: '/assets/imgs/projects/synergos-es.svg', en: '/assets/imgs/projects/synergos-en.svg' })
    expect(imageSize(publicPath(project.image.src))?.format).toBe('svg')
    expect(project.image.alt.es).toContain('Umbraco')
    expect(project.image.alt.en).toContain('Umbraco')
    expect(project.image.alt.es).not.toBe(project.image.alt.en)
  })

  it('usa en las tarjetas la proporción de las capturas móviles', () => {
    const portrait = projects.filter((project) => project.image.height > project.image.width)
    const ratio = (project: (typeof projects)[number]) => project.image.width / project.image.height
    const ratios = portrait.filter((project) => project.id !== '2').map(ratio)
    const project = content.getProject('2')!
    expect(ratio(project)).toBeGreaterThanOrEqual(Math.min(...ratios))
    expect(ratio(project)).toBeLessThanOrEqual(Math.max(...ratios))
  })
})

describe('posts (FR-064, FR-075)', () => {
  it('hay 6 posts en español e inglés y todos están en el registro', () => {
    const dirs = readdirSync(POSTS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
    expect(dirs).toEqual(POST_IDS)
    expect(posts).toHaveLength(POST_IDS.length * LOCALES.length)
    for (const id of POST_IDS) {
      for (const lang of LOCALES) expect(REGISTRY_TEXT, `${id}/${lang}`).toContain(`import('./${id}/${lang}.mdx')`)
    }
  })

  it.each(posts.map((post) => [`${post.id}/${post.lang}`, post] as const))('%s cumple PostMeta', (_, post) => {
    const { meta } = post
    expect(meta.id).toBe(post.id)
    expect(meta.lang).toBe(post.lang)
    expect(meta.originalLang).toBe(POST_ORIGIN[post.id]?.originalLang)
    expect(meta.author).toBe('Camilo Hernández')
    expect(meta.date).toMatch(POST_ORIGIN[post.id]!.date)
    expect(Number.isNaN(Date.parse(meta.date))).toBe(false)
    expect(meta.title.trim()).not.toBe('')
    expect(meta.description.trim()).not.toBe('')
    expect(meta.tags.length).toBeGreaterThan(0)
    expect(meta.image.alt.trim()).not.toBe('')
    expect(post.paragraphs.length).toBeGreaterThan(0)
  })

  it('tiene la misma estructura y textos distintos en cada idioma', () => {
    for (const id of POST_IDS) {
      const [es, en] = LOCALES.map((lang) => posts.find((post) => post.id === id && post.lang === lang)!)
      expect(es.paragraphs.length, id).toBe(en.paragraphs.length)
      expect(es.meta.title, id).not.toBe(en.meta.title)
      expect(es.meta.description, id).not.toBe(en.meta.description)
      expect(es.meta.image.alt, id).not.toBe(en.meta.image.alt)
      expect(es.meta.date, id).toBe(en.meta.date)
      expect([es.meta.image.width, es.meta.image.height], id).toEqual([en.meta.image.width, en.meta.image.height])
    }
  })

  it('publica el post 4 con su captura 1200×630 y el hotfix sin detalles', () => {
    for (const lang of LOCALES) {
      const post = posts.find((item) => item.id === 'post4' && item.lang === lang)!
      expect(post.meta.image).toMatchObject({ src: '/assets/imgs/posts/post4.webp', width: 1200, height: 630 })
      expect(imageSize(publicPath(post.meta.image.src))?.format, lang).toBe('webp')
    }
    const es = posts.find((item) => item.id === 'post4' && item.lang === 'es')!.source
    const en = posts.find((item) => item.id === 'post4' && item.lang === 'en')!.source
    expect(es).toContain('datos de contacto que no debían ser públicos')
    expect(en).toContain("contact details that shouldn't have been public")
    expect(es).toContain('busco oportunidades fuera de Colombia')
    expect(en).toContain('looking for opportunities outside Colombia')
  })

  it('lista los 6 posts en cada idioma sin fallback', async () => {
    for (const lang of LOCALES) {
      const listed = await content.listPosts(lang)
      expect(listed.map((post) => post.id).sort(), lang).toEqual(POST_IDS)
      for (const post of listed) {
        expect(post.fallback, `${post.id}/${lang}`).toBe(false)
        expect(post.lang, `${post.id}/${lang}`).toBe(lang)
      }
    }
  })
})

describe('sitio (FR-004)', () => {
  it('no tiene textos bilingües vacíos ni sin traducir', () => {
    expect(allLocalized.length).toBeGreaterThanOrEqual(120)
    for (const { at, value } of allLocalized) {
      for (const lang of LOCALES) {
        expect(typeof value[lang], `${at}.${lang}`).toBe('string')
        expect(String(value[lang]).trim(), `${at}.${lang}`).not.toBe('')
      }
      if (String(value.en).split(/\s+/).length >= 4 && !SAME_IN_BOTH_LANGUAGES.has(String(value.en))) {
        expect(value.es, at).not.toBe(value.en)
      }
    }
  })

  it('los tipos nuevos de la 004 llegan completos en ES y EN (FR-495, SC-412)', () => {
    const paths = allLocalized.map(({ at }) => at)
    for (const prefix of [
      'site.home.previousTitle',
      'site.home.subtitle',
      'site.profile.availability.location',
      'site.about.skills.inWords.frontend',
      'site.about.principles[4].full',
      'site.services.hero.cta',
      'site.services.audiences[2].text',
      'site.services.items[5].deliverables[2]',
      'site.services.process.principles[3]',
      'site.services.faq[3].a',
      'site.services.cta.button',
      'projects[11].adrCards[3].tradeoff',
      'projects[11].diagram[2].role',
      'now.mottos[1]',
      'terminal[1].output',
    ]) {
      expect(paths, prefix).toContain(prefix)
    }
    expect(allLocalized.length).toBeGreaterThanOrEqual(300)
  })

  it('carga el contenido 2026 sobre las piezas de 2023', () => {
    expect(site.socials.map((social) => social.id).sort()).toEqual(['email', 'facebook', 'github', 'instagram', 'linkedin'])
    expect(site.about.career.map((entry) => entry.id)).toEqual(CAREER_2026)
    expect(site.about.skills.bullets).toHaveLength(10)
    expect(site.about.skills.tech).toHaveLength(55)
    expect(Object.fromEntries(site.about.skills.tech.map((tech) => [tech.id, tech.progress]))).toEqual(SKILLS_2026)
    expect(site.about.education.map((entry) => entry.id)).toEqual(['unad', 'platzi', 'eam'])
    expect(site.about.courses.schools).toHaveLength(5)
    expect(site.about.courses.schools[0]?.name.en).toBe('Software Architecture Fundamentals — Platzi (Nov 2025)')
    expect(site.about.languages.map((language) => [language.id, language.progress])).toEqual([
      ['es', 100],
      ['en', 65],
    ])
    expect(site.services.items.map((item) => item.id)).toEqual([...SERVICE_IDS])
    expect(site.portfolio.intro).toHaveLength(1)
  })

  it('aplica las correcciones de fechas y cargos del autor', () => {
    expect(career('newshore')).toMatchObject({ start: '2022-07', end: '2023-03' })
    expect(career('newshore')?.description.en).toContain('Avianca PWA')
    expect(career('flyr')).toMatchObject({ start: '2023-03', end: '2025-03' })
    expect(career('sistecredito-dev-solutions')).toMatchObject({ start: '2025-03', end: '2026-02' })
    expect(career('sistecredito-ai-first')).toMatchObject({ start: '2026-02', end: null })
    expect(career('synergos-labs')).toMatchObject({ start: '2024-02', end: null })
    expect(career('growup-it')).toMatchObject({ start: '2019-01', end: '2019-11' })
    expect(career('platzi-master')).toMatchObject({ start: '2022-03', end: '2022-06' })
    expect(career('squadra-arquitectura')?.role).toEqual({ es: 'Founder & Business Manager', en: 'Founder & Business Manager' })
  })

  it('no publica cifras internas de Sistecrédito fuera de los bullets de LinkedIn que el autor aprobó', () => {
    const sistecredito = site.about.career.filter((entry) => entry.company === 'Sistecrédito')
    expect(sistecredito).toHaveLength(2)
    for (const entry of sistecredito) {
      for (const pattern of CONFIDENTIAL) {
        expect(entry.description.es, `${entry.id}.es`).not.toMatch(pattern)
        expect(entry.description.en, `${entry.id}.en`).not.toMatch(pattern)
      }
    }
    const withoutHighlights = corpus.replace(
      JSON.stringify([site, projects, now, terminalCommands]),
      JSON.stringify([{ ...site, about: { ...site.about, career: site.about.career.map((entry) => ({ ...entry, highlights: undefined })) } }, projects, now, terminalCommands]),
    )
    for (const pattern of CONFIDENTIAL) expect(withoutHighlights).not.toMatch(pattern)
  })

  it('ordena la carrera de la más reciente a la más antigua con fechas válidas', () => {
    const starts = site.about.career.map((entry) => entry.start)
    expect(starts).toEqual([...starts].sort().reverse())
    for (const entry of site.about.career) {
      expect(entry.start, entry.id).toMatch(/^\d{4}-\d{2}$/)
      if (entry.end !== null) {
        expect(entry.end, entry.id).toMatch(/^\d{4}-\d{2}$/)
        expect(entry.end >= entry.start, entry.id).toBe(true)
      }
    }
  })

  it('escribe la educación con años de cuatro cifras (C-15)', () => {
    for (const entry of site.about.education) {
      expect(entry.start, entry.id).toMatch(/^\d{4}(-\d{2})?$/)
      if (entry.end !== null) expect(entry.end, entry.id).toMatch(/^\d{4}(-\d{2})?$/)
    }
    expect(site.about.education.find((entry) => entry.id === 'eam')).toMatchObject({ start: '2013', end: '2017' })
    expect(site.about.education.find((entry) => entry.id === 'unad')).toMatchObject({ start: '2020-06', end: '2023-11' })
    expect(site.about.education.find((entry) => entry.id === 'unad')?.degree.es).toContain('no finalizados')
  })

  it('actualiza la experiencia del contacto (C-08), con los 6 años del CV (C3 de la 010)', () => {
    expect(site.contact.description.en).toContain('for 6 years')
    expect(site.contact.description.es).toContain('Llevo 6 años')
    expect(`${site.contact.description.en} ${site.contact.description.es}`).not.toContain('2020')
  })

  it('el borrador de privacidad cubre responsable, finalidad, conservación y canal (P-06)', () => {
    const email = site.socials.find((social) => social.id === 'email')?.href?.replace(/^mailto:/, '')
    expect(email).toBeTruthy()
    expect(site.privacy.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(site.privacy.sections.length).toBeGreaterThanOrEqual(4)
    const es = site.privacy.sections.map((section) => section.body.es).join(' ')
    const en = site.privacy.sections.map((section) => section.body.en).join(' ')
    for (const fragment of ['Camilo Hernández', email!, 'responder', 'moderar', 'administrador', 'eliminar']) {
      expect(es).toContain(fragment)
    }
    for (const fragment of ['Camilo Hernández', email!, 'reply', 'moderate', 'administrator', 'delete']) {
      expect(en).toContain(fragment)
    }
  })

  it('carga la cápsula 2023 con sus 16 commits', () => {
    expect(capsule).toHaveLength(16)
    for (const entry of capsule) {
      expect(entry.date).toMatch(/^2023-\d{2}-\d{2}$/)
      expect(entry.message.trim()).not.toBe('')
    }
    const dates = content.getCapsule().map((entry) => entry.date)
    expect(dates[0]).toBe('2023-01-03')
    expect(dates.at(-1)).toBe('2023-05-21')
  })
})

describe('pendientes del autor', () => {
  it('cierra P-01: la carrera completa se publica sin pendientes', () => {
    expect(has('P-01')).toBe(false)
    expect(site.about.career.some((entry) => entry.pending)).toBe(false)
  })

  it('oculta Facebook mientras falte el perfil real (P-02)', () => {
    const facebook = site.socials.find((social) => social.id === 'facebook')
    expect(facebook?.href === null).toBe(has('P-02'))
    if (facebook?.href) expect(facebook.href).toMatch(/^https:\/\/(www\.)?facebook\.com\//)
  })

  it('cierra P-03: la educación se publica sin pendientes', () => {
    expect(has('P-03')).toBe(false)
    expect(site.about.education.some((entry) => entry.pending)).toBe(false)
  })

  it('conserva sin uso los assets de terceros (P-05)', () => {
    const pending: readonly string[] = has('P-05') ? authorPending['P-05'] : []
    for (const src of pending) {
      expect(existsSync(publicPath(src)), src).toBe(true)
      expect(corpus, src).not.toContain(src)
    }
  })

  it('marca la privacidad como borrador para revisión del autor (P-06)', () => {
    expect(authorPending['P-06']).toBe('privacy')
  })
})

describe('textos 2023 corregidos (C-01 a C-17)', () => {
  it.each(UNCORRECTED_2023)('%s: no aparece %s', (_, pattern) => {
    expect(corpus).not.toMatch(pattern)
  })

  it('no deja textos en español del lado en inglés (C-12)', () => {
    const english = [
      ...allLocalized.map(({ value }) => String(value.en)),
      ...posts.filter((post) => post.lang === 'en').map((post) => post.source),
    ].join('\n')
    expect(english).not.toMatch(/\bComentarios\b|\benviar\b/i)
  })
})

describe('assets (T044)', () => {
  it('cada imagen e ícono del contenido existe en public/ con sus medidas reales', () => {
    expect(allImages.length).toBeGreaterThan(30)
    for (const use of allImages) {
      const file = publicPath(use.src)
      expect(use.src, use.at).toMatch(/^\/assets\//)
      expect(existsSync(file), `${use.at}: ${use.src}`).toBe(true)
      if (use.width === undefined) continue
      const size = imageSize(file)
      expect(size, `${use.at}: ${use.src}`).not.toBeNull()
      expect([size!.width, size!.height], `${use.at}: ${use.src}`).toEqual([use.width, use.height])
    }
  })

  it('las imágenes grandes del contenido están en WebP', () => {
    for (const use of allImages) {
      const file = publicPath(use.src)
      if (statSync(file).size > 100 * 1024) expect(imageSize(file)?.format, `${use.at}: ${use.src}`).toBe('webp')
    }
  })

  it('conserva los íconos que usa el shell', () => {
    for (const icon of SHELL_ICONS) expect(existsSync(path.join(PUBLIC_DIR, 'assets', 'icons', icon)), icon).toBe(true)
  })
})

const LEARNING_NOW = ['Azure AI Foundry', 'Semantic Kernel', 'RAG']

describe('aprendiendo ahora (decisión del autor, 2026-11-04)', () => {
  it('Azure AI Foundry, Semantic Kernel y RAG salen de las barras y quedan en una línea, en ambos idiomas', () => {
    const names = site.about.skills.tech.map((tech) => tech.name.toUpperCase())
    for (const name of LEARNING_NOW) expect(names.some((item) => item.includes(name.toUpperCase())), name).toBe(false)
    expect(site.about.skills.learningNow?.es).toBe('Aprendiendo ahora: Azure AI Foundry, Semantic Kernel y RAG.')
    expect(site.about.skills.learningNow?.en).toBe('Learning now: Azure AI Foundry, Semantic Kernel and RAG.')
    for (const lobe of site.about.skills.lobes ?? []) {
      for (const id of lobe.skills) expect(['azure-ai-foundry', 'semantic-kernel', 'rag-embeddings'], `${lobe.id}: ${id}`).not.toContain(id)
    }
  })

  it('no quedan íconos huérfanos de las tecnologías que salieron', () => {
    const files = readdirSync(path.join(PUBLIC_DIR, 'assets', 'icons', 'skillsIcon'))
    for (const file of ['azure-ai-foundry.svg', 'semantic-kernel.svg', 'rag-embeddings.svg']) expect(files, file).not.toContain(file)
  })
})

describe('íconos de tecnologías (A-18 y D-08)', () => {
  const iconDir = path.join(PUBLIC_DIR, 'assets', 'icons', 'skillsIcon')
  const svgFiles = [
    ...Object.values(SKILL_ICONS_SIMPLE).map((icon) => icon.file),
    ...Object.values(SKILL_ICONS_SIMPLE_T229).map((icon) => icon.file),
    ...Object.values(SKILL_PICTOGRAMS),
  ]

  it('conserva los logos 2023 y solo suma los SVG de D-08 y de T229', () => {
    expect(readdirSync(iconDir).sort()).toEqual([...SKILL_ICONS_2023, ...svgFiles].sort())
  })

  it('las tecnologías con logo 2023 conservan el suyo', () => {
    for (const tech of site.about.skills.tech) {
      const kept = SKILL_ICONS_KEPT[tech.id]
      if (kept) expect(tech.icon, tech.id).toBe(`/assets/icons/skillsIcon/${kept}`)
    }
  })

  it('las skills de D-08 que siguen en el stack tienen ícono real y ninguna queda con placa de iniciales', () => {
    const d08 = { ...Object.fromEntries(Object.entries(SKILL_ICONS_SIMPLE).map(([id, icon]) => [id, icon.file])), ...SKILL_PICTOGRAMS }
    expect(Object.keys(d08).sort()).toEqual(Object.keys(MONOGRAMS).sort())
    for (const [id, file] of Object.entries(d08)) {
      const tech = site.about.skills.tech.find((item) => item.id === id)
      expect(tech?.icon, id).toBe(`/assets/icons/skillsIcon/${file}`)
    }
    for (const tech of site.about.skills.tech.filter((item) => !item.icon)) {
      const initials = monogram(tech.name)
      expect(initials.length, `${tech.id}: ${initials}`).toBeGreaterThan(0)
      expect(initials.length, `${tech.id}: ${initials}`).toBeLessThanOrEqual(4)
    }
  })

  it('los íconos de Simple Icons que se suman en T229 son CC0 y van en su skill', () => {
    for (const [id, file] of Object.entries(SKILL_ICONS_T229)) {
      const tech = site.about.skills.tech.find((item) => item.id === id)
      expect(tech?.icon, id).toBe(`/assets/icons/skillsIcon/${file}`)
    }
  })

  it('los logos de Simple Icons llevan su color de marca y un único trazado', () => {
    for (const { file, hex } of [...Object.values(SKILL_ICONS_SIMPLE), ...Object.values(SKILL_ICONS_SIMPLE_T229)]) {
      const svg = readFileSync(path.join(iconDir, file), 'utf8')
      expect(svg, file).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 24 24"/)
      expect(svg, file).toContain(`fill="${hex}"`)
      expect(svg.match(/<path /g), file).toHaveLength(1)
      expect(svg, file).not.toMatch(/<script|on\w+=|href=/i)
    }
  })

  it('los pictogramas originales son de línea fina, en negro con el acento #25ED9E', () => {
    for (const file of Object.values(SKILL_PICTOGRAMS)) {
      const svg = readFileSync(path.join(iconDir, file), 'utf8')
      expect(svg, file).toMatch(/viewBox="0 0 48 48"/)
      expect(svg, file).toMatch(/stroke-width="1\.75"/)
      expect(svg, file).toContain('#25ED9E')
      const colors = new Set([...svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map((match) => match[1]!.toUpperCase()))
      for (const color of colors) expect(PICTOGRAM_INK.has(color), `${file}: ${color}`).toBe(true)
      expect(svg, file).not.toMatch(/<script|<image|on\w+=|href=/i)
    }
  })

  it('la placa de iniciales sigue siendo legible y única para una skill futura sin ícono', () => {
    const names = Object.keys(MONOGRAMS).map((id) => [id, site.about.skills.tech.find((tech) => tech.id === id)?.name ?? ''])
    expect(Object.fromEntries(names.map(([id, name]) => [id, monogram(name!)]))).toEqual(MONOGRAMS)
    const initials = Object.values(MONOGRAMS)
    expect(new Set(initials).size).toBe(initials.length)
    for (const value of initials) expect(value.length, value).toBeLessThanOrEqual(4)
  })
})
