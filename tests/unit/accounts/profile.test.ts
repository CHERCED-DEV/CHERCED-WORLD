import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { fieldErrors, githubHandle, googlePicture, linkedinUrl, preferencesSchema, profileFieldsSchema, sniffAvatar } = await import('@/lib/accounts/profile')
const { consentsOf } = await import('@/lib/accounts/data')
const { createMemoryProfileRepo } = await import('@/lib/data/memory/profiles')

const NOW = new Date('2026-11-14T15:00:00Z')
const CONSENT = { version: '2026-11-14', acceptedAt: NOW }

const EMPTY = { country: '', city: '', role: '', company: '', linkedin: '', github: '', languages: [], reason: '', reasonNote: '' }

describe('perfil de Mi cuenta (040)', () => {
  it('todo es opcional: un formulario vacío guarda nulos', () => {
    const parsed = profileFieldsSchema.parse(EMPTY)
    expect(parsed).toEqual({ country: null, city: null, role: null, company: null, linkedin: null, github: null, languages: [], reason: null, reasonNote: null })
  })

  it('limpia el texto y normaliza país, LinkedIn y GitHub', () => {
    const parsed = profileFieldsSchema.parse({
      ...EMPTY,
      country: 'co',
      city: '  Armenia <script> ',
      linkedin: 'linkedin.com/in/cherced',
      github: 'https://github.com/CHERCED-DEV',
    })
    expect(parsed.country).toBe('CO')
    expect(parsed.city).toBe('Armenia script')
    expect(parsed.linkedin).toBe('https://www.linkedin.com/in/cherced')
    expect(parsed.github).toBe('CHERCED-DEV')
  })

  it('rechaza enlaces de otros sitios y países que no existen', () => {
    expect(linkedinUrl('https://evil.example/in/cherced')).toBeUndefined()
    expect(githubHandle('https://gitlab.com/cherced')).toBeUndefined()
    const result = profileFieldsSchema.safeParse({ ...EMPTY, country: 'ZZ', linkedin: 'https://evil.example/in/x' })
    expect(result.success).toBe(false)
    if (!result.success) expect(fieldErrors(result.error)).toMatchObject({ country: 'invalid', linkedin: 'invalid' })
  })

  it('solo acepta fotos de Google por https', () => {
    expect(googlePicture('https://lh3.googleusercontent.com/a/abc=s96-c')).toMatch(/^https:\/\/lh3\.googleusercontent\.com\//)
    expect(googlePicture('http://lh3.googleusercontent.com/a/abc')).toBeNull()
    expect(googlePicture('https://googleusercontent.com.evil.example/a')).toBeNull()
  })

  it('reconoce WebP y JPEG por sus bytes, no por el nombre', () => {
    const webp = new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBP'].map((c) => c.charCodeAt(0))))
    expect(sniffAvatar(webp)).toBe('image/webp')
    expect(sniffAvatar(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(sniffAvatar(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBeNull()
  })

  it('las preferencias aceptan vacío como "sin preferencia"', () => {
    expect(preferencesSchema.parse({ lang: '', theme: 'light' })).toEqual({ lang: null, theme: 'light' })
    expect(preferencesSchema.safeParse({ lang: 'fr', theme: null }).success).toBe(false)
  })
})

describe('el perfil en memoria', () => {
  it('sin autorización no crea el perfil; con ella sí, y borrar lo quita todo', async () => {
    const repo = createMemoryProfileRepo()
    expect(await repo.save('a1', { city: 'Armenia' }, NOW, null)).toBeNull()
    const saved = await repo.save('a1', { city: 'Armenia' }, NOW, CONSENT)
    expect(saved?.city).toBe('Armenia')
    expect(saved?.consent.version).toBe('2026-11-14')
    await repo.save('a1', { avatar: { type: 'image/webp', data: new Uint8Array([1, 2, 3]) } }, NOW, null)
    expect((await repo.get('a1'))?.avatar?.bytes).toBe(3)
    await repo.remove('a1')
    expect(await repo.get('a1')).toBeNull()
  })

  it('las autorizaciones listan ingreso, perfil y comentarios con su fecha', () => {
    const entries = consentsOf(
      { createdAt: new Date('2026-11-13T10:00:00Z') },
      { consent: CONSENT } as never,
      [{ consentAt: new Date('2026-11-13T12:00:00Z') }, { consentAt: NOW }, { consentAt: null }] as never,
    )
    expect(entries.map((entry) => entry.kind)).toEqual(['signIn', 'profile', 'comments'])
    expect(entries[2]).toMatchObject({ count: 2, acceptedAt: NOW })
  })
})
