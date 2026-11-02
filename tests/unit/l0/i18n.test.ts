import { describe, expect, it } from 'vitest'
import {
  alternates,
  isLocale,
  localeCookieString,
  localizedPath,
  MissingTranslationError,
  otherLocale,
  pickKeys,
  stripLocale,
  switchLocalePath,
  t,
} from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

describe('isLocale', () => {
  it('acepta solo es y en', () => {
    expect(isLocale('es')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(isLocale('ES')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
    expect(otherLocale('es')).toBe('en')
  })
})

describe('rutas por idioma', () => {
  it('antepone el idioma', () => {
    expect(localizedPath('en', '/blog/post1')).toBe('/en/blog/post1')
    expect(localizedPath('es', '/')).toBe('/es')
    expect(localizedPath('es', '')).toBe('/es')
    expect(localizedPath('en', 'aboutMe')).toBe('/en/aboutMe')
    expect(localizedPath('en', '/portfolio/3/')).toBe('/en/portfolio/3')
  })

  it('reemplaza un prefijo existente y conserva query y hash', () => {
    expect(localizedPath('en', '/es/blog')).toBe('/en/blog')
    expect(localizedPath('es', '/en/aboutMe?x=1#skills')).toBe('/es/aboutMe?x=1#skills')
    expect(localizedPath('en', '/#top')).toBe('/en#top')
  })

  it('cambia de idioma sin perder la ruta', () => {
    expect(switchLocalePath('/es/aboutMe', 'en')).toBe('/en/aboutMe')
    expect(switchLocalePath('/en/portfolio/3', 'es')).toBe('/es/portfolio/3')
    expect(switchLocalePath('/es', 'en')).toBe('/en')
    expect(switchLocalePath('/aboutMe', 'en')).toBe('/en/aboutMe')
  })

  it('separa el idioma del resto de la ruta', () => {
    expect(stripLocale('/es/blog/post1')).toEqual({ locale: 'es', path: '/blog/post1' })
    expect(stripLocale('/en')).toEqual({ locale: 'en', path: '/' })
    expect(stripLocale('/essay')).toEqual({ locale: null, path: '/essay' })
  })

  it('declara canonical, versiones por idioma y x-default sin prefijo', () => {
    expect(alternates('/en/blog/post1')).toEqual({
      canonical: '/en/blog/post1',
      languages: { es: '/es/blog/post1', en: '/en/blog/post1', 'x-default': '/blog/post1' },
    })
    expect(alternates('/es')).toEqual({
      canonical: '/es',
      languages: { es: '/es', en: '/en', 'x-default': '/' },
    })
    expect(alternates('/services').canonical).toBe('/es/services')
  })

  it('arma la cookie de idioma', () => {
    expect(localeCookieString('en')).toBe('cw-lang=en; Path=/; Max-Age=31536000; SameSite=Lax')
  })
})

describe('t', () => {
  const dict = { greeting: 'Hola {name}', count: '{n} min de lectura', plain: 'Inicio' }

  it('traduce e interpola variables', () => {
    expect(t(dict, 'plain')).toBe('Inicio')
    expect(t(dict, 'greeting', { name: 'Camilo' })).toBe('Hola Camilo')
    expect(t(dict, 'count', { n: 4 })).toBe('4 min de lectura')
  })

  it('deja el marcador si falta la variable', () => {
    expect(t(dict, 'greeting')).toBe('Hola {name}')
    expect(t(dict, 'greeting', { other: 'x' })).toBe('Hola {name}')
  })

  it('lanza un error en vez de devolver la clave cruda', () => {
    expect(() => t(dict, 'nope')).toThrow(MissingTranslationError)
    expect(() => t(dict, 'toString')).toThrow(MissingTranslationError)
  })

  it('extrae solo las claves pedidas', () => {
    expect(pickKeys(dict, ['plain'])).toEqual({ plain: 'Inicio' })
  })
})

describe('getDictionary', () => {
  it('carga el namespace del idioma pedido', async () => {
    const es = await getDictionary('es', 'common')
    const en = await getDictionary('en', 'common')
    expect(t(es, 'nav.home')).toBe('Inicio')
    expect(t(en, 'nav.home')).toBe('Home')
  })

  it('completa con español lo que falte en inglés', async () => {
    const es = await getDictionary('es', 'common')
    const en = await getDictionary('en', 'common')
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort())
    expect(Object.isFrozen(en)).toBe(true)
  })
})
