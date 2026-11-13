import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import nextConfig from '@/next.config'
import { proxy } from '@/proxy'
import { LOCALE_HEADER } from '@/lib/i18n'
import { localeOf } from '@/lib/i18n/request'
import { MISSING_HEADER, missingSection } from '@/lib/missing'

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

describe('el 404 de posts no se lleva las páginas fijas del blog (012)', () => {
  const rewrite = (url: string) => proxy(new NextRequest(url)).headers.get('x-middleware-rewrite') ?? ''

  it('/blog/catalog se sirve y un post inexistente va al 404', () => {
    for (const lang of ['es', 'en']) {
      expect(rewrite(`https://cherced.test/${lang}/blog/catalog`)).not.toContain('__missing-content')
      expect(rewrite(`https://cherced.test/${lang}/blog/no-existe`)).toContain('__missing-content')
    }
  })
})

describe('U17: el 404 sabe si faltó un post o un caso', () => {
  const missing = (url: string, init?: ConstructorParameters<typeof NextRequest>[1]) =>
    proxy(new NextRequest(url, init)).headers.get(`x-middleware-request-${MISSING_HEADER}`)

  it('el proxy le pasa al render la sección que faltó', () => {
    expect(missing('https://cherced.test/es/portfolio/99')).toBe('portfolio')
    expect(missing('https://cherced.test/en/blog/no-existe')).toBe('blog')
    expect(missing('https://cherced.test/es/blog/tag/no-existe-esta-etiqueta')).toBe('blog')
    expect(missing('https://cherced.test/es/no-existe')).toBeNull()
  })

  it('el cliente no puede mandar la sección por su cuenta', () => {
    expect(missing('https://cherced.test/es/no-existe', { headers: { [MISSING_HEADER]: 'blog' } })).toBeNull()
    expect(missing('https://cherced.test/es/portfolio/99', { headers: { [MISSING_HEADER]: 'blog' } })).toBe('portfolio')
  })

  it('solo reconoce blog y portafolio', () => {
    expect(missingSection('blog')).toBe('blog')
    expect(missingSection('portfolio')).toBe('portfolio')
    expect(missingSection('admin')).toBeNull()
    expect(missingSection(null)).toBeNull()
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

  it('016 A-1603: los p-… llegan por una reescritura del proxy a una página interna, sin abrir rutas dinámicas', () => {
    expect(source('app/[lang]/blog/publicado/page.tsx')).toMatch(/if \(!resolved\) notFound\(\)/)
    expect(source('app/[lang]/blog/publicado/page.tsx')).toContain('PUBLISHED_HEADER')
  })
})
