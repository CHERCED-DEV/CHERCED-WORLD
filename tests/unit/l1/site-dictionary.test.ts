import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { locales, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

const root = process.cwd()
const SOURCES = [
  'app/[lang]/page.tsx',
  'app/[lang]/aboutMe',
  'app/[lang]/services',
  'app/[lang]/portfolio',
  'components/site',
]
const KEY = /['"]((?:home|meta|about|services|portfolio|project|a11y)\.[A-Za-z.]+)['"]/g

function files(path: string): string[] {
  const full = join(root, path)
  if (statSync(full).isFile()) return [full]
  return readdirSync(full).flatMap((entry) => files(relative(root, join(full, entry))))
}

function usedKeys(): string[] {
  const keys = new Set<string>()
  for (const file of SOURCES.flatMap(files).filter((name) => /\.tsx?$/.test(name))) {
    for (const match of readFileSync(file, 'utf8').matchAll(KEY)) keys.add(match[1] ?? '')
  }
  return [...keys].filter((key) => !key.endsWith('.'))
}

describe('textos de L1 en el namespace site', () => {
  it('encuentra las claves que usan las páginas', () => {
    expect(usedKeys().length).toBeGreaterThan(30)
  })

  it.each(locales)('existen todas en %s sin caer al otro idioma', async (lang) => {
    const own = JSON.parse(readFileSync(join(root, 'content', 'i18n', lang, 'site.json'), 'utf8')) as Record<string, string>
    const dict = await getDictionary(lang, 'site')
    for (const key of usedKeys()) {
      expect(Object.keys(own), key).toContain(key)
      expect(() => t(dict, key)).not.toThrow()
    }
  })

  it('conserva los textos firma de 2023 en inglés', async () => {
    const en = await getDictionary('en', 'site')
    expect(t(en, 'services.title')).toBe('How can I help you?')
    expect(t(en, 'services.explore')).toBe('Explore')
    expect(t(en, 'about.showMore')).toBe('Show more!')
    expect(t(en, 'about.languages')).toBe('Languages')
  })
})
