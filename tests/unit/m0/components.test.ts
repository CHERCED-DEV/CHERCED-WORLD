import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Dock, DockAssistant } from '@/components/shell/Dock'
import { SiteHeader } from '@/components/shell/SiteHeader'
import { shellLabels } from '@/components/shell/nav'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Dialog } from '@/components/ui/Dialog'
import { FormField } from '@/components/ui/FormField'
import { GlassSurface, glassMotionAttributes } from '@/components/ui/GlassSurface'
import common from '@/content/i18n/es/common.json'

const render = (element: ReactElement) => renderToStaticMarkup(element)

function h(type: unknown, props: Record<string, unknown>, children?: unknown): ReactElement {
  return createElement(type as never, { ...props, children } as never)
}

describe('GlassSurface: sweep, float y blur (T806)', () => {
  it('sin las props nuevas queda igual que en la 002', () => {
    expect(render(createElement(GlassSurface, { variant: 'subtle' }, 'hola'))).toMatch(/^<div data-cw-glass="subtle" class="[^"]*">hola<\/div>$/)
  })

  it('float marca el nivel, blur la superficie con desenfoque real y sweep agrega la capa decorativa al final', () => {
    const html = render(createElement(GlassSurface, { as: 'article', float: 2, blur: true, sweep: true }, 'x'))
    expect(html).toMatch(/^<article data-cw-glass="standard" class="[^"]*" data-cw-float="2" data-cw-blur="">x<span aria-hidden="true" data-cw-sweep=""><\/span><\/article>$/)
    expect(glassMotionAttributes({})).toEqual({})
    expect(glassMotionAttributes({ float: 1, blur: true })).toEqual({ 'data-cw-float': '1', 'data-cw-blur': '' })
  })
})

describe('FormField floating (FR-609)', () => {
  it('sin floating no cambia: no agrega marca ni placeholder', () => {
    const html = render(h(FormField, { label: 'Nombre', id: 'n' }, createElement('input', { name: 'n' })))
    expect(html).not.toContain('data-cw-floating')
    expect(html).not.toContain('placeholder')
  })

  it('con floating la etiqueta sigue asociada, el error se anuncia igual y el campo vacío lleva un placeholder neutro', () => {
    const html = render(
      h(FormField, { label: 'Correo', id: 'mail', floating: true, error: 'Falta el correo' }, createElement('input', { type: 'email' })),
    )
    expect(html).toContain('data-cw-floating=""')
    expect(html).toContain('<label for="mail"')
    expect(html).toMatch(/<input type="email" id="mail" aria-describedby="mail-error" aria-invalid="true" placeholder=" "\/>/)
    expect(html).toContain('id="mail-error"')
  })

  it('respeta el placeholder propio y no lo pone en select ni en casillas en línea', () => {
    const own = render(h(FormField, { label: 'X', id: 'x', floating: true }, createElement('textarea', { placeholder: 'Cuéntame' })))
    expect(own).toContain('placeholder="Cuéntame"')
    const select = render(h(FormField, { label: 'S', id: 's', floating: true }, createElement('select', null)))
    expect(select).not.toContain('placeholder')
    const inline = render(h(FormField, { label: 'C', id: 'c', floating: true, inline: true }, createElement('input', { type: 'checkbox' })))
    expect(inline).not.toContain('data-cw-floating')
  })
})

describe('BottomSheet (FR-603)', () => {
  it('es un diálogo modal con título, agarradera decorativa, "Cerrar" y desenfoque real', () => {
    const html = render(
      h(BottomSheet, { open: false, onClose: () => {}, labelledBy: 'sheet-title', closeLabel: 'Cerrar', title: 'Backend' }, 'cuerpo'),
    )
    expect(html).toMatch(/^<dialog aria-labelledby="sheet-title" aria-modal="true" data-cw-sheet="" data-cw-glass="strong" data-cw-blur=""/)
    expect(html).toContain('<h2 id="sheet-title"')
    expect(html).toContain('tabindex="-1"')
    expect(html).toMatch(/<span class="[^"]*" aria-hidden="true"><\/span>/)
    expect(html).toContain('aria-label="Cerrar" data-cw-sheet-close=""')
    expect(html).toContain('data-cw-sheet-body=""')
    expect(html).not.toContain('data-cw-sheet-nav')
  })

  it('con onSwipe ofrece los botones Anterior y Siguiente y el contador (FR-652)', () => {
    const html = render(
      h(
        BottomSheet,
        {
          open: false,
          onClose: () => {},
          labelledBy: 't',
          closeLabel: 'Cerrar',
          onSwipe: () => {},
          navLabels: { prev: 'Anterior', next: 'Siguiente' },
          counter: '2 / 6',
        },
        createElement('h2', { id: 't' }, 'Título propio'),
      ),
    )
    expect(html).toContain('data-cw-sheet-prev=""')
    expect(html).toContain('<span>Anterior</span>')
    expect(html).toContain('<span>Siguiente</span>')
    expect(html).toContain('aria-live="polite">2 / 6</p>')
  })
})

describe('Dialog mobileSheet (T811)', () => {
  it('sin la prop se renderiza igual que antes', () => {
    const html = render(h(Dialog, { open: false, onClose: () => {}, labelledBy: 'd' }, 'x'))
    expect(html).toMatch(/^<dialog aria-labelledby="d" data-cw-glass="strong" class="[^"]*"><div class="[^"]*">x<\/div><\/dialog>$/)
  })

  it('con mobileSheet suma la marca de hoja y la agarradera', () => {
    const html = render(h(Dialog, { open: false, onClose: () => {}, labelledBy: 'd', mobileSheet: true }, 'x'))
    expect(html).toContain('data-cw-sheet=""')
    expect(html).toMatch(/<div class="[^"]*" aria-hidden="true" data-cw-sheet-drag=""><\/div>/)
  })
})

describe('Dock (FR-607, FR-608, EM-05)', () => {
  it('el dock envuelve los controles y lleva la marca de desenfoque; el asistente emite su evento', () => {
    expect(render(h(Dock, {}, 'x'))).toMatch(/^<div class="[^"]*" data-cw-dock-bar="" data-cw-blur="">x<\/div>$/)
    const assistant = render(createElement(DockAssistant, { label: 'Pregúntale a mi portafolio' }))
    expect(assistant).toContain('aria-label="Pregúntale a mi portafolio"')
    expect(assistant).toContain('aria-haspopup="dialog"')
    expect(assistant).toContain('data-cw-dock-assistant=""')
    expect(assistant).toContain('cw-js-only')
  })

  it('el header monta el dock con búsqueda, asistente, tema y menú, y el buzón sigue en el header', () => {
    const html = render(createElement(SiteHeader, { lang: 'es', items: [], labels: shellLabels(common) }))
    expect(html).toMatch(/<header id="header" class="[^"]*" data-cw-glass="standard" data-cw-blur="">/)
    const dock = html.slice(html.indexOf('data-cw-dock-bar'))
    const order = ['data-cw-palette-trigger', 'data-cw-dock-assistant', 'data-cw-lang-switch', 'data-cw-mailbox', 'data-cw-theme-toggle', 'data-cw-menu-button']
    const positions = order.map((marker) => dock.indexOf(marker))
    expect(positions.every((position) => position > 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    const mailbox = /<a [^>]*data-cw-mailbox=""[^>]*>/.exec(html)?.[0] ?? ''
    expect(mailbox, 'A-1101: el buzón abre el panel').toContain('href="/es/inbox"')
    expect(html.match(/data-cw-menu-button/g)).toHaveLength(1)
  })
})
