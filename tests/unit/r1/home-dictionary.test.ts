import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { locales, t, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

const root = process.cwd()
const KEYS = ['featured.all', 'featured.title', 'featured.viewCase', 'hero.cue', 'now.caseStudy', 'now.more', 'now.since', 'now.title']

function own(lang: Locale): Record<string, string> {
  return JSON.parse(readFileSync(join(root, 'content', 'i18n', lang, 'home.json'), 'utf8')) as Record<string, string>
}

describe('namespace home', () => {
  it('la página usa exactamente las claves del namespace', () => {
    const page = readFileSync(join(root, 'app', '[lang]', 'page.tsx'), 'utf8')
    const used = [...page.matchAll(/t\(home, '([^']+)'\)/g)].map((match) => match[1]).sort()
    expect(used).toEqual(KEYS)
  })

  it.each(locales)('%s trae todas las claves, sin textos vacíos', async (lang) => {
    expect(Object.keys(own(lang)).sort()).toEqual(KEYS)
    const dict = await getDictionary(lang, 'home')
    for (const key of KEYS) expect(t(dict, key).trim().length, key).toBeGreaterThan(0)
  })

  it('el inglés está traducido y conserva la fecha', () => {
    const es = own('es')
    const en = own('en')
    for (const key of KEYS) expect(en[key], key).not.toBe(es[key])
    for (const dict of [es, en]) expect(dict['now.since']).toContain('{date}')
    for (const dict of [es, en]) expect(dict['featured.all']).toContain('{count}')
  })

  it('la señal del hero nombra el bloque al que baja', () => {
    for (const lang of locales) {
      const dict = own(lang)
      expect(dict['hero.cue']).toContain(dict['now.title'])
    }
  })
})
