import { describe, expect, it } from 'vitest'
import { SERVICE_IDS } from '@/content/types'
import {
  contactSchema,
  INTEREST_ERROR,
  isMessageInterest,
  isReactionKind,
  MESSAGE_INTERESTS,
  parseForm,
  parseInput,
  REACTION_KINDS,
  reactionSchema,
} from '@/lib/validation'

const validContact = {
  name: 'Ana',
  email: 'ana@example.com',
  phone: '',
  message: 'Hola, quiero hablar de un proyecto.',
  consent: 'on',
}

describe('contactSchema › interest (A-401)', () => {
  it('las opciones son los seis servicios en el orden de la página y "Otra cosa"', () => {
    expect(MESSAGE_INTERESTS).toEqual([...SERVICE_IDS, 'other'])
    expect(MESSAGE_INTERESTS).toHaveLength(7)
  })

  it.each([...SERVICE_IDS, 'other'])('acepta %s', (interest) => {
    const result = parseInput(contactSchema, { ...validContact, interest })
    expect(result.success && result.data.interest).toBe(interest)
  })

  it('vacío pasa a null y ausente no agrega el campo', () => {
    const empty = parseInput(contactSchema, { ...validContact, interest: '' })
    expect(empty.success && empty.data.interest).toBeNull()
    const nul = parseInput(contactSchema, { ...validContact, interest: null })
    expect(nul.success && nul.data.interest).toBeNull()
    const missing = parseInput(contactSchema, validContact)
    expect(missing.success && 'interest' in missing.data).toBe(false)
  })

  it.each([
    ['un id desconocido', 'consultoria'],
    ['mayúsculas', 'AI-HARNESS'],
    ['espacios alrededor', ' ai-harness '],
    ['HTML', '<script>alert(1)</script>'],
    ['un número', 3],
    ['un arreglo', ['ai-harness']],
    ['un objeto', { id: 'ai-harness' }],
    ['un id muy largo', 'ai-harness'.repeat(50)],
  ])('rechaza %s con su clave de error, sin tocar los demás campos', (_case, interest) => {
    expect(parseInput(contactSchema, { ...validContact, interest })).toEqual({
      success: false,
      fieldErrors: { interest: INTEREST_ERROR },
    })
  })

  it('desde un FormData manipulado, el servidor rechaza el valor', () => {
    const form = new FormData()
    for (const [key, value] of Object.entries(validContact)) form.set(key, value)
    form.set('interest', 'otra-cosa-inventada')
    expect(parseForm(contactSchema, form)).toEqual({ success: false, fieldErrors: { interest: INTEREST_ERROR } })
    form.set('interest', 'workshops')
    const accepted = parseForm(contactSchema, form)
    expect(accepted.success && accepted.data.interest).toBe('workshops')
  })

  it('isMessageInterest distingue mayúsculas y no recorta', () => {
    expect(isMessageInterest('product')).toBe(true)
    expect(isMessageInterest('other')).toBe(true)
    expect(isMessageInterest('Product')).toBe(false)
    expect(isMessageInterest('product ')).toBe(false)
    expect(isMessageInterest(null)).toBe(false)
  })
})

describe('reactionSchema (A-403)', () => {
  it('acepta los tres tipos con add y remove', () => {
    for (const kind of REACTION_KINDS) {
      for (const op of ['add', 'remove']) {
        expect(parseInput(reactionSchema, { postId: 'post1', kind, op }).success, `${kind} ${op}`).toBe(true)
      }
    }
  })

  it.each([
    [{ postId: 'post1', kind: 'heart', op: 'add' }],
    [{ postId: 'post1', kind: 'clap', op: 'toggle' }],
    [{ postId: 'post1', kind: 'CLAP', op: 'add' }],
    [{ postId: '', kind: 'clap', op: 'add' }],
    [{ postId: '../post1', kind: 'clap', op: 'add' }],
    [{ postId: 'p'.repeat(65), kind: 'clap', op: 'add' }],
    [{ postId: { $ne: null }, kind: 'clap', op: 'add' }],
    [{ postId: 'post1', kind: 'clap' }],
  ])('rechaza %j', (input) => {
    expect(parseInput(reactionSchema, input).success).toBe(false)
  })

  it('isReactionKind solo reconoce clap, idea y fire', () => {
    expect(REACTION_KINDS).toEqual(['clap', 'idea', 'fire'])
    expect(['clap', 'idea', 'fire', 'heart', '', null].map(isReactionKind)).toEqual([true, true, true, false, false, false])
  })
})
