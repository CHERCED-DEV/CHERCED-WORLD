import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { eggFor, foundStars, normalizeHeard, pageOf } from '@/components/fun/guest/logic'
import { guestExperienceSchema, parseGuestMode } from '@/lib/ai/agent/guest'

const PRIVATE = join(process.cwd(), 'content', 'mini-cherced', 'privado', 'guest-experience.json')

const EGGS = [
  { id: 'carino', words: ['te quiero', 'mándame amor'], animation: 'hearts' as const, line: 'Corazones.' },
  { id: 'cara', words: ['😑'], animation: 'frown' as const, line: 'Esa cara.' },
  { id: 'toque', words: [], touch: true, animation: 'indignant' as const, line: '¡Oye!' },
  { id: 'toga', words: ['abogado'], animation: 'gavel' as const, line: 'Toga.' },
]

const EXPERIENCE = {
  welcome: { lines: ['Hola, invitada de prueba.'], options: ['Sorpréndeme'] },
  eggs: EGGS,
  stars: [{ id: 'uno', title: 'Uno', page: '/blog', x: 10, y: 20, animation: 'sparkles', line: 'Estrella de prueba.' }],
  finale: { lines: ['Fin de prueba.'] },
}

function mode(extra: Record<string, unknown> = {}) {
  return Buffer.from(JSON.stringify({ v: 1, salt: 'x'.repeat(24), emailHash: 'a'.repeat(64), name: 'Prueba', persona: 'p'.repeat(250), ...extra })).toString('base64')
}

describe('modo invitada, fases 2 y 3 (039)', () => {
  it('detecta las palabras en lo que se dice, sin tildes ni mayúsculas y con palabras completas', () => {
    expect(normalizeHeard('¡Mándame AMOR, por favor!')).toBe('mandame amor por favor')
    expect(eggFor(EGGS, 'Oye, mándame amor')?.id).toBe('carino')
    expect(eggFor(EGGS, 'TE QUIERO mucho')?.id).toBe('carino')
    expect(eggFor(EGGS, 'mira 😑')?.id).toBe('cara')
    expect(eggFor(EGGS, 'los abogados')).toBeNull()
    expect(eggFor(EGGS, 'hola')).toBeNull()
  })

  it('las estrellas se ubican por página sin el idioma y el progreso tolera basura', () => {
    expect(pageOf('/es')).toBe('/')
    expect(pageOf('/en/blog/')).toBe('/blog')
    expect(pageOf('/es/ai-lab')).toBe('/ai-lab')
    expect(foundStars('["uno", 3, "dos"]')).toEqual(['uno', 'dos'])
    expect(foundStars('{roto')).toEqual([])
  })

  it('la experiencia es opcional: si viene mal, el modo de la fase 1 sigue y la experiencia se descarta', () => {
    expect(parseGuestMode(mode())?.experience).toBeUndefined()
    expect(parseGuestMode(mode({ experience: EXPERIENCE }))?.experience?.stars[0]?.page).toBe('/blog')
    const broken = parseGuestMode(mode({ experience: { ...EXPERIENCE, stars: [{ ...EXPERIENCE.stars[0], page: 'https://otro.sitio' }] } }))
    expect(broken?.name).toBe('Prueba')
    expect(broken?.experience).toBeUndefined()
    expect(guestExperienceSchema.safeParse({ ...EXPERIENCE, eggs: [{ ...EGGS[0], animation: 'explosion' }] }).success).toBe(false)
  })

  it.skipIf(!existsSync(PRIVATE))('el archivo privado del autor cumple el esquema (solo en su equipo)', () => {
    const result = guestExperienceSchema.safeParse(JSON.parse(readFileSync(PRIVATE, 'utf8')))
    expect(result.success).toBe(true)
    expect(result.data?.stars).toHaveLength(5)
  })
})
