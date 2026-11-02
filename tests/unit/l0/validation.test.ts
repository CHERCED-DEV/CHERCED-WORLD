import { describe, expect, it } from 'vitest'
import {
  commentSchema,
  contactSchema,
  formDataToObject,
  LIMITS,
  normalizeSetupCode,
  parseForm,
  parseInput,
  passwordSchema,
  replySchema,
  setupSchema,
} from '@/lib/validation'

const validContact = {
  name: '  Ana  ',
  email: ' ana@example.com ',
  phone: '+57 300 123 4567',
  message: 'Hola, quiero hablar de un proyecto.',
  consent: 'on',
}

describe('contactSchema', () => {
  it('acepta un mensaje válido, recorta espacios y conserva el teléfono tal cual', () => {
    const result = parseInput(contactSchema, validContact)
    expect(result).toEqual({
      success: true,
      data: {
        name: 'Ana',
        email: 'ana@example.com',
        phone: '+57 300 123 4567',
        message: 'Hola, quiero hablar de un proyecto.',
        consent: true,
      },
    })
  })

  it('trata el teléfono vacío o ausente como null', () => {
    const empty = parseInput(contactSchema, { ...validContact, phone: '   ' })
    const missing = parseInput(contactSchema, { ...validContact, phone: undefined })
    expect(empty.success && empty.data.phone).toBeNull()
    expect(missing.success && missing.data.phone).toBeNull()
  })

  it.each(['300 123 4567', '(604) 555-1234', '+1 202-555-0182'])('acepta el teléfono %s', (phone) => {
    expect(parseInput(contactSchema, { ...validContact, phone }).success).toBe(true)
  })

  it.each(['12345', 'abc123456', '+57 300 123 4567 89012'])('rechaza el teléfono %s', (phone) => {
    expect(parseInput(contactSchema, { ...validContact, phone })).toEqual({
      success: false,
      fieldErrors: { phone: 'form.phone.invalid' },
    })
  })

  it('señala cada campo con su clave de error', () => {
    const result = parseInput(contactSchema, {
      name: '',
      email: 'no-es-correo',
      message: 'x'.repeat(LIMITS.message + 1),
    })
    expect(result).toEqual({
      success: false,
      fieldErrors: {
        name: 'form.required',
        email: 'form.email.invalid',
        message: 'form.tooLong',
        consent: 'privacy.required',
      },
    })
  })

  it('aplica los límites de nombre y correo', () => {
    const result = parseInput(contactSchema, {
      ...validContact,
      name: 'x'.repeat(LIMITS.name + 1),
      email: `${'a'.repeat(95)}@b.com`,
    })
    expect(result.success === false && result.fieldErrors).toEqual({ name: 'form.tooLong', email: 'form.tooLong' })
    expect(parseInput(contactSchema, { ...validContact, name: 'x'.repeat(LIMITS.name) }).success).toBe(true)
  })

  it('exige la autorización de datos', () => {
    for (const consent of [undefined, '', 'off', 'false']) {
      const result = parseInput(contactSchema, { ...validContact, consent })
      expect(result.success === false && result.fieldErrors.consent).toBe('privacy.required')
    }
  })

  it('ignora campos extra como el campo trampa', () => {
    const result = parseInput(contactSchema, { ...validContact, website: 'spam', renderedAt: '123' })
    expect(result.success && Object.keys(result.data).sort()).toEqual(['consent', 'email', 'message', 'name', 'phone'])
  })

  it('trata el HTML como texto', () => {
    const result = parseInput(contactSchema, { ...validContact, message: '<script>alert(1)</script>' })
    expect(result.success && result.data.message).toBe('<script>alert(1)</script>')
  })
})

describe('commentSchema', () => {
  it('valida un comentario', () => {
    const result = parseInput(commentSchema, {
      postId: 'post1',
      userName: 'Luis',
      email: 'luis@example.com',
      comment: 'Gran post 🎉',
      consent: 'on',
    })
    expect(result.success).toBe(true)
  })

  it('exige post, nombre, correo, comentario y autorización', () => {
    const result = parseInput(commentSchema, { comment: 'x'.repeat(LIMITS.comment + 1) })
    expect(result).toEqual({
      success: false,
      fieldErrors: {
        postId: 'form.required',
        userName: 'form.required',
        email: 'form.required',
        comment: 'form.tooLong',
        consent: 'privacy.required',
      },
    })
  })
})

describe('contraseñas y configuración inicial', () => {
  it('exige al menos 12 caracteres', () => {
    expect(passwordSchema.safeParse('x'.repeat(11)).success).toBe(false)
    expect(passwordSchema.safeParse('x'.repeat(12)).success).toBe(true)
    expect(passwordSchema.safeParse('x'.repeat(LIMITS.passwordMax + 1)).success).toBe(false)
  })

  it('normaliza el código con guion y minúsculas', () => {
    expect(normalizeSetupCode('abcd-efgh')).toBe('ABCDEFGH')
    const result = parseInput(setupSchema, { code: 'abcd-efgh', password: 'clave-super-larga', confirm: 'clave-super-larga' })
    expect(result.success && result.data.code).toBe('ABCDEFGH')
  })

  it('rechaza códigos con caracteres ambiguos o de otra longitud', () => {
    for (const code of ['ABCD-EFG0', 'ABCD-EFGI', 'ABC', 'ABCD-EFGHJ']) {
      const result = parseInput(setupSchema, { code, password: 'clave-super-larga', confirm: 'clave-super-larga' })
      expect(result.success === false && result.fieldErrors.code).toBe('form.code.invalid')
    }
  })

  it('exige que la confirmación coincida', () => {
    const result = parseInput(setupSchema, { code: 'ABCD-EFGH', password: 'clave-super-larga', confirm: 'otra-clave-larga' })
    expect(result).toEqual({ success: false, fieldErrors: { confirm: 'form.password.mismatch' } })
  })
})

describe('replySchema', () => {
  it('acepta de 1 a 1000 caracteres', () => {
    expect(parseInput(replySchema, { text: ' Gracias ' })).toEqual({ success: true, data: { text: 'Gracias' } })
    expect(parseInput(replySchema, { text: ' ' }).success).toBe(false)
    expect(parseInput(replySchema, { text: 'x'.repeat(LIMITS.reply + 1) }).success).toBe(false)
  })
})

describe('FormData', () => {
  it('convierte FormData en objeto y valida', () => {
    const form = new FormData()
    for (const [key, value] of Object.entries(validContact)) form.append(key, value)
    form.append('name', 'duplicado')
    expect(formDataToObject(form).name).toBe('  Ana  ')
    expect(parseForm(contactSchema, form).success).toBe(true)
  })
})
