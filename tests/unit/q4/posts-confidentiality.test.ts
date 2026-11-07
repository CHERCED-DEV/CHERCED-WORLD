import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Locale } from '@/content/types'
import { POSTS_DIR, readPostFile, type PostFile } from '../lc/post-files'

const FIRST_CALENDAR_POST = 6
const LANGS: Locale[] = ['es', 'en']
const REGISTRY = readFileSync(path.join(POSTS_DIR, 'registry.ts'), 'utf8')

const EMPLOYER = /sistecr[eé]dito/i
const EMPLOYER_CONTEXT = /sistecr[eé]dito|empleador|employer|fintech|mi trabajo actual|my current job|day job/i
const CORPORATE_TOOLS = [/factor[ií]a/i, /azure devops/i, /datadog/i, /fluid attacks/i]
const PRIVATE_PATHS = [
  /[A-Za-z]:[\\/](?:Users|Usuarios)/i,
  /(?:^|[\s`'"(/\\])(?:Desktop|Escritorio)[\\/]/i,
  /\/(?:Users|home)\/[A-Za-z]/,
  /\.worktrees/i,
  /handoff-\d{4}/i,
  /(?:^|[\s`'"(/\\])synergos[\\/]/,
]
const PUBLIC_REPOS = new Set(['CHERCED-WORLD', 'Synergos.CMS', 'Synergos.UI', 'Synergos.Fabrica'])
const EXACT_SYNERGOS_TESTS = { es: '2.353', en: '2,353' } as const
const MEASURED_ON = { es: '6 de agosto de 2026', en: 'August 6, 2026' } as const

function quantities(text: string): string[] {
  const found = [
    ...text.matchAll(/\d[\d.,]*\s?[+%]/g),
    ...text.matchAll(/[~≈]\s?\d/g),
    ...text.matchAll(/(?<![\w.])\d{2,}(?![\w])/g),
  ]
  return found.map((match) => match[0])
}

function privatePaths(text: string): string[] {
  return PRIVATE_PATHS.filter((pattern) => pattern.test(text)).map(String)
}

function privateRepos(text: string): string[] {
  return [...text.matchAll(/github\.com\/CHERCED-DEV\/([\w.-]+)/gi)].map((match) => match[1]!).filter((repo) => !PUBLIC_REPOS.has(repo))
}

const calendarIds = readdirSync(POSTS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => Number(/^post(\d+)$/.exec(name)?.[1] ?? 0) >= FIRST_CALENDAR_POST)
  .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)))

const posts: PostFile[] = calendarIds.flatMap((id) => LANGS.map((lang) => readPostFile(id, lang)).filter((post): post is PostFile => post !== null))

describe('posts del calendario: confidencialidad (FR-541, T640)', () => {
  it('las reglas detectan lo que tienen que bloquear', () => {
    for (const sample of ['más de 700 asesores', '90 % del tráfico', '~1.000 eventos', '3+ equipos']) expect(quantities(sample), sample).not.toEqual([])
    for (const sample of ['una sola vez', '.NET y C#']) expect(quantities(sample), sample).toEqual([])
    for (const sample of ['C:\\Users\\alguien\\notas.md', 'ver Desktop/proyecto', '/Users/alguien/x', 'docs/handoff-2026-11-04', 'en synergos/specs/LINEAS.md']) {
      expect(privatePaths(sample), sample).not.toEqual([])
    }
    for (const sample of ['el repositorio Synergos.CMS', 'Synergos/CMS como idea', 'un escritorio limpio']) expect(privatePaths(sample), sample).toEqual([])
    expect(privateRepos('https://github.com/CHERCED-DEV/repo-privado')).toEqual(['repo-privado'])
    expect(privateRepos('https://github.com/CHERCED-DEV/Synergos.CMS/blob/master/x.md')).toEqual([])
  })

  it('existe al menos el post 1 del calendario', () => {
    expect(calendarIds[0]).toBe('post6')
  })

  it('cada post del calendario existe en ES y EN y está registrado en los dos idiomas (FR-540)', () => {
    for (const id of calendarIds) {
      for (const lang of LANGS) {
        expect(posts.some((post) => post.id === id && post.lang === lang), `${id}/${lang}.mdx`).toBe(true)
        expect(REGISTRY, `${id}/${lang} en registry.ts`).toContain(`import('./${id}/${lang}.mdx')`)
      }
    }
  })

  it.each(posts.map((post) => [`${post.id}/${post.lang}`, post] as const))('%s no nombra al empleador ni sus herramientas', (_, post) => {
    expect(post.source).not.toMatch(EMPLOYER)
    for (const pattern of CORPORATE_TOOLS) expect(post.source, String(pattern)).not.toMatch(pattern)
  })

  it.each(posts.map((post) => [`${post.id}/${post.lang}`, post] as const))('%s no trae cantidades ligadas al empleador', (_, post) => {
    for (const paragraph of post.paragraphs.filter((block) => EMPLOYER_CONTEXT.test(block))) {
      expect(quantities(paragraph), paragraph).toEqual([])
    }
  })

  it.each(posts.map((post) => [`${post.id}/${post.lang}`, post] as const))('%s no trae rutas locales, carpetas privadas ni repos privados', (_, post) => {
    expect(privatePaths(post.source)).toEqual([])
    expect(privateRepos(post.source)).toEqual([])
  })

  it.each(posts.map((post) => [`${post.id}/${post.lang}`, post] as const))('%s pone la cifra exacta de tests con su fecha de medición en el primer párrafo (P-502)', (_, post) => {
    const exact = EXACT_SYNERGOS_TESTS[post.lang]
    if (!post.source.includes(exact)) return
    expect(post.paragraphs[0]).toContain(exact)
    expect(post.paragraphs[0]).toContain(MEASURED_ON[post.lang])
  })
})
