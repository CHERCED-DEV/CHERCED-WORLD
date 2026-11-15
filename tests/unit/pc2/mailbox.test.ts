import { describe, expect, it } from 'vitest'
import { AUTHOR_HINT_COOKIE, hasAuthorHint } from '@/lib/auth/author-hint'
import { hasPanelHint, isOwnerEmail, PANEL_HINT_COOKIE } from '@/lib/auth/panel-hint'

describe('T944: el buzón lleva al autor a sus mensajes', () => {
  it('reconoce la marca del autor entre otras cookies, y solo con valor 1', () => {
    expect(AUTHOR_HINT_COOKIE).toBe('cw-author')
    expect(hasAuthorHint('cw-locale=es; cw-author=1')).toBe(true)
    expect(hasAuthorHint('cw-author=1')).toBe(true)
    expect(hasAuthorHint('cw-author=0; cw-locale=en')).toBe(false)
    expect(hasAuthorHint('xcw-author=1')).toBe(false)
    expect(hasAuthorHint('')).toBe(false)
    expect(hasAuthorHint(null)).toBe(false)
  })

  it('el buzón solo se muestra con la marca del panel (autor o equipo)', () => {
    expect(PANEL_HINT_COOKIE).toBe('cw-panel')
    expect(hasPanelHint('cw-locale=es; cw-panel=1')).toBe(true)
    expect(hasPanelHint('cw-panel=0')).toBe(false)
    expect(hasPanelHint(null)).toBe(false)
  })

  it('el dueño es la cuenta de Google con el correo del autor, sin importar mayúsculas', () => {
    expect(isOwnerEmail(' ChernandezCediel@gmail.com ', 'chernandezcediel@gmail.com')).toBe(true)
    expect(isOwnerEmail('otra@gmail.com', 'chernandezcediel@gmail.com')).toBe(false)
    expect(isOwnerEmail('', '')).toBe(false)
    expect(isOwnerEmail('a@b.c', null)).toBe(false)
  })
})

