import { describe, expect, it } from 'vitest'
import { isSamePage } from '@/components/shell/SelfLink'

describe('enlaces a la página actual (hallazgo de R5, FR-201)', () => {
  it('reconoce la página actual sin importar la barra final, la query o el hash', () => {
    expect(isSamePage('/es', '/es')).toBe(true)
    expect(isSamePage('/es/', '/es')).toBe(true)
    expect(isSamePage('/es/privacy', '/es/privacy')).toBe(true)
    expect(isSamePage('/es/contactMe', '/es/contactMe?from=header')).toBe(true)
    expect(isSamePage('/es/privacy', '/es/privacy#cookies')).toBe(true)
  })

  it('no confunde otras páginas ni el otro idioma', () => {
    expect(isSamePage('/es/aboutMe', '/es')).toBe(false)
    expect(isSamePage('/en/privacy', '/es/privacy')).toBe(false)
    expect(isSamePage('/es/contactMe/x', '/es/contactMe')).toBe(false)
    expect(isSamePage(null, '/es')).toBe(false)
  })
})
