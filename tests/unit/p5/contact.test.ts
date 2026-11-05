import { createElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { SERVICE_IDS } from '@/content/types'
import type { MessageRecord } from '@/lib/data/types'
import { getDictionary } from '@/lib/i18n/server'
import type { Locale } from '@/lib/i18n'

vi.mock('@/lib/actions/contact', () => ({ submitContact: vi.fn(async () => ({ ok: true, data: undefined })) }))
vi.mock('@/lib/actions/admin', () => ({ setMessageStatus: vi.fn(), deleteMessage: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }))

const { ContactForm, BookingSlot } = await import('@/components/contact/ContactForm')
const { ConsentField } = await import('@/components/contact/ConsentField')
const { bookingLink } = await import('@/components/contact/booking')
const { preselectedInterest } = await import('@/components/contact/preselect')
const { consentLabels, contactErrorMessages, contactLabels } = await import('@/components/contact/labels')
const { MessageList } = await import('@/components/admin/MessageList')
const { adminText } = await import('@/components/admin/labels')
const { ToastProvider } = await import('@/components/ui/Toast')
const { site } = await import('@/content/site')
const { INTEREST_ERROR } = await import('@/lib/validation')

const Provider = ToastProvider as (props: { closeLabel: string; children?: ReactNode }) => ReactElement

const inToast = (element: ReactElement) => createElement(Provider, { closeLabel: 'x' }, element)

async function renderContact(lang: Locale, interest: Parameters<typeof preselectedInterest>[0]) {
  const [common, contact] = await Promise.all([getDictionary(lang, 'common'), getDictionary(lang, 'contact')])
  return renderToStaticMarkup(
    createElement(
      Provider,
      { closeLabel: 'x' },
      createElement(ContactForm, {
        renderedAt: 1_700_000_000_000,
        privacyHref: `/${lang}/privacy`,
        labels: contactLabels(common, contact),
        errors: contactErrorMessages(common, contact),
        interest: preselectedInterest(interest),
        booking: null,
      }),
    ),
  )
}

const selectedOptions = (html: string) => [...html.matchAll(/<option[^>]*selected=""[^>]*>/g)].map(([tag]) => /value="([^"]*)"/.exec(tag)?.[1])

describe('preselección desde ?servicio= (contrato P5 → P3, R-408)', () => {
  it.each(SERVICE_IDS)('%s queda seleccionado en el HTML del servidor', async (id) => {
    const html = await renderContact('es', id)
    expect(selectedOptions(html)).toEqual([id])
  })

  it.each([
    ['ausente', undefined],
    ['vacío', ''],
    ['desconocido', 'consultoria'],
    ['en mayúsculas', 'AI-HARNESS'],
    ['con espacios', ' product'],
    ['"other" (no es un ServiceId)', 'other'],
    ['repetido', ['ai-harness', 'product']],
    ['HTML', '"><script>alert(1)</script>'],
  ])('%s se ignora: queda "Elige una opción"', async (_case, value) => {
    const html = await renderContact('es', value as string | string[] | undefined)
    expect(selectedOptions(html)).toEqual([''])
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('el campo lleva la etiqueta, la opción vacía, los seis servicios y "Otra cosa" en ES y EN', async () => {
    const es = await renderContact('es', 'workshops')
    expect(es).toContain('¿Qué te interesa?')
    expect(es).toContain('<option value="">Elige una opción (opcional)</option>')
    expect(es).toContain('Asistentes de IA para tu profesión')
    expect(es).toContain('Talleres para equipos')
    expect(es).toContain('<option value="other">Otra cosa</option>')
    expect([...es.matchAll(/<option /g)]).toHaveLength(8)
    const en = await renderContact('en', 'architecture')
    expect(en).toContain('What are you interested in?')
    expect(en).toContain('Architecture &amp; modernization')
    expect(en).toContain('<option value="other">Something else</option>')
    expect(/<select[^>]*name="interest"/.test(en)).toBe(true)
  })

  it('el valor manipulado tiene mensaje propio en el formulario', async () => {
    const [common, contact] = await Promise.all([getDictionary('es', 'common'), getDictionary('es', 'contact')])
    expect(contactErrorMessages(common, contact)[INTEREST_ERROR]).toBe('Revisa los campos marcados para poder enviar tu mensaje.')
  })
})

describe('checkbox de privacidad (A-404, FR-481)', () => {
  it.each(['es', 'en'] as const)('en %s la etiqueta es la frase completa y el enlace va aparte, con aviso de pestaña nueva', async (lang) => {
    const [common, contact] = await Promise.all([getDictionary(lang, 'common'), getDictionary(lang, 'contact')])
    const labels = consentLabels(common, contact['contact.newTab'] ?? '')
    const html = renderToStaticMarkup(createElement(ConsentField, { labels, href: `/${lang}/privacy` }))
    const label = /<label[^>]*>([\s\S]*?)<\/label>/.exec(html)?.[1] ?? ''
    expect(label).toBe(common['privacy.consent'])
    expect(label).toContain(lang === 'es' ? 'política de privacidad' : 'privacy policy')
    expect(label).not.toContain('<a')
    const link = /<a[^>]*>([\s\S]*?)<\/a>/.exec(html)
    expect(link?.[0]).toContain(`href="/${lang}/privacy"`)
    expect(link?.[0]).toContain('target="_blank"')
    expect(link?.[1]).toContain(common['privacy.readPolicy'])
    expect(link?.[1]).toContain(contact['contact.newTab'])
    const checkbox = /<input[^>]*type="checkbox"[^>]*>/.exec(html)?.[0] ?? ''
    expect(checkbox).toContain('required')
    expect(checkbox).not.toContain('checked')
  })
})

describe('enlace de agenda (A-402, P-422)', () => {
  it('sin profile.booking no hay enlace: así queda hoy', () => {
    expect(bookingLink(site.profile, 'es')).toBeNull()
    expect(bookingLink(undefined, 'es')).toBeNull()
    expect(renderToStaticMarkup(createElement(BookingSlot, { booking: bookingLink(site.profile, 'es'), newTab: 'x' }))).toBe('')
  })

  it('con URL https y etiqueta en el idioma, aparece en pestaña nueva', () => {
    const profile = { ...site.profile, booking: { href: 'https://cal.example.org/camilo', label: { es: 'Agenda una llamada', en: 'Book a call' } } }
    expect(bookingLink(profile, 'en')).toEqual({ href: 'https://cal.example.org/camilo', label: 'Book a call' })
    const html = renderToStaticMarkup(createElement(BookingSlot, { booking: bookingLink(profile, 'es'), newTab: '(se abre en una pestaña nueva)' }))
    expect(html).toContain('data-cw-contact-booking=""')
    expect(html).toContain('href="https://cal.example.org/camilo"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('Agenda una llamada')
    expect(html).toContain('(se abre en una pestaña nueva)')
  })

  it.each([
    ['javascript:', { href: 'javascript:alert(1)', label: { es: 'x', en: 'x' } }],
    ['http sin TLS', { href: 'http://cal.example.org', label: { es: 'x', en: 'x' } }],
    ['texto que no es URL', { href: 'agenda', label: { es: 'x', en: 'x' } }],
    ['sin etiqueta del idioma', { href: 'https://cal.example.org', label: { en: 'Book' } }],
    ['etiqueta vacía', { href: 'https://cal.example.org', label: { es: '  ', en: ' ' } }],
  ])('descarta %s', (_case, booking) => {
    expect(bookingLink({ booking }, 'es')).toBeNull()
  })
})

describe('panel: interés del mensaje (A-401, T473)', () => {
  const base: MessageRecord = {
    id: 'a'.repeat(24),
    name: 'Ana',
    email: 'ana@example.com',
    phone: null,
    message: 'Hola',
    interest: null,
    status: 'unread',
    consentAt: new Date('2026-11-05T10:00:00Z'),
    createdAt: new Date('2026-11-05T10:00:00Z'),
    updatedAt: new Date('2026-11-05T10:00:00Z'),
  }

  it('muestra "Le interesa" con el nombre del servicio, y nada si no eligió', async () => {
    const text = await adminText('es')
    const html = renderToStaticMarkup(
      inToast(
        createElement(MessageList, {
          messages: [
            { ...base, interest: 'process-optimization' },
            { ...base, id: 'b'.repeat(24), interest: 'other' },
            { ...base, id: 'c'.repeat(24) },
          ],
          text,
        }),
      ),
    )
    expect(html).toContain('<dt>Le interesa</dt><dd data-cw-message-interest="process-optimization">Optimización de procesos con IA</dd>')
    expect(html).toContain('<dd data-cw-message-interest="other">Otra cosa</dd>')
    expect([...html.matchAll(/data-cw-message-interest=/g)]).toHaveLength(2)
  })

  it('en inglés usa "Interested in"', async () => {
    const text = await adminText('en')
    const html = renderToStaticMarkup(inToast(createElement(MessageList, { messages: [{ ...base, interest: 'product' }], text })))
    expect(html).toContain('<dt>Interested in</dt><dd data-cw-message-interest="product">Product development</dd>')
  })
})

describe('política de privacidad (FR-483, T479)', () => {
  it('"Qué datos recojo" menciona el servicio que interesa, en ES y EN', () => {
    const collect = site.privacy.sections.find((section) => section.heading.es === 'Qué datos recojo')
    expect(collect?.body.es).toContain('el servicio que te interesa si lo eliges')
    expect(collect?.body.en).toContain("the service you're interested in if you choose one")
  })

  it('el texto técnico menciona las reacciones y que la IP nunca se guarda en claro, en ES y EN', async () => {
    const [es, en] = await Promise.all([getDictionary('es', 'privacy'), getDictionary('en', 'privacy')])
    expect(es['privacy.technical.body']).toContain('las reacciones')
    expect(es['privacy.technical.body']).toContain('nunca la IP en sí')
    expect(es['privacy.technical.body']).toContain('Las reacciones solo guardan contadores.')
    expect(en['privacy.technical.body']).toContain('Reactions only store counts.')
    expect(en['privacy.technical.body']).toContain('never the IP itself')
  })
})
