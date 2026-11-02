import { describe, expect, it } from 'vitest'
import {
  clampLevel,
  formatMonth,
  formatPeriod,
  homeSocials,
  isExternal,
  isPublishable,
  paragraphs,
  splitLead,
} from '@/components/site/format'
import type { SocialLink } from '@/content/types'
import { getSite } from '@/lib/content'

const label = { es: 'x', en: 'x' }

describe('fechas de carrera y educación', () => {
  it('formatea meses como "Jul 2022" y "jul 2022"', () => {
    expect(formatMonth('2022-07', 'en')).toBe('Jul 2022')
    expect(formatMonth('2022-07', 'es')).toBe('jul 2022')
    expect(formatMonth('2020-01', 'es')).toBe('ene 2020')
  })

  it('deja intacto un año suelto (UNAD 2020, EAM 2011)', () => {
    expect(formatMonth('2020', 'en')).toBe('2020')
    expect(formatPeriod('2011', '2016', 'es', 'Actualidad')).toBe('2011 – 2016')
  })

  it('usa "Present"/"Actualidad" cuando no hay fecha de fin (C-02)', () => {
    expect(formatPeriod('2022-07', null, 'en', 'Present')).toBe('Jul 2022 – Present')
    expect(formatPeriod('2022-07', null, 'es', 'Actualidad')).toBe('jul 2022 – Actualidad')
  })
})

describe('secciones con pendientes del autor', () => {
  it('no publica una lista con alguna entrada pending', () => {
    expect(isPublishable([{}, { pending: true }])).toBe(false)
    expect(isPublishable([{}, {}])).toBe(true)
    expect(isPublishable([])).toBe(false)
  })

  it('oculta carrera y educación del seed mientras P-01 y P-03 sigan abiertos', () => {
    const { about } = getSite()
    expect(isPublishable(about.career)).toBe(about.career.every((entry) => !entry.pending))
    expect(isPublishable(about.education)).toBe(about.education.every((entry) => !entry.pending))
  })
})

describe('redes del banner del home', () => {
  const socials: SocialLink[] = [
    { id: 'linkedin', href: 'https://www.linkedin.com/in/cherced/', label },
    { id: 'facebook', href: null, label },
    { id: 'email', href: 'mailto:a@b.co', label },
    { id: 'github', href: 'https://github.com/CHERCED-DEV', label },
  ]

  it('muestra correo, GitHub y LinkedIn en el orden de 2023', () => {
    expect(homeSocials(socials).map((social) => social.id)).toEqual(['email', 'github', 'linkedin'])
  })

  it('omite las redes sin enlace (href: null)', () => {
    const withoutGithub = socials.map((social) => (social.id === 'github' ? { ...social, href: null } : social))
    expect(homeSocials(withoutGithub).map((social) => social.id)).toEqual(['email', 'linkedin'])
  })

  it('trata mailto como enlace no externo', () => {
    expect(isExternal('mailto:a@b.co')).toBe(false)
    expect(isExternal('https://github.com')).toBe(true)
    expect(isExternal('/es/portfolio')).toBe(false)
  })
})

describe('título de la introducción de servicios', () => {
  it('separa la pregunta inicial del cuerpo en ambos idiomas', () => {
    expect(splitLead('How can I help you? I build web apps.')).toEqual({ lead: 'How can I help you?', body: 'I build web apps.' })
    expect(splitLead('¿Cómo te puedo ayudar? Construyo aplicaciones web.')).toEqual({
      lead: '¿Cómo te puedo ayudar?',
      body: 'Construyo aplicaciones web.',
    })
  })

  it('la introducción 2026 no empieza con pregunta y el título sale del diccionario', () => {
    const { intro } = getSite().services
    expect(splitLead(intro.es)).toEqual({ lead: null, body: intro.es })
    expect(splitLead(intro.en)).toEqual({ lead: null, body: intro.en })
  })

  it('no inventa título si el texto no empieza con una pregunta', () => {
    expect(splitLead('Construyo aplicaciones web. ¿Hablamos?')).toEqual({
      lead: null,
      body: 'Construyo aplicaciones web. ¿Hablamos?',
    })
  })
})

describe('párrafos', () => {
  it('parte por líneas en blanco y descarta vacíos', () => {
    expect(paragraphs('Uno.\n\nDos.\n \n\nTres.')).toEqual(['Uno.', 'Dos.', 'Tres.'])
    expect(paragraphs('Una sola línea\ncon salto simple')).toEqual(['Una sola línea\ncon salto simple'])
    expect(paragraphs('   ')).toEqual([])
  })
})

describe('barras de nivel', () => {
  it('conserva los valores 2023 y acota fuera de rango', () => {
    expect(clampLevel(75)).toBe(75)
    expect(clampLevel(140)).toBe(100)
    expect(clampLevel(-3)).toBe(0)
    expect(clampLevel(Number.NaN)).toBe(0)
  })
})
