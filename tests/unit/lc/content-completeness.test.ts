import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { capsule } from '@/content/capsule'
import { projects } from '@/content/projects'
import { authorPending, site } from '@/content/site'
import type { Locale, Localized } from '@/content/types'
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
const POST_IDS = ['post1', 'post2', 'post3']
const REGISTRY_TEXT = readFileSync(path.join(POSTS_DIR, 'registry.ts'), 'utf8')

const SKILLS_2023: Record<string, number> = {
  react: 75,
  nextjs: 80,
  typescript: 80,
  nodejs: 75,
  mongodb: 60,
  javascript: 90,
  angular: 50,
  sass: 90,
  html5: 85,
  css: 95,
  figma: 75,
  git: 80,
  azure: 70,
}

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
  return keys.length === 2 && keys.includes('es') && keys.includes('en')
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
]

const allImages: ImageUse[] = [
  ...imageUses(site, 'site'),
  ...imageUses(projects, 'projects'),
  ...posts.map((post) => ({ at: `${post.id}/${post.lang}.mdx`, ...post.meta.image })),
]

const corpus = [JSON.stringify([site, projects]), ...posts.map((post) => post.source)].join('\n')

function publicPath(src: string) {
  return path.join(PUBLIC_DIR, ...src.split('/').filter(Boolean))
}

function has(key: keyof typeof authorPending) {
  return Object.prototype.hasOwnProperty.call(authorPending, key)
}

describe('proyectos (FR-083)', () => {
  it('migra los 11 proyectos de 2023 con ids y orden estables', () => {
    const list = content.getProjects()
    expect(list.map((project) => project.id)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'])
    expect(new Set(list.map((project) => project.order)).size).toBe(11)
  })

  it('presenta cada proyecto como caso de estudio sin campos vacíos', () => {
    for (const project of projects) {
      expect(project.title.trim(), project.id).not.toBe('')
      expect(project.context, project.id).not.toBeNull()
      for (const field of [project.role, project.decisions, project.result]) {
        if (field !== null) expect(isLocalized(field), project.id).toBe(true)
      }
      expect(project.technologies.length, project.id).toBeGreaterThan(0)
      for (const tech of project.technologies) expect(tech, project.id).toBe(tech.toUpperCase())
    }
  })

  it('omite los enlaces muertos del id 10 y conserva los demás', () => {
    for (const project of projects) {
      if (project.id === '10') {
        expect(project.links).toEqual({ live: null, github: null })
        continue
      }
      expect(project.links.live, project.id).toMatch(/^https:\/\//)
      expect(project.links.github, project.id).toMatch(/^https:\/\/github\.com\//)
    }
  })

  it('corrige el título y el alt de 2023 (C-06, C-14)', () => {
    expect(content.getProject('1')?.title).toBe('Quantic Theatrum')
    expect(content.getProject('2')?.image.alt.en).toBe('CHERCED-WORLD portfolio on mobile')
    for (const project of projects.filter((item) => item.id !== '6')) {
      expect(project.image.alt.en, project.id).not.toContain('My Website')
    }
  })
})

describe('posts (FR-064, FR-075)', () => {
  it('hay 3 posts en español e inglés y todos están en el registro', () => {
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
    expect(meta.originalLang).toBe('en')
    expect(meta.author).toBe('Camilo Hernandez')
    expect(meta.date).toMatch(/^2023-\d{2}-\d{2}$/)
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
      expect(es.meta.image.src, id).toBe(en.meta.image.src)
    }
  })

  it('lista los 3 posts en cada idioma sin fallback', async () => {
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
      if (String(value.en).split(/\s+/).length >= 4) expect(value.es, at).not.toBe(value.en)
    }
  })

  it('conserva todas las piezas del contenido 2023', () => {
    expect(site.socials.map((social) => social.id).sort()).toEqual(['email', 'facebook', 'github', 'instagram', 'linkedin'])
    expect(site.about.career.map((entry) => entry.id)).toEqual(['newshore', 'platzi-master', 'growup-it', 'squadra-arquitectura'])
    expect(site.about.skills.bullets).toHaveLength(10)
    expect(Object.fromEntries(site.about.skills.tech.map((tech) => [tech.id, tech.progress]))).toEqual(SKILLS_2023)
    expect(site.about.education.map((entry) => entry.id)).toEqual(['platzi', 'unad', 'eam'])
    expect(site.about.courses.schools).toHaveLength(4)
    expect(site.about.languages.map((language) => [language.id, language.progress])).toEqual([
      ['es', 100],
      ['en', 60],
    ])
    expect(site.services.items.map((item) => item.id)).toEqual(['design', 'development', 'maintenance'])
    expect(site.portfolio.intro).toHaveLength(3)
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
    expect(site.about.education.find((entry) => entry.id === 'eam')).toMatchObject({ start: '2011', end: '2016' })
  })

  it('actualiza la experiencia del contacto (C-08)', () => {
    expect(site.contact.description.en).toContain('since 2020')
    expect(site.contact.description.es).toContain('desde 2020')
  })

  it('el borrador de privacidad cubre responsable, finalidad, conservación y canal (P-06)', () => {
    const email = site.socials.find((social) => social.id === 'email')?.href?.replace(/^mailto:/, '')
    expect(email).toBeTruthy()
    expect(site.privacy.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(site.privacy.sections.length).toBeGreaterThanOrEqual(4)
    const es = site.privacy.sections.map((section) => section.body.es).join(' ')
    const en = site.privacy.sections.map((section) => section.body.en).join(' ')
    for (const fragment of ['Camilo Hernandez', email!, 'responder', 'moderar', 'administrador', 'eliminar']) {
      expect(es).toContain(fragment)
    }
    for (const fragment of ['Camilo Hernandez', email!, 'reply', 'moderate', 'administrator', 'delete']) {
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
  it('marca la carrera mientras falte el texto de Newshore (P-01)', () => {
    const newshore = site.about.career.find((entry) => entry.id === 'newshore')
    expect(newshore?.pending === true).toBe(has('P-01'))
    expect(site.about.career.some((entry) => entry.pending)).toBe(has('P-01'))
  })

  it('oculta Facebook mientras falte el perfil real (P-02)', () => {
    const facebook = site.socials.find((social) => social.id === 'facebook')
    expect(facebook?.href === null).toBe(has('P-02'))
    if (facebook?.href) expect(facebook.href).toMatch(/^https:\/\/(www\.)?facebook\.com\//)
  })

  it('marca la UNAD mientras falte su estado (P-03)', () => {
    const unad = site.about.education.find((entry) => entry.id === 'unad')
    expect(unad?.pending === true).toBe(has('P-03'))
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
