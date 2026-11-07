import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import nextConfig from '@/next.config'
import { proxy } from '@/proxy'
import { LOCALE_HEADER } from '@/lib/i18n'
import { localeOf } from '@/lib/i18n/request'

const ROOT = path.resolve(__dirname, '..', '..', '..')

const source = (file: string) => readFileSync(path.join(ROOT, file), 'utf8')

function forwarded(response: Response): string | null {
  return response.headers.get(`x-middleware-request-${LOCALE_HEADER}`)
}

describe('idioma del 404 global (B6)', () => {
  it('gana el idioma de la URL, luego la cookie y al final el español', () => {
    expect(localeOf('en', 'es')).toBe('en')
    expect(localeOf('es', 'en')).toBe('es')
    expect(localeOf(null, 'en')).toBe('en')
    expect(localeOf(undefined, undefined)).toBe('es')
    expect(localeOf('fr', 'de')).toBe('es')
  })

  it('el proxy le pasa al render el idioma de la URL y pisa el que mande el cliente', () => {
    expect(forwarded(proxy(new NextRequest('https://cherced.test/en/no-existe')))).toBe('en')
    expect(forwarded(proxy(new NextRequest('https://cherced.test/es/portfolio/99', { headers: { [LOCALE_HEADER]: 'en' } })))).toBe('es')
    expect(proxy(new NextRequest('https://cherced.test/en/blog')).headers.get('x-middleware-override-headers')).toContain(LOCALE_HEADER)
  })
})

describe('rutas inexistentes sin catch-all (B6)', () => {
  it('global-not-found está activo y la ruta comodín ya no existe', () => {
    expect(nextConfig.experimental?.globalNotFound).toBe(true)
    expect(existsSync(path.join(ROOT, 'app', 'global-not-found.tsx'))).toBe(true)
    expect(existsSync(path.join(ROOT, 'app', '[lang]', '[...rest]'))).toBe(false)
  })

  it.each(['app/[lang]/layout.tsx', 'app/[lang]/portfolio/[id]/page.tsx', 'app/[lang]/blog/[id]/page.tsx', 'app/[lang]/blog/tag/[tag]/page.tsx'])(
    '%s solo atiende los parámetros que genera',
    (file) => {
      expect(source(file)).toMatch(/^export const dynamicParams = false$/m)
    },
  )
})
