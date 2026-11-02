import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { locales, namespaces } from '@/lib/i18n'

const root = join(process.cwd(), 'content', 'i18n')

function load(lang: string, ns: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, lang, `${ns}.json`), 'utf8')) as Record<string, unknown>
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '').sort()
}

describe.each(namespaces)('paridad del namespace %s', (ns) => {
  const [base, ...others] = locales
  const reference = load(base, ns)

  it('es un objeto plano de textos no vacíos en todos los idiomas', () => {
    for (const lang of locales) {
      const dict = load(lang, ns)
      for (const [key, value] of Object.entries(dict)) {
        expect(typeof value, `${lang}/${ns}: ${key}`).toBe('string')
        expect((value as string).trim(), `${lang}/${ns}: ${key}`).not.toBe('')
      }
    }
  })

  it.each(others)('tiene las mismas claves y marcadores en %s', (lang) => {
    const dict = load(lang, ns)
    expect(Object.keys(dict).sort()).toEqual(Object.keys(reference).sort())
    for (const key of Object.keys(reference)) {
      expect(placeholders(String(dict[key])), `${lang}/${ns}: ${key}`).toEqual(placeholders(String(reference[key])))
    }
  })
})
