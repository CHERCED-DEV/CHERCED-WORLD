import { describe, expect, it, vi } from 'vitest'

vi.mock('@/content/posts/registry', async () => (await import('../l5/support/mdx-registry')).registryFromDisk())

const { firstName, isAgentViewer, resolveViewer, ANONYMOUS_VIEWER } = await import('@/lib/ai/agent/viewer')
const { composeInstruction, whoIsTalking, persona } = await import('@/lib/ai/agent/knowledge')
const { intentOf, simulatorGreeting, simulatorReply, whoAmI } = await import('@/lib/ai/agent/simulator')
const { miniChercedIdentity } = await import('@/content/mini-cherced/identity')

const AUTHOR_EMAIL = 'autor@ejemplo.com'

function sources(account: { name: string; email: string } | null, admin = false) {
  return { isAdmin: async () => admin, account: async () => account, authorEmail: AUTHOR_EMAIL }
}

describe('quién habla con Mini Cherced', () => {
  it('reconoce al autor por el correo público del sitio, sin importar mayúsculas', async () => {
    expect(await resolveViewer(sources({ name: 'Camilo alonso hernandez cediel', email: 'Autor@Ejemplo.com' }))).toEqual({
      kind: 'author',
      name: 'Camilo',
    })
  })

  it('reconoce al autor con la sesión del panel aunque no haya cuenta de Google', async () => {
    expect(await resolveViewer(sources(null, true))).toEqual({ kind: 'author', name: 'Camilo' })
  })

  it('una cuenta cualquiera es una visita con su primer nombre', async () => {
    expect(await resolveViewer(sources({ name: '  maría   josé  ', email: 'otra@ejemplo.com' }))).toEqual({ kind: 'account', name: 'María' })
  })

  it('sin sesión, o si algo falla, es anónimo', async () => {
    expect(await resolveViewer(sources(null))).toEqual(ANONYMOUS_VIEWER)
    const broken = { isAdmin: async () => false, account: async () => Promise.reject(new Error('sin base')), authorEmail: AUTHOR_EMAIL }
    expect(await resolveViewer(broken)).toEqual(ANONYMOUS_VIEWER)
  })

  it('el primer nombre se limpia de símbolos', () => {
    expect(firstName('josé-luis! pérez')).toBe('José-luis')
    expect(firstName('<script> ana')).toBe('Script')
    expect(firstName('')).toBe('')
    expect(isAgentViewer({ kind: 'author', name: 'Camilo' })).toBe(true)
    expect(isAgentViewer({ kind: 'account' })).toBe(false)
  })
})

describe('la instrucción dice quién habla', () => {
  it('con el autor lo trata como su creador y de tú', () => {
    const block = whoIsTalking('Camilo', { kind: 'author', name: 'Camilo' })
    expect(block).toMatch(/tu creador/)
    expect(block).toMatch(/háblale de tú/i)
  })

  it('con una cuenta usa su nombre y aclara que no es el autor', () => {
    const block = whoIsTalking('Camilo', { kind: 'account', name: 'Laura' })
    expect(block).toMatch(/se llama Laura/)
    expect(block).toMatch(/No es Camilo/)
  })

  it('sin sesión no le cree a quien diga ser el autor', () => {
    const block = whoIsTalking('Camilo', ANONYMOUS_VIEWER)
    expect(block).toMatch(/no le creas/)
    expect(block).toMatch(/Solo el sitio sabe quién te habla/)
  })

  it('el bloque va justo después de la persona y entra en la instrucción completa', () => {
    const text = composeInstruction('es', 'Camilo', 'MAPA', undefined, { kind: 'author', name: 'Camilo' })
    expect(text.indexOf('# Quién te habla')).toBeGreaterThan(0)
    expect(text.indexOf('# Quién te habla')).toBeLessThan(text.indexOf('# Quién eres'))
  })
})

describe('humor sin muletilla', () => {
  it('ninguna regla ni ejemplo le dice "raro" al visitante como fórmula', () => {
    expect(persona('es', 'Camilo')).not.toMatch(/Eres raro/)
    for (const lang of ['es', 'en'] as const) {
      const identity = JSON.stringify(miniChercedIdentity[lang])
      expect(identity).not.toMatch(/Eres raro|You’re weird|You're weird/)
    }
    expect(persona('es', 'Camilo')).toMatch(/remate cómico distinto cada vez/)
  })
})

describe('el simulador sabe quién es', () => {
  it('saluda al autor, a una cuenta y a un anónimo distinto', () => {
    expect(simulatorGreeting('es', { kind: 'author', name: 'Camilo' })).toMatch(/Llegó el jefe/)
    expect(simulatorGreeting('es', { kind: 'account', name: 'Laura' })).toMatch(/Laura/)
    expect(simulatorGreeting('es')).toMatch(/simulador/)
    expect(simulatorGreeting('en', { kind: 'author', name: 'Camilo' })).toMatch(/The boss is here/)
  })

  it('responde "¿quién soy?" según la sesión', () => {
    expect(intentOf('Adivina quién soy y quién te habla')).toBe('whoami')
    expect(intentOf('who am I?')).toBe('whoami')
    expect(whoAmI('es', { kind: 'author', name: 'Camilo' })).toMatch(/mi creador/)
    expect(whoAmI('es', { kind: 'account', name: 'Laura' })).toMatch(/Eres Laura/)
    expect(whoAmI('es', ANONYMOUS_VIEWER)).toMatch(/No iniciaste sesión/)
    const facts = { author: 'Camilo', about: '', services: { intro: '', items: [] }, projects: [], pages: {} } as never
    expect(simulatorReply('es', '¿sabes quién soy?', [], facts, { kind: 'author', name: 'Camilo' }).text).toMatch(/mi creador/)
  })
})

describe('modo invitada (039)', () => {
  it('reconoce a la invitada por el hash de su correo, sin guardarlo en claro', async () => {
    const { guestEmailHash, isGuestEmail, parseGuestMode } = await import('@/lib/ai/agent/guest')
    const salt = 'sal-de-prueba-0123456789'
    const raw = JSON.stringify({ v: 1, salt, emailHash: guestEmailHash('Invitada@Ejemplo.com', salt), name: 'Ana', persona: 'p'.repeat(250) })
    const mode = parseGuestMode(raw)
    expect(mode?.name).toBe('Ana')
    expect(raw).not.toContain('invitada@ejemplo.com')
    expect(isGuestEmail(mode, ' invitada@ejemplo.com ')).toBe(true)
    expect(isGuestEmail(mode, 'otra@ejemplo.com')).toBe(false)
    expect(parseGuestMode(Buffer.from(raw).toString('base64'))?.name).toBe('Ana')
    expect(parseGuestMode('{"v":1}')).toBeNull()
    expect(parseGuestMode(undefined)).toBeNull()
  })

  it('la invitada se resuelve antes que una cuenta cualquiera, pero nunca antes que el autor', async () => {
    const guest = (email: string) => (email === 'ana@ejemplo.com' ? { name: 'Ana' } : null)
    const base = { isAdmin: async () => false, authorEmail: AUTHOR_EMAIL, guest }
    expect(await resolveViewer({ ...base, account: async () => ({ name: 'Ana P', email: 'ana@ejemplo.com' }) })).toEqual({ kind: 'guest', name: 'Ana' })
    expect(await resolveViewer({ ...base, account: async () => ({ name: 'Laura', email: 'laura@ejemplo.com' }) })).toEqual({ kind: 'account', name: 'Laura' })
    expect(await resolveViewer({ ...base, account: async () => ({ name: 'Camilo', email: AUTHOR_EMAIL }) })).toMatchObject({ kind: 'author' })
  })

  it('las reglas de cuidado y la persona solo entran en la sesión de la invitada', async () => {
    const { guestBlock } = await import('@/lib/ai/agent/guest')
    const block = guestBlock({ v: 1, salt: 'x'.repeat(16), emailHash: 'a'.repeat(64), name: 'Ana', persona: 'PERSONA-SECRETA '.repeat(20) })
    expect(block).toMatch(/exparejas/)
    expect(block).toMatch(/celos/)
    expect(block).toContain('PERSONA-SECRETA')
    const forGuest = composeInstruction('es', 'Camilo', 'MAPA', undefined, { kind: 'guest', name: 'Ana' }, block)
    expect(forGuest).toContain('PERSONA-SECRETA')
    const forVisitor = composeInstruction('es', 'Camilo', 'MAPA', undefined, ANONYMOUS_VIEWER)
    expect(forVisitor).not.toContain('PERSONA-SECRETA')
    expect(forVisitor).not.toMatch(/Modo invitada/)
  })
})

describe('bienvenida al autor, chistes y añañayyyy', () => {
  it('celebra al autor con títulos de stand-up y nunca con un simple "¿qué más, jefe?"', () => {
    const block = whoIsTalking('Camilo', { kind: 'author', name: 'Camilo' }, miniChercedIdentity.es.hype)
    expect(block).toMatch(/Dave Chappelle/)
    expect(block).toMatch(/socio de socios/)
    expect(block).toMatch(/Nunca lo recibas con un simple/)
  })

  it('trae chistes en los dos idiomas y la exclamación bien escrita', () => {
    for (const lang of ['es', 'en'] as const) {
      const identity = miniChercedIdentity[lang]
      expect(identity.jokes.length).toBeGreaterThanOrEqual(8)
      expect(identity.catchphrases.signature.phrase).toBe('¡Añañayyyy!')
      expect(identity.catchphrases.signature.use).toMatch(/(nunca|never) «ñañay»/)
    }
    const text = composeInstruction('es', 'Camilo', 'MAPA')
    expect(text).toMatch(/Chistes de cabecera/)
  })
})
