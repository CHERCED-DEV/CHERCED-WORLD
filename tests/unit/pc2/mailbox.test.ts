import { describe, expect, it } from 'vitest'
import { AUTHOR_HINT_COOKIE, hasAuthorHint, mailboxHref } from '@/lib/auth/author-hint'

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

  it('D-R1: el visitante va a Contacto y el autor, con su marca, al panel', () => {
    expect(mailboxHref('es', false)).toBe('/es/contactMe')
    expect(mailboxHref('en', false)).toBe('/en/contactMe')
    expect(mailboxHref('es', true)).toBe('/es/inbox')
    expect(mailboxHref('en', true)).toBe('/en/inbox')
  })
})

