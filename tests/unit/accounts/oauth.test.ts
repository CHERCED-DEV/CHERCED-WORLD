import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  authorizeUrl,
  displayName,
  newOAuthFlow,
  OAUTH_FLOW_MAX_AGE_S,
  openFlow,
  profileFromIdToken,
  safeNext,
  sealFlow,
} from '@/lib/auth/oauth'

const KEY = createHash('sha256').update('solo-pruebas').digest()
const NOW = new Date('2026-11-13T15:00:00Z')
const CLIENT = 'cliente-de-prueba.apps.googleusercontent.com'
const seconds = Math.floor(NOW.getTime() / 1000)

function idToken(claims: Record<string, unknown>): string {
  const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${part({ alg: 'RS256' })}.${part(claims)}.firma`
}

const valid = {
  iss: 'https://accounts.google.com',
  aud: CLIENT,
  sub: '1234567890',
  email: 'Ana.Prueba@Example.com',
  email_verified: true,
  name: 'Ana Prueba',
  nonce: 'nonce-ok',
  iat: seconds - 10,
  exp: seconds + 3600,
}

describe('id_token de Google (A-1704)', () => {
  it('acepta un token válido y normaliza el correo', () => {
    expect(profileFromIdToken(idToken(valid), { clientId: CLIENT, nonce: 'nonce-ok', now: NOW })).toEqual({
      googleSub: '1234567890',
      email: 'ana.prueba@example.com',
      name: 'Ana Prueba',
    })
  })

  it.each([
    ['otro emisor', { iss: 'https://evil.example.com' }],
    ['otra audiencia', { aud: 'otro-cliente' }],
    ['vencido', { exp: seconds - 3600 }],
    ['emitido en el futuro', { iat: seconds + 3600 }],
    ['otro nonce', { nonce: 'nonce-robado' }],
    ['correo sin verificar', { email_verified: false }],
    ['sin sub', { sub: '' }],
    ['correo inválido', { email: 'no-es-correo' }],
  ])('rechaza un token con %s', (_case, patch) => {
    expect(profileFromIdToken(idToken({ ...valid, ...patch }), { clientId: CLIENT, nonce: 'nonce-ok', now: NOW })).toBeNull()
  })

  it('rechaza lo que no es un JWT', () => {
    expect(profileFromIdToken('basura', { clientId: CLIENT, nonce: 'nonce-ok', now: NOW })).toBeNull()
    expect(profileFromIdToken(null, { clientId: CLIENT, nonce: 'nonce-ok', now: NOW })).toBeNull()
  })

  it('el nombre visible no trae marcado y cae al correo si falta', () => {
    expect(displayName('<b>Ana</b>', 'ana@example.com')).toBe('bAna/b')
    expect(displayName('', 'ana@example.com')).toBe('ana')
  })
})

describe('flujo OAuth sellado en cookie', () => {
  it('ida y vuelta conserva state, verifier, nonce y destino', () => {
    const flow = newOAuthFlow('/es/blog/post7', 'es', NOW)
    expect(openFlow(sealFlow(flow, KEY), KEY, NOW)).toEqual(flow)
  })

  it('rechaza una cookie alterada, con otra llave o vencida', () => {
    const sealed = sealFlow(newOAuthFlow('/es/blog', 'es', NOW), KEY)
    const [payload, mac] = sealed.split('.')
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload!, 'base64url').toString()), next: '/en/account' })).toString('base64url')
    expect(openFlow(`${forged}.${mac}`, KEY, NOW)).toBeNull()
    expect(openFlow(sealed, createHash('sha256').update('otra').digest(), NOW)).toBeNull()
    expect(openFlow(sealed, KEY, new Date(NOW.getTime() + (OAUTH_FLOW_MAX_AGE_S + 1) * 1000))).toBeNull()
  })

  it('la URL de Google pide PKCE S256, state, nonce y solo openid email profile', () => {
    const flow = newOAuthFlow('/es/account', 'es', NOW)
    const url = new URL(authorizeUrl({ clientId: CLIENT, redirect: 'https://sitio.test/api/auth/google/callback', flow }))
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(url.searchParams.get('scope')).toBe('openid email profile')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('code_challenge')).toBe(createHash('sha256').update(flow.verifier).digest('base64url'))
    expect(url.searchParams.get('state')).toBe(flow.state)
    expect(url.searchParams.get('nonce')).toBe(flow.nonce)
    expect(url.searchParams.get('code_challenge')).not.toBe(flow.verifier)
  })
})

describe('destino después de ingresar', () => {
  it('acepta rutas propias del sitio', () => {
    expect(safeNext('/es/blog/post7', 'es')).toBe('/es/blog/post7')
    expect(safeNext('/en/account', 'en')).toBe('/en/account')
  })

  it.each(['https://evil.example.com', '//evil.example.com', '/es//evil', '/es/../admin', 'javascript:alert(1)', '/fr/blog', ''])(
    'manda %s a Mi cuenta',
    (value) => {
      expect(safeNext(value, 'es')).toBe('/es/account')
    },
  )
})
