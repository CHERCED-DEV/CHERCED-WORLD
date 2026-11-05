import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(__dirname, '..', '..', '..')
const I18N = path.join(ROOT, 'content', 'i18n')
const SOURCES = ['app', 'components', 'lib', 'content', 'mdx-components.tsx', 'proxy.ts']
const EXTENSIONS = /\.(ts|tsx|mdx)$/

function files(entry: string): string[] {
  const full = path.join(ROOT, entry)
  if (full.startsWith(I18N)) return []
  const stats = statSync(full, { throwIfNoEntry: false })
  if (!stats) return []
  if (stats.isFile()) return EXTENSIONS.test(full) ? [full] : []
  return readdirSync(full).flatMap((child) => files(path.join(entry, child)))
}

function dictionaryKeys(lang: string): Map<string, string[]> {
  const byNamespace = new Map<string, string[]>()
  for (const file of readdirSync(path.join(I18N, lang)).filter((name) => name.endsWith('.json'))) {
    byNamespace.set(file.replace(/\.json$/, ''), Object.keys(JSON.parse(readFileSync(path.join(I18N, lang, file), 'utf8')) as object))
  }
  return byNamespace
}

export type Usage = { source: string; prefixes: string[] }

export function usageOf(sources: string[]): Usage {
  const prefixes = new Set<string>()
  for (const source of sources) {
    for (const match of source.matchAll(/`([a-zA-Z][\w-]*(?:\.[\w-]+)*\.)\$\{/g)) prefixes.add(match[1]!)
  }
  return { source: sources.join('\n'), prefixes: [...prefixes] }
}

function quoted(key: string, usage: Usage): boolean {
  return [`'${key}'`, `"${key}"`, `\`${key}\``].some((literal) => usage.source.includes(literal))
}

export function unusedKeys(keys: readonly string[], usage: Usage): string[] {
  return keys.filter((key) => !quoted(key, usage) && !usage.prefixes.some((prefix) => key.startsWith(prefix)))
}

const KEPT: Record<string, string> = {
  'home.title': 'tests/unit/p0/identity-copy.test.ts (congelada) la compara con site.home.title',
  'services.explore': 'tests/unit/l1/site-dictionary.test.ts (congelada) conserva los textos firma de 2023',
  'about.showMore': 'tests/unit/l1/site-dictionary.test.ts (congelada) conserva los textos firma de 2023',
  'about.languages': 'tests/unit/l1/site-dictionary.test.ts (congelada) conserva los textos firma de 2023',
  'palette.action.aiLab': 'punto de extensión de la paleta para la 003 (FR-451); lo prueba tests/unit/p6/palette.test.ts',
  'palette.action.listen': 'punto de extensión de la paleta para la 005 (FR-451); lo prueba tests/unit/p6/palette.test.ts',
  'listen.play': 'copy de "Escuchar este post" (005, T628), bloqueada por V3 de la 003 y P-505; Q0 la dejó lista',
  'listen.pause': 'copy de "Escuchar este post" (005, T628), bloqueada por V3 de la 003 y P-505; Q0 la dejó lista',
  'listen.resume': 'copy de "Escuchar este post" (005, T628), bloqueada por V3 de la 003 y P-505; Q0 la dejó lista',
  'listen.stop': 'copy de "Escuchar este post" (005, T628), bloqueada por V3 de la 003 y P-505; Q0 la dejó lista',
  'listen.status': 'copy de "Escuchar este post" (005, T628), bloqueada por V3 de la 003 y P-505; Q0 la dejó lista',
}

const usage = usageOf(SOURCES.flatMap(files).map((file) => readFileSync(file, 'utf8')))

describe('claves de i18n sin uso (004, T506)', () => {
  it('la regla encuentra una clave que nadie usa y respeta las claves armadas con un prefijo', () => {
    const sample = usageOf(["t(dict, 'nav.home')", 't(dict, `contact.interest.${id}`)'])
    expect(unusedKeys(['nav.home', 'nav.blog', 'contact.interest.product'], sample)).toEqual(['nav.blog'])
  })

  it('el código lee de verdad los diccionarios', () => {
    expect(unusedKeys(['capsule.title', 'about.title', 'meta.home.description'], usage)).toEqual([])
    expect(usage.prefixes).toContain('contact.interest.')
  })

  it('cada excepción sigue existiendo y sigue sin uso en el código: si alguien la usa o la borra, sale de la lista', () => {
    const all = [...dictionaryKeys('es').values()].flat()
    for (const key of Object.keys(KEPT)) {
      expect(all, key).toContain(key)
      expect(unusedKeys([key], usage), key).toEqual([key])
    }
  })

  it('ES y EN tienen las mismas claves en cada namespace', () => {
    const en = dictionaryKeys('en')
    for (const [namespace, keys] of dictionaryKeys('es')) expect([...(en.get(namespace) ?? [])].sort(), namespace).toEqual([...keys].sort())
  })

  for (const [namespace, keys] of dictionaryKeys('es')) {
    it(`${namespace}.json no guarda claves que ningún archivo lea`, () => {
      expect(unusedKeys(keys, usage).filter((key) => !(key in KEPT))).toEqual([])
    })
  }
})
