import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SERVICE_CASES, serviceCases, serviceNumber, stepParts, wantHref } from '@/components/site/services/model'
import { ServiceIcon } from '@/components/site/services/ServiceIcon'
import { ServicesView, type ServicesLabels, type ServicesViewProps } from '@/components/site/services/ServicesView'
import { isServiceId, SERVICE_IDS, type Locale, type ServiceId } from '@/content/types'
import { getProjects, getSite } from '@/lib/content'
import { locales, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

const { services } = getSite()
const ORDER = services.items.map((item) => item.id)

async function labels(lang: Locale): Promise<ServicesLabels> {
  const dict = await getDictionary(lang, 'site')
  const key = (name: string) => t(dict, `services.${name}`)
  return {
    title: key('title'),
    audiences: key('audiences'),
    forWho: key('forWho'),
    deliverables: key('deliverables'),
    flip: key('flip'),
    flipBack: key('flipBack'),
    want: key('want'),
    try: key('try'),
    principles: key('principles'),
    cases: key('cases'),
    faq: key('faq'),
  }
}

async function render(lang: Locale, extra: Partial<ServicesViewProps> = {}): Promise<string> {
  return renderToStaticMarkup(
    createElement(ServicesView, {
      lang,
      services,
      cases: serviceCases(getProjects(), ORDER),
      labels: await labels(lang),
      ...extra,
    }),
  )
}

function cardHtml(html: string, id: ServiceId): string {
  const start = html.indexOf(`data-cw-service="${id}"`)
  const end = html.indexOf('</article>', start)
  expect(start, id).toBeGreaterThan(-1)
  return html.slice(start, end)
}

function tag(html: string, marker: string): string {
  return new RegExp(`<[a-z]+ [^>]*${marker}[^>]*>`).exec(html)?.[0] ?? ''
}

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

describe('Servicios: datos (FR-406c, FR-406f, FR-406j)', () => {
  it('seis servicios en el orden de SERVICE_IDS, numerados del 01 al 06', () => {
    expect(ORDER).toEqual([...SERVICE_IDS])
    expect(ORDER.map((_, index) => serviceNumber(index))).toEqual(['01', '02', '03', '04', '05', '06'])
  })

  it.each(locales)('%s: "Quiero esto" lleva a Contacto con un ?servicio= que P5 reconoce', (lang) => {
    for (const id of SERVICE_IDS) {
      const href = wantHref(lang, id)
      expect(href).toBe(`/${lang}/contactMe?servicio=${id}`)
      const value = new URL(href, 'https://example.test').searchParams.get('servicio')
      expect(isServiceId(value), id).toBe(true)
    }
  })

  it('ningún servicio trae precio mientras P-421 siga abierta', () => {
    expect(services.items.filter((item) => item.priceRange)).toEqual([])
  })
})

describe('Cómo trabajo: pasos (FR-406e)', () => {
  it.each(locales)('%s: cada paso se separa en nombre y texto sin perder ni cambiar palabras', (lang) => {
    for (const [index, step] of services.process.steps.entries()) {
      const { name, text: rest } = stepParts(step[lang])
      expect(name, step[lang]).toBeTruthy()
      expect(`${index + 1}. ${name} — ${rest}`).toBe(step[lang])
    }
  })

  it('un paso sin el formato "N. Nombre — texto" se muestra completo, sin el número', () => {
    expect(stepParts('Algo distinto')).toEqual({ name: null, text: 'Algo distinto' })
    expect(stepParts('3. Solo texto')).toEqual({ name: null, text: 'Solo texto' })
  })
})

describe('Casos (FR-406h, contenido.md §5.5)', () => {
  it('enlaza solo a casos publicados, en el orden del portafolio y con sus servicios', () => {
    const published = new Set(getProjects().map((project) => project.id))
    for (const ids of Object.values(SERVICE_CASES)) for (const id of ids ?? []) expect(published.has(id), id).toBe(true)
    const cases = serviceCases(getProjects(), ORDER)
    expect(cases.map(({ project }) => project.id)).toEqual(['12', '13', '2', '14', '15'])
    expect(Object.fromEntries(cases.map(({ project, services: ids }) => [project.id, ids]))).toEqual({
      '12': ['architecture'],
      '13': ['software-factory'],
      '2': ['software-factory', 'product'],
      '14': ['ai-harness'],
      '15': ['architecture'],
    })
  })

  it('un id que no existe en el portafolio no se enlaza', () => {
    const cases = serviceCases(getProjects(), ORDER, { product: ['no-existe', '2'] })
    expect(cases.map(({ project }) => project.id)).toEqual(['2'])
  })
})

describe('ServicesView (US1b)', () => {
  it.each(locales)('%s: siete bloques en orden, con el h1 del hero', async (lang) => {
    const html = await render(lang)
    const blocks = [...html.matchAll(/data-cw-services-block="([a-z]+)"/g)].map((match) => match[1])
    expect(blocks).toEqual(['hero', 'audiences', 'services', 'process', 'cases', 'faq', 'cta'])
    const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)]
    expect(h1).toHaveLength(1)
    expect(text(h1[0]?.[1] ?? '')).toBe(services.hero.title[lang])
    expect(text(html)).toContain(services.hero.intro[lang])
    const contact = `/${lang}/contactMe`
    expect(tag(html, 'data-cw-services-hero-cta=""')).toContain(`href="${contact}"`)
    expect(tag(html, 'data-cw-services-contact=""')).toContain(`href="${contact}"`)
    for (const audience of services.audiences) expect(text(html)).toContain(audience.text[lang])
  })

  it.each(locales)('%s: seis tarjetas con ícono, número, las dos caras y "Quiero esto"', async (lang) => {
    const html = await render(lang)
    const dict = await labels(lang)
    expect([...html.matchAll(/data-cw-service="([a-z-]+)"/g)].map((match) => match[1])).toEqual([...SERVICE_IDS])
    for (const [index, item] of services.items.entries()) {
      const card = cardHtml(html, item.id)
      expect(card).toContain(`data-cw-service-icon="${item.id}"`)
      expect(card).toContain(`>${serviceNumber(index)}</p>`)
      const plain = text(card)
      for (const value of [item.title[lang], item.forWho[lang], item.description[lang], ...item.deliverables.map((d) => d[lang])]) {
        expect(plain, value).toContain(value)
      }
      if (item.example) expect(plain).toContain(item.example[lang])
      const flip = /<button [^>]*data-cw-service-flip=""[^>]*>/.exec(card)?.[0] ?? ''
      expect(flip).toContain('aria-expanded="false"')
      expect(flip).toContain('cw-js-only')
      const controls = /aria-controls="([^"]+)"/.exec(flip)?.[1]
      expect(card).toContain(`id="${controls}"`)
      expect(tag(card, `data-cw-service-want="${item.id}"`)).toContain(`href="/${lang}/contactMe?servicio=${item.id}"`)
      expect(plain).toContain(`${dict.want}: ${item.title[lang]}`)
    }
  })

  it.each(locales)('%s: cuatro preguntas como disclosures, sin la de propiedad (P-412)', async (lang) => {
    const html = await render(lang)
    const details = [...html.matchAll(/<details[^>]*data-cw-faq=""[^>]*><summary[^>]*>([\s\S]*?)<\/summary>/g)]
    expect(details.map((match) => text(match[1] ?? ''))).toEqual(services.faq.map((item) => item.q[lang]))
    expect(details).toHaveLength(4)
    expect(text(html)).not.toMatch(/dueño de lo que se construye|who owns what gets built/i)
  })

  it.each(locales)('%s: los pasos van en una lista ordenada sin repetir el número, y los principios debajo', async (lang) => {
    const html = await render(lang)
    const list = /<ol [^>]*data-cw-steps=""[^>]*>([\s\S]*?)<\/ol>/.exec(html)?.[1] ?? ''
    const steps = [...list.matchAll(/<li [^>]*data-cw-step=""[^>]*>([\s\S]*?)<\/li>/g)].map((match) => text(match[1] ?? ''))
    expect(steps).toHaveLength(5)
    for (const step of steps) expect(step).not.toMatch(/^\d/)
    const principles = html.slice(html.indexOf('data-cw-principles'))
    for (const principle of services.process.principles) expect(text(principles)).toContain(principle[lang])
  })

  it('no muestra precios ni el botón "Probar" sin la vitrina Despacho (FR-406i, FR-406j)', async () => {
    for (const lang of locales) {
      const html = await render(lang)
      expect(html).not.toContain('data-cw-service-try')
      expect(text(html)).not.toMatch(/\$|USD|COP|€/)
    }
  })

  it('con la vitrina, "Probar" aparece solo en la tarjeta de asistentes', async () => {
    const html = await render('es', { tryHrefs: { 'ai-harness': '/es/lab/despacho' } })
    expect([...html.matchAll(/data-cw-service-try="([a-z-]+)"/g)].map((match) => match[1])).toEqual(['ai-harness'])
    expect(tag(cardHtml(html, 'ai-harness'), 'data-cw-service-try="ai-harness"')).toContain('href="/es/lab/despacho"')
  })

  it.each(locales)('%s: el bloque Casos enlaza a cada caso con su título', async (lang) => {
    const html = await render(lang)
    for (const { project } of serviceCases(getProjects(), ORDER)) {
      const link = new RegExp(`<a [^>]*href="/${lang}/portfolio/${project.id}"[^>]*>([^<]*)</a>`).exec(html)
      expect(text(link?.[1] ?? '')).toBe(project.title)
      expect(text(html)).toContain(project.summary[lang])
    }
  })
})

describe('ServiceIcon (FR-406c, T443)', () => {
  it('cada servicio tiene su pictograma de línea fina, decorativo y distinto', () => {
    const icons = SERVICE_IDS.map((id) => renderToStaticMarkup(createElement(ServiceIcon, { id })))
    expect(new Set(icons).size).toBe(SERVICE_IDS.length)
    for (const [index, icon] of icons.entries()) {
      expect(icon).toContain(`data-cw-service-icon="${SERVICE_IDS[index]}"`)
      expect(icon).toContain('aria-hidden="true"')
      expect(icon).toContain('stroke-width="1.5"')
      expect(icon).toContain('#25ED9E')
    }
  })
})
