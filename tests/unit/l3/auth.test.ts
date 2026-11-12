import type * as nodeCrypto from 'node:crypto'
import { scryptSync, timingSafeEqual } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'

vi.setConfig({ testTimeout: 30_000 })
import { burnPasswordCheck, hashPassword, SALT_BYTES, SCRYPT_PARAMS, verifyPassword } from '@/lib/auth/password'
import {
  endSession,
  hashSessionToken,
  isWellFormedToken,
  newSessionToken,
  resolveSession,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_TOUCH_INTERVAL_MS,
  startSession,
} from '@/lib/auth/session'
import {
  ensureSetupCode,
  formatSetupCode,
  generateSetupCode,
  hashSetupCode,
  SETUP_CODE_TTL_MS,
  setupLogLine,
  verifySetupCode,
} from '@/lib/auth/setup'
import { createMemoryAdminRepo } from '@/lib/data/memory'
import { SESSION_IDLE_MS, SESSION_MAX_AGE_MS } from '@/lib/data/types'
import { SETUP_CODE_ALPHABET, SETUP_CODE_LENGTH } from '@/lib/validation'

vi.mock('node:crypto', async (importOriginal) => {
  const original = await importOriginal<typeof nodeCrypto>()
  return { ...original, timingSafeEqual: vi.fn(original.timingSafeEqual) }
})

describe('password (scrypt)', () => {
  it('usa N=2^17 y sal de 16 bytes, y nunca guarda la contraseña', async () => {
    const credential = await hashPassword('una-contraseña-larga')
    expect(SCRYPT_PARAMS, 'R4.1 B7: el mínimo de OWASP').toEqual({ N: 131072, r: 8, p: 1, keyLen: 64 })
    expect(credential.params).toEqual(SCRYPT_PARAMS)
    expect(Buffer.from(credential.salt, 'base64')).toHaveLength(SALT_BYTES)
    expect(Buffer.from(credential.hash, 'base64')).toHaveLength(64)
    expect(JSON.stringify(credential)).not.toContain('una-contraseña-larga')
  })

  it('R4.1 B7: la contraseña guardada con N=2^15 sigue entrando después de subir el costo', async () => {
    const salt = Buffer.alloc(SALT_BYTES, 7)
    const params = { N: 2 ** 15, r: 8, p: 1, keyLen: 64 }
    const hash = scryptSync('clave de antes', salt, 64, { N: params.N, r: params.r, p: params.p, maxmem: 64 * 1024 * 1024 })
    const old = { hash: hash.toString('base64'), salt: salt.toString('base64'), params, createdAt: new Date(), updatedAt: new Date() }
    expect(await verifyPassword('clave de antes', old)).toBe(true)
    expect(await verifyPassword('otra clave', old)).toBe(false)
  })

  it('verifica la contraseña correcta y rechaza las demás', async () => {
    const credential = await hashPassword('correct horse battery')
    expect(await verifyPassword('correct horse battery', credential)).toBe(true)
    expect(await verifyPassword('correct horse batterY', credential)).toBe(false)
    expect(await verifyPassword('', credential)).toBe(false)
  })

  it('genera una sal distinta cada vez', async () => {
    const a = await hashPassword('misma contraseña')
    const b = await hashPassword('misma contraseña')
    expect(a.salt).not.toBe(b.salt)
    expect(a.hash).not.toBe(b.hash)
  })

  it('normaliza Unicode para que la misma contraseña siempre coincida', async () => {
    const credential = await hashPassword('contraseña-segura')
    expect(await verifyPassword('contraseña-segura', credential)).toBe(true)
  })

  it('rechaza credenciales con parámetros fuera de rango o dañadas', async () => {
    const credential = await hashPassword('otra contraseña')
    expect(await verifyPassword('otra contraseña', { ...credential, params: { ...credential.params, N: 2 ** 24 } })).toBe(false)
    expect(await verifyPassword('otra contraseña', { ...credential, hash: 'corto' })).toBe(false)
  })

  it('compara en tiempo constante', async () => {
    const credential = await hashPassword('tiempo constante 1')
    vi.mocked(timingSafeEqual).mockClear()
    await verifyPassword('tiempo constante 2', credential)
    expect(timingSafeEqual).toHaveBeenCalledTimes(1)
  })

  it('tiene una verificación señuelo para cuando no hay credencial', async () => {
    await expect(burnPasswordCheck('lo que sea')).resolves.toBeUndefined()
  })
})

describe('session', () => {
  const t0 = new Date('2026-11-01T00:00:00Z')

  it('emite tokens opacos de 32 bytes y guarda solo su SHA-256', async () => {
    const admin = createMemoryAdminRepo()
    const { token, session } = await startSession(admin, t0)
    expect(Buffer.from(token, 'base64url')).toHaveLength(32)
    expect(isWellFormedToken(token)).toBe(true)
    expect(session.tokenHash).toBe(hashSessionToken(token))
    expect(session.tokenHash).toMatch(/^[0-9a-f]{64}$/)
    expect(session.tokenHash).not.toContain(token)
    expect(await admin.getSession(token)).toBeNull()
    expect(await admin.getSession(session.tokenHash)).not.toBeNull()
    expect(session.expiresAt.getTime() - t0.getTime()).toBe(SESSION_IDLE_MS)
    expect(newSessionToken()).not.toBe(token)
  })

  it('usa la cookie cw-admin HttpOnly, Secure y SameSite=Lax', () => {
    expect(SESSION_COOKIE).toBe('cw-admin')
    expect(SESSION_COOKIE_OPTIONS).toEqual({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
  })

  it('rechaza tokens ausentes, mal formados o desconocidos', async () => {
    const admin = createMemoryAdminRepo()
    expect(await resolveSession(admin, undefined, t0, { touch: true })).toBeNull()
    expect(await resolveSession(admin, 'admin', t0, { touch: true })).toBeNull()
    expect(await resolveSession(admin, newSessionToken(), t0, { touch: true })).toBeNull()
  })

  it('desliza el vencimiento como mucho una vez por minuto', async () => {
    const admin = createMemoryAdminRepo()
    const { token, session } = await startSession(admin, t0)
    const touch = vi.spyOn(admin, 'touchSession')
    await resolveSession(admin, token, new Date(t0.getTime() + 30_000), { touch: true })
    expect(touch).not.toHaveBeenCalled()
    const later = new Date(t0.getTime() + SESSION_TOUCH_INTERVAL_MS)
    const touched = await resolveSession(admin, token, later, { touch: true })
    expect(touch).toHaveBeenCalledTimes(1)
    expect(touched?.expiresAt).toEqual(new Date(later.getTime() + SESSION_IDLE_MS))
    expect((await admin.getSession(session.tokenHash))?.lastActivityAt).toEqual(later)
  })

  it('R4.1 M1: una sesión usada sin parar vence igual a los 7 días de creada', async () => {
    const admin = createMemoryAdminRepo()
    const { token, session } = await startSession(admin, t0)
    let now = t0
    while (now.getTime() - t0.getTime() < SESSION_MAX_AGE_MS - SESSION_IDLE_MS) {
      now = new Date(now.getTime() + SESSION_IDLE_MS - 60_000)
      expect(await resolveSession(admin, token, now, { touch: true })).not.toBeNull()
    }
    expect(await resolveSession(admin, token, new Date(t0.getTime() + SESSION_MAX_AGE_MS), { touch: true })).toBeNull()
    expect(await admin.getSession(session.tokenHash)).toBeNull()
  })

  it('no desliza cuando quien llama pide solo leer', async () => {
    const admin = createMemoryAdminRepo()
    const { token } = await startSession(admin, t0)
    const touch = vi.spyOn(admin, 'touchSession')
    await resolveSession(admin, token, new Date(t0.getTime() + 3_600_000), { touch: false })
    expect(touch).not.toHaveBeenCalled()
  })

  it('vence a las 12 h sin actividad y borra la sesión', async () => {
    const admin = createMemoryAdminRepo()
    const { token, session } = await startSession(admin, t0)
    const almost = new Date(t0.getTime() + SESSION_IDLE_MS - 1)
    expect(await resolveSession(admin, token, almost, { touch: false })).not.toBeNull()
    const expired = new Date(t0.getTime() + SESSION_IDLE_MS)
    expect(await resolveSession(admin, token, expired, { touch: true })).toBeNull()
    expect(await admin.getSession(session.tokenHash)).toBeNull()
  })

  it('una sesión activa sigue viva pasadas 12 h desde el login', async () => {
    const admin = createMemoryAdminRepo()
    const { token } = await startSession(admin, t0)
    for (let hour = 6; hour <= 24; hour += 6) {
      expect(await resolveSession(admin, token, new Date(t0.getTime() + hour * 3_600_000), { touch: true })).not.toBeNull()
    }
  })

  it('cerrar sesión borra el registro', async () => {
    const admin = createMemoryAdminRepo()
    const { token } = await startSession(admin, t0)
    await endSession(admin, token)
    expect(await resolveSession(admin, token, t0, { touch: true })).toBeNull()
  })
})

describe('setup', () => {
  const t0 = new Date('2026-11-01T00:00:00Z')

  it('genera códigos de 8 caracteres del alfabeto sin ambigüedades', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateSetupCode()
      expect(code).toHaveLength(SETUP_CODE_LENGTH)
      for (const char of code) expect(SETUP_CODE_ALPHABET).toContain(char)
    }
  })

  it('formatea y normaliza el código', () => {
    expect(formatSetupCode('abcdefgh')).toBe('ABCD-EFGH')
    expect(hashSetupCode('abcd-efgh')).toBe(hashSetupCode('ABCDEFGH'))
  })

  it('escribe la línea de log del quickstart', () => {
    expect(setupLogLine('ABCDEFGH', new Date('2026-11-02T00:00:00Z'))).toBe(
      '[CHERCED-WORLD] Código de configuración inicial: ABCD-EFGH (vence 2026-11-02T00:00:00.000Z)',
    )
  })

  it('crea un código de 24 h, lo registra una vez y guarda solo su hash', async () => {
    const admin = createMemoryAdminRepo()
    const lines: string[] = []
    expect(await ensureSetupCode(admin, t0, (line) => lines.push(line))).toBe('created')
    expect(await ensureSetupCode(admin, new Date(t0.getTime() + 1000), (line) => lines.push(line))).toBe('pending')
    expect(lines).toHaveLength(1)
    const code = /: ([A-Z0-9]{4}-[A-Z0-9]{4}) /.exec(lines[0] ?? '')?.[1] ?? ''
    const stored = await admin.getSetupCode()
    expect(stored?.expiresAt.getTime()).toBe(t0.getTime() + SETUP_CODE_TTL_MS)
    expect(stored?.codeHash).toBe(hashSetupCode(code))
    expect(JSON.stringify(stored)).not.toContain(code.replace('-', ''))
    expect(await verifySetupCode(admin, code, t0)).toBe(true)
    expect(await verifySetupCode(admin, code.toLowerCase(), t0)).toBe(true)
    expect(await verifySetupCode(admin, 'AAAA-AAAA', t0)).toBe(false)
  })

  it('el código vencido deja de servir y se reemplaza', async () => {
    const admin = createMemoryAdminRepo()
    const lines: string[] = []
    await ensureSetupCode(admin, t0, (line) => lines.push(line))
    const first = /: ([A-Z0-9-]{9}) /.exec(lines[0] ?? '')?.[1] ?? ''
    const expired = new Date(t0.getTime() + SETUP_CODE_TTL_MS)
    expect(await verifySetupCode(admin, first, expired)).toBe(false)
    expect(await ensureSetupCode(admin, expired, (line) => lines.push(line))).toBe('created')
    expect(lines).toHaveLength(2)
  })

  it('no genera código cuando ya existe la credencial', async () => {
    const admin = createMemoryAdminRepo()
    await admin.createCredential(await hashPassword('ya configurado'))
    const log = vi.fn()
    expect(await ensureSetupCode(admin, t0, log)).toBe('configured')
    expect(log).not.toHaveBeenCalled()
    expect(await admin.getSetupCode()).toBeNull()
  })
})
