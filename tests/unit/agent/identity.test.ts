import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { miniChercedIdentity } = await import('@/content/mini-cherced/identity')
const { agentInstruction, composeInstruction, KNOWLEDGE_MAX_CHARS, whoYouAre } = await import('@/lib/ai/agent/knowledge')
const { simulatorGreeting, simulatorReply, intentOf } = await import('@/lib/ai/agent/simulator')

const LANGS = ['es', 'en'] as const
const source = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8')
const flat = (text: string) => text.replace(/\s+/g, ' ')
const identityFile = source('content/mini-cherced/identity.ts')
const approved = flat(`${source('content/mini-cherced/personalidad.md')} ${source('content/mini-cherced/background.md')}`)

const MARKS = /\[(CONSULTAR|PRIVADO)\]/i
const FORBIDDEN = /salario|tarifa|diagn[oó]stico|contraseña|direcci[oó]n exacta|salary|password|diagnosis|home address/i

const instructions = await Promise.all(LANGS.map((lang) => agentInstruction(lang)))

describe('identidad de Mini Cherced (FR-3601)', () => {
  it('no trae marcas [CONSULTAR] ni [PRIVADO] ni en identity.ts ni en la instrucción final', () => {
    expect(identityFile).not.toMatch(MARKS)
    for (const text of instructions) expect(text).not.toMatch(MARKS)
  })

  it('lo que dice en español sale tal cual de personalidad.md', () => {
    const { es } = miniChercedIdentity
    const quoted = [...Object.values(es.examples).map((example) => example.answer), ...es.personal.examples.map((example) => example.answer), ...es.story]
    for (const line of quoted) expect(approved).toContain(flat(line))
  })

  it('los dos idiomas tienen la misma forma', () => {
    const { es, en } = miniChercedIdentity
    expect(Object.keys(en.examples)).toEqual(Object.keys(es.examples))
    expect(Object.keys(en.catchphrases)).toEqual(Object.keys(es.catchphrases))
    for (const key of ['essence', 'traits', 'voice', 'story', 'drives', 'goals', 'likes', 'anecdotes', 'limits', 'decisions', 'background'] as const)
      expect(en[key]).toHaveLength(es[key].length)
  })
})

describe('sin datos sensibles (FR-3602)', () => {
  it('ninguna palabra de la lista prohibida llega a identity.ts ni a la instrucción', () => {
    expect(identityFile).not.toMatch(FORBIDDEN)
    for (const text of instructions) expect(text).not.toMatch(FORBIDDEN)
  })
})

describe('instrucción con identidad (spec 036, paso 3)', () => {
  it('suma "Quién eres" y "La historia de Camilo" sin pasarse del tope ni perder el mapa', () => {
    LANGS.forEach((lang, at) => {
      const text = instructions[at]!
      expect(text.length).toBeLessThanOrEqual(KNOWLEDGE_MAX_CHARS)
      expect(text).toMatch(/eres una ia/i)
      expect(text).toContain('# Quién eres')
      expect(text).toContain('# La historia de Camilo')
      expect(text).toContain('# Mapa del sitio')
      expect(text).toContain('añañay')
      expect(text).toContain(miniChercedIdentity[lang].examples['who-is-camilo'].answer)
      expect(text).toContain('Dave Chappelle')
      expect(text).toContain(miniChercedIdentity[lang].story[3])
      expect(text).toContain(miniChercedIdentity[lang].achievements[1])
      expect(text).toContain(`/${lang}/blog/post7`)
    })
  })

  it('si no cabe, recorta primero los ejemplos y deja el mapa entero', () => {
    const { examples } = miniChercedIdentity.es
    const full = composeInstruction('es', 'Camilo', 'MAPA-COMPLETO')
    const tight = composeInstruction('es', 'Camilo', 'MAPA-COMPLETO', full.length - 1)
    expect(tight.length).toBeLessThan(full.length)
    expect(tight.endsWith('# Mapa del sitio\nMAPA-COMPLETO')).toBe(true)
    expect(tight).not.toContain(examples.joke.answer)
    expect(tight).toContain(examples['who-is-camilo'].answer)
    const withoutExamples = full.length - (whoYouAre(miniChercedIdentity.es).length - whoYouAre(miniChercedIdentity.es, 0).length)
    const bare = composeInstruction('es', 'Camilo', 'MAPA-COMPLETO', withoutExamples)
    expect(bare).not.toContain('## Respuestas de ejemplo')
    expect(bare).toContain('# La historia de Camilo')
    expect(bare.endsWith('# Mapa del sitio\nMAPA-COMPLETO')).toBe(true)
    expect(composeInstruction('es', 'Camilo', 'MAPA-COMPLETO', withoutExamples - 10)).toHaveLength(withoutExamples - 10)
  })
})

describe('simulador con identidad (spec 036, paso 4)', () => {
  const facts = {
    author: 'Camilo Hernández',
    about: 'Ingeniero de software en Armenia.',
    services: { intro: '', items: [] },
    projects: [] as never,
    pages: { contact: { title: 'Contacto', url: '/es/contactMe' }, portfolio: { title: 'Portafolio', url: '/es/portfolio' } } as never,
  }

  it('saluda con «¡Pa!» como el compañero pixelado, sin dejar de decir que es el simulador', () => {
    expect(simulatorGreeting('es')).toMatch(/^¡Pa! Soy Mini Cherced, el compañero pixelado de Camilo.*simulador/)
    expect(simulatorGreeting('en')).toMatch(/^¡Pa! I'm Mini Cherced, Camilo's pixelated sidekick.*simulator/)
    expect(simulatorReply('es', 'hola', [], facts).text).toMatch(/^¡Pa!/)
  })

  it('responde "¿quién es Camilo?" y "¿qué significa CHERCED?" con la identidad', () => {
    expect(intentOf('¿Quién es Camilo?')).toBe('camilo')
    expect(intentOf('¿Qué significa CHERCED?')).toBe('name')
    expect(intentOf('what does CHERCED mean?')).toBe('name')
    expect(intentOf('qué es cherced world')).not.toBe('name')
    for (const lang of LANGS) {
      const { examples } = miniChercedIdentity[lang]
      expect(simulatorReply(lang, lang === 'es' ? '¿Quién es Camilo?' : 'Who is Camilo?', [], facts)).toEqual({ text: examples['who-is-camilo'].answer, open: null })
      const name = simulatorReply(lang, lang === 'es' ? '¿Qué significa CHERCED?' : 'What does CHERCED mean?', [], facts).text
      expect(name).toBe(examples.cherced.answer)
      expect(name).toContain('HERnández CEDiel')
      expect(name).toMatch(/Añañay/)
    }
    expect(simulatorReply('es', '¿Quién es Camilo?', [], facts).text).toMatch(/^¡Pa!/)
  })
})
