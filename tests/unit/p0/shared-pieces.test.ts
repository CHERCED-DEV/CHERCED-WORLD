import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { shellLabels } from '@/components/shell/nav'
import { SiteFooter } from '@/components/shell/SiteFooter'
import { pageMetadata } from '@/components/site/metadata'
import { AvailabilityChip, availabilityText } from '@/components/ui/AvailabilityChip'
import { CvLink } from '@/components/ui/CvLink'
import { EmailMenu, emailMenuLabels } from '@/components/ui/EmailMenu'
import { ToastProvider } from '@/components/ui/Toast'
import { site } from '@/content/site'
import { getDictionary } from '@/lib/i18n/server'

const EMAIL = 'chernandezcediel@gmail.com'

function withToasts(element: ReactElement): string {
  return renderToStaticMarkup(createElement(ToastProvider, { closeLabel: 'Cerrar' }, element))
}

function tag(html: string, marker: string): string {
  return new RegExp(`<[a-z]+ [^>]*${marker}[^>]*>`).exec(html)?.[0] ?? ''
}

describe('CvLink (FR-420)', () => {
  it.each([
    ['es', 'Ver mi CV en LinkedIn', 'Ver mi CV en LinkedIn (se abre en una pestaña nueva)'],
    ['en', 'See my CV on LinkedIn', 'See my CV on LinkedIn (opens in a new tab)'],
  ] as const)('%s: abre LinkedIn en pestaña nueva y lo anuncia', (lang, text, label) => {
    const html = renderToStaticMarkup(createElement(CvLink, { lang }))
    const anchor = tag(html, 'data-cw-cv-link')
    expect(anchor).toContain('href="https://www.linkedin.com/in/cherced/"')
    expect(anchor).toContain('target="_blank"')
    expect(anchor).toContain('rel="noopener noreferrer"')
    expect(anchor).toContain(`aria-label="${label}"`)
    expect(html).toContain(`>${text}</span>`)
    expect(html).not.toMatch(/\.pdf/i)
  })
})

describe('AvailabilityChip (FR-419, FR-463)', () => {
  it('muestra ubicación, zona y reubicación, con el nombre completo para lectores de pantalla', () => {
    expect(availabilityText('es')).toEqual({
      prefix: 'Disponibilidad: ',
      visible: 'Armenia, Colombia · UTC−5 · Abierto a reubicación',
      label: 'Disponibilidad: Armenia, Colombia · UTC−5 · Abierto a reubicación',
    })
    expect(availabilityText('en')?.label).toBe('Availability: Armenia, Colombia · UTC−5 · Open to relocation')
    const html = renderToStaticMarkup(createElement(AvailabilityChip, { lang: 'es' }))
    expect(html).toContain('data-cw-availability=""')
    expect(html).toMatch(/<span class="[^"]*" aria-hidden="true"><\/span>/)
    expect(html).toContain('<span class="cw-visually-hidden">Disponibilidad: </span>Armenia, Colombia · UTC−5 · Abierto a reubicación')
  })
})

describe('EmailMenu (FR-464)', () => {
  it('sin JS es un mailto; con JS, un botón de menú cerrado', () => {
    const html = withToasts(createElement(EmailMenu, { lang: 'es', email: EMAIL, trigger: 'icono' }))
    const fallback = tag(html, 'data-cw-email-fallback')
    expect(fallback).toContain(`href="mailto:${EMAIL}"`)
    expect(fallback).toContain('aria-label="Escribirme un correo"')
    expect(fallback).not.toContain('target=')
    const trigger = tag(html, 'data-cw-email-trigger')
    expect(trigger).toMatch(/^<button /)
    expect(trigger).toContain('aria-haspopup="menu"')
    expect(trigger).toContain('aria-expanded="false"')
    expect(trigger).toContain('aria-label="Opciones de correo"')
    expect(html).not.toContain('role="menu"')
  })

  it('resuelve sus textos en ambos idiomas y el aviso de error trae el correo', () => {
    expect(emailMenuLabels('es', EMAIL)).toEqual({
      menu: 'Opciones de correo',
      write: 'Escribirme un correo',
      copy: 'Copiar correo',
      copied: 'Correo copiado ✓',
      copyFailed: `No se pudo copiar. El correo es ${EMAIL}`,
    })
    expect(emailMenuLabels('en', EMAIL).copied).toBe('Email copied ✓')
  })
})

describe('footer (A-407: FR-462, FR-464, FR-490)', () => {
  it.each(['es', 'en'] as const)('%s: easter egg en inglés, menú de correo y enlace a /now', async (lang) => {
    const labels = shellLabels(await getDictionary(lang, 'common'))
    const html = withToasts(createElement(SiteFooter, { lang, socials: site.socials, labels }))
    expect(html).toMatch(/<p class="[^"]*" lang="en" data-cw-footer-egg="">Officially Uncle Bob&#x27;s nephew · SOLID runs in the family\.<\/p>/)
    expect(tag(html, 'data-cw-footer-now')).toContain(`href="/${lang}/now"`)
    expect(html).toContain(`>${lang === 'es' ? 'Ahora' : 'Now'}</a>`)
    expect(html).toContain('data-cw-email-menu=""')
    expect(html.match(/href="mailto:/g)).toHaveLength(1)
    expect(html).toContain(`href="/${lang}/privacy"`)
  })
})

describe('pageMetadata con imagen OG por archivo (R-403)', () => {
  it('sin archivo conserva el logo de respaldo; con ogImageFile deja que mande el opengraph-image', async () => {
    const common = await getDictionary('es', 'common')
    const base = { lang: 'es' as const, path: '/aboutMe', title: 'Sobre mí', description: 'd', common }
    const fallback = pageMetadata(base).openGraph as { images?: Array<{ url: string }> }
    expect(fallback.images?.[0]?.url).toBe('/assets/icons/brandLogoX2.png')
    const withFile = pageMetadata({ ...base, ogImageFile: true }).openGraph as Record<string, unknown>
    expect(Object.prototype.hasOwnProperty.call(withFile, 'images')).toBe(false)
    expect(withFile).toMatchObject({ title: 'Sobre mí', url: '/es/aboutMe', locale: 'es_CO' })
  })
})
