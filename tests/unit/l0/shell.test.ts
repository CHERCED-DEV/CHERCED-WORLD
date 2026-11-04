import { describe, expect, it } from 'vitest'
import { copyrightYears, isPaletteShortcut, NAV_ITEMS, navItems, parentPath, shellLabels } from '@/components/shell/nav'
import { getDictionary } from '@/lib/i18n/server'

describe('navegación del shell', () => {
  it('lleva a las 6 secciones públicas en ambos idiomas', async () => {
    expect(NAV_ITEMS.map((item) => item.path)).toEqual(['/', '/aboutMe', '/services', '/portfolio', '/blog', '/contactMe'])
    const es = navItems(await getDictionary('es', 'common'))
    const en = navItems(await getDictionary('en', 'common'))
    expect(es.map((item) => item.label)).toEqual(['Inicio', 'Sobre mí', 'Servicios', 'Portafolio', 'Blog', 'Contáctame'])
    expect(en.map((item) => item.label)).toEqual(['Home', 'About me', 'Services', 'Portfolio', 'Blog', 'Contact me'])
  })

  it('resuelve todas las etiquetas del shell sin claves crudas', async () => {
    for (const lang of ['es', 'en'] as const) {
      const labels = shellLabels(await getDictionary(lang, 'common'))
      for (const value of Object.values(labels)) expect(value).not.toMatch(/^[a-z]+\.[a-zA-Z.]+$/)
    }
  })

  it('muestra "regresar" solo en páginas de detalle', () => {
    expect(parentPath('/es/portfolio/3')).toBe('/es/portfolio')
    expect(parentPath('/en/blog/post1')).toBe('/en/blog')
    expect(parentPath('/es/aboutMe')).toBeNull()
    expect(parentPath('/es')).toBeNull()
    expect(parentPath('/es/inbox/setup')).toBe('/es')
    expect(parentPath('/en/inbox/comments')).toBe('/en/inbox')
  })

  it('reconoce Ctrl+K y ⌘+K, sin modificadores extra', () => {
    const base = { key: 'k', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false }
    expect(isPaletteShortcut({ ...base, ctrlKey: true })).toBe(true)
    expect(isPaletteShortcut({ ...base, metaKey: true, key: 'K' })).toBe(true)
    expect(isPaletteShortcut(base)).toBe(false)
    expect(isPaletteShortcut({ ...base, ctrlKey: true, shiftKey: true })).toBe(false)
    expect(isPaletteShortcut({ ...base, ctrlKey: true, key: 'j' })).toBe(false)
  })

  it('arma el copyright C-01', () => {
    expect(copyrightYears(2026)).toBe('2023–2026')
    expect(copyrightYears(2023)).toBe('2023')
  })
})
