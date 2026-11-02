import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { config, localeFromAcceptLanguage, proxy, shouldBypass } from '@/proxy'

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, 'https://cherced.test'), { headers })
}

function location(response: Response): string | null {
  const value = response.headers.get('location')
  if (!value) return null
  const url = new URL(value, 'https://cherced.test')
  return `${url.pathname}${url.search}`
}

const routes2023 = ['/', '/aboutMe', '/services', '/portfolio', '/portfolio/3', '/blog', '/blog/post1', '/contactMe', '/inbox']

describe('exclusiones', () => {
  it.each(['/_next/static/chunk.js', '/api/admin/updates', '/api', '/capsule/home.webp', '/robots.txt', '/assets/icons/brandLogo.png', '/favicon.ico', '/sitemap.xml'])(
    'deja pasar %s sin cambios',
    (path) => {
      expect(shouldBypass(path)).toBe(true)
      const response = proxy(request(path))
      expect(response.status).toBe(200)
      expect(response.headers.get('x-middleware-next')).toBe('1')
      expect(response.cookies.get('cw-lang')).toBeUndefined()
    },
  )

  it('no confunde rutas que solo empiezan parecido', () => {
    expect(shouldBypass('/apiary')).toBe(false)
    expect(shouldBypass('/capsules')).toBe(false)
  })

  it('el matcher excluye _next, api y capsule', () => {
    expect(config.matcher).toEqual(['/((?!_next/|api/|capsule/).*)'])
  })
})

describe('rutas con idioma', () => {
  it('pasa y fija la cookie cuando difiere', () => {
    const response = proxy(request('/en/aboutMe', { cookie: 'cw-lang=es' }))
    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(response.cookies.get('cw-lang')?.value).toBe('en')
  })

  it('no reescribe la cookie si ya coincide', () => {
    const response = proxy(request('/es', { cookie: 'cw-lang=es' }))
    expect(response.cookies.get('cw-lang')).toBeUndefined()
  })

  it('no cambia la preferencia con un prefetch', () => {
    const variants: Record<string, string>[] = [{ 'next-router-prefetch': '1' }, { purpose: 'prefetch' }, { 'sec-purpose': 'prefetch;prerender' }]
    for (const headers of variants) {
      const response = proxy(request('/en/blog', headers))
      expect(response.cookies.get('cw-lang')).toBeUndefined()
    }
  })
})

describe('redirección 307 al idioma preferido', () => {
  it.each(routes2023)('redirige %s a español por defecto', (path) => {
    const response = proxy(request(path))
    expect(response.status).toBe(307)
    expect(location(response)).toBe(path === '/' ? '/es' : `/es${path}`)
  })

  it.each(routes2023)('redirige %s según Accept-Language', (path) => {
    const response = proxy(request(path, { 'accept-language': 'en-US,en;q=0.9,es;q=0.8' }))
    expect(location(response)).toBe(path === '/' ? '/en' : `/en${path}`)
  })

  it('la cookie gana sobre Accept-Language', () => {
    const response = proxy(request('/blog', { cookie: 'cw-lang=es', 'accept-language': 'en' }))
    expect(location(response)).toBe('/es/blog')
  })

  it('ignora una cookie inválida', () => {
    const response = proxy(request('/blog', { cookie: 'cw-lang=fr', 'accept-language': 'en' }))
    expect(location(response)).toBe('/en/blog')
  })

  it('conserva la query', () => {
    const response = proxy(request('/portfolio?tech=REACT'))
    expect(location(response)).toBe('/es/portfolio?tech=REACT')
  })

  it('trata un idioma desconocido como ruta sin prefijo', () => {
    const response = proxy(request('/fr/aboutMe'))
    expect(location(response)).toBe('/es/fr/aboutMe')
  })
})

describe('localeFromAcceptLanguage', () => {
  it('elige el primer es o en según q', () => {
    expect(localeFromAcceptLanguage('fr-FR,fr;q=0.9,en;q=0.8,es;q=0.7')).toBe('en')
    expect(localeFromAcceptLanguage('es-CO,es;q=0.9,en;q=0.8')).toBe('es')
    expect(localeFromAcceptLanguage('en;q=0.5,es;q=0.9')).toBe('es')
    expect(localeFromAcceptLanguage('EN-gb')).toBe('en')
  })

  it('devuelve null si no hay idioma soportado', () => {
    expect(localeFromAcceptLanguage('fr-FR,de;q=0.9')).toBeNull()
    expect(localeFromAcceptLanguage('*')).toBeNull()
    expect(localeFromAcceptLanguage('en;q=0')).toBeNull()
    expect(localeFromAcceptLanguage(null)).toBeNull()
    expect(localeFromAcceptLanguage('')).toBeNull()
  })
})
