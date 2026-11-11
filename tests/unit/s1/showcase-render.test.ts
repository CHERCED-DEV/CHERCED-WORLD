import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { lineLabel, stateText, synergosHref, tallLayout, wideLayout, lanes } from '@/components/site/synergos/model'
import { synergosShowcase } from '@/content/synergos-showcase'
import { getProject } from '@/lib/content'

const { default: SynergosPage, generateMetadata } = await import('@/app/[lang]/synergos/page')
const { generateImageMetadata } = await import('@/app/[lang]/synergos/opengraph-image')

const LANGS = ['es', 'en'] as const
type Lang = (typeof LANGS)[number]

const PUBLIC_REPOS = ['https://github.com/CHERCED-DEV/Synergos.CMS', 'https://github.com/CHERCED-DEV/Synergos.UI', 'https://github.com/CHERCED-DEV/Synergos.Fabrica']

async function render(lang: Lang): Promise<string> {
  return renderToStaticMarkup(await SynergosPage({ params: Promise.resolve({ lang }) }))
}

const html = { es: await render('es'), en: await render('en') }

function text(markup: string): string {
  return markup
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
}

function block(markup: string, start: string, close: string): string {
  const from = markup.indexOf(start)
  expect(from, start).toBeGreaterThan(-1)
  return markup.slice(from, markup.indexOf(close, from) + close.length)
}

function svg(markup: string, variant: 'wide' | 'tall'): string {
  const marker = `data-cw-line-svg="${variant}"`
  const at = markup.indexOf(marker)
  expect(at, marker).toBeGreaterThan(-1)
  return markup.slice(markup.lastIndexOf('<svg', at), markup.indexOf('</svg>', at) + 6)
}

function hrefOf(markup: string, attribute: string): string | null {
  const tag = new RegExp(`<a [^>]*${attribute}[^>]*>`).exec(markup)?.[0] ?? ''
  return /href="([^"]+)"/.exec(tag)?.[1] ?? null
}

function lanesOf(markup: string): Array<{ id: string; state: string; pulses: number }> {
  return [...markup.matchAll(/<g class="[^"]*" data-state="(\w+)" data-cw-lane="(\d+)">([\s\S]*?)<\/g>/g)].map(([, state = '', id = '', body = '']) => ({
    id,
    state,
    pulses: [...body.matchAll(/data-cw-pulse=""/g)].length,
  }))
}

describe.each(LANGS)('/%s/synergos renderizada en el servidor (FR-901)', (lang) => {
  const page = html[lang]
  const copy = synergosShowcase.copy

  it('tiene un solo h1, Synergos, y las seis secciones de la spec en orden', () => {
    expect([...page.matchAll(/<h1[\s>]/g)]).toHaveLength(1)
    expect(page).toMatch(/<h1 id="synergos-title"[^>]*>Synergos<\/h1>/)
    const sections = [...page.matchAll(/data-cw-synergos-section="(\w+)"/g)].map((match) => match[1])
    expect(sections).toEqual(['hero', 'what', 'verticals', 'line', 'mvp', 'build'])
    for (const heading of [copy.what.title, copy.verticals.title, copy.line.title, copy.mvp.title, copy.build.title]) {
      expect(page, heading[lang]).toContain(`>${heading[lang]}</h2>`)
    }
  })

  it('el hero dice la idea del caso 12 y enlaza el catálogo en vivo, el caso y los tres repos públicos', () => {
    const project = getProject('12')!
    expect(text(page)).toContain(project.summary[lang])
    expect(hrefOf(page, 'data-cw-synergos-link="catalog"')).toBe(project.links.live)
    expect(hrefOf(page, 'data-cw-synergos-link="case"')).toBe(`/${lang}/portfolio/12`)
    const repos = [...page.matchAll(/<a [^>]*data-cw-synergos-repo=[^>]*>/g)].map((match) => /href="([^"]+)"/.exec(match[0])?.[1])
    expect(repos).toEqual(PUBLIC_REPOS)
  })

  it('solo enlaza código público: ningún enlace a GitHub fuera de los tres repos', () => {
    const github = [...page.matchAll(/href="(https:\/\/github\.com[^"]*)"/g)].map((match) => match[1])
    expect(github.length).toBeGreaterThan(0)
    for (const href of github) expect(PUBLIC_REPOS, href).toContain(href)
    for (const external of page.matchAll(/<a [^>]*target="_blank"[^>]*>/g)) expect(external[0]).toContain('rel="noopener noreferrer"')
  })

  it('"Qué es" reusa el diagrama de capas del caso 12 y nombra el backend', () => {
    const layers = [...page.matchAll(/data-cw-diagram-layer="([\w-]+)"/g)].map((match) => match[1])
    expect(layers).toEqual(['cdn', 'umbraco', 'micro-frontends'])
    expect(text(page)).toContain(lang === 'es' ? 'backend .NET con 20 capacidades y 9 orquestadores' : '.NET backend with 20 capabilities and 9 orchestrators')
  })

  it('una tarjeta por vertical, con su frase, su estado y sus tareas', () => {
    const cards = [...page.matchAll(/data-state="(\w+)" data-cw-vertical="(\d+)"/g)].map((match) => [match[2], match[1]])
    const verticals = synergosShowcase.lines.filter((line) => line.kind === 'vertical')
    expect(cards).toEqual(verticals.map((line) => [line.id, line.state]))
    for (const line of verticals) {
      expect(page).toContain(`>${line.name[lang].replace('&', '&amp;')}</h3>`)
      expect(text(page)).toContain(line.does[lang])
    }
  })

  it('la línea de ensamblaje es SVG del servidor, con título, descripción y su alternativa en texto (FR-902)', () => {
    for (const variant of ['wide', 'tall'] as const) {
      const drawing = svg(page, variant)
      expect(drawing).toContain('role="img"')
      expect(drawing).toContain(`aria-labelledby="synergos-line-${variant}-title synergos-line-${variant}-desc"`)
      expect(drawing).toMatch(new RegExp(`<title id="synergos-line-${variant}-title">14 `))
      expect(drawing).toContain(`<desc id="synergos-line-${variant}-desc">`)
      expect(lanesOf(drawing).map((lane) => lane.id)).toEqual(synergosShowcase.lines.map((line) => line.id))
    }
    const list = block(page, 'data-cw-line-list', '</details>')
    expect(list).toContain('<summary')
    const items = [...list.matchAll(/data-cw-line-item="(\d+)"/g)].map((match) => match[1])
    expect(items).toEqual(synergosShowcase.lines.map((line) => line.id))
    for (const line of synergosShowcase.lines) {
      expect(text(list)).toContain(lineLabel(line, lang).replace('&amp;', '&'))
      expect(text(list)).toContain(`${line.done} ${lang === 'es' ? 'de' : 'of'} ${line.total}`)
    }
  })

  it('los pulsos van solo en las líneas activas y en la salida hacia el release', () => {
    for (const variant of ['wide', 'tall'] as const) {
      const drawing = svg(page, variant)
      for (const lane of lanesOf(drawing)) expect(lane.pulses, `${variant} ${lane.id}`).toBe(lane.state === 'active' ? 1 : 0)
      expect([...drawing.matchAll(/data-cw-pulse=""/g)]).toHaveLength(5)
    }
  })

  it('hitos con su estado para lectores y cifras con la fecha del conteo visible', () => {
    const states = [...page.matchAll(/data-state="(\w+)" data-cw-milestone="([\w-]+)"/g)].map((match) => match[1])
    expect(states).toEqual(synergosShowcase.milestones.map((milestone) => milestone.state))
    expect(page).toContain(`<span class="cw-visually-hidden">${copy.mvp.states.doing[lang]}: </span>`)
    const date = lang === 'es' ? '5 de noviembre de 2026' : 'November 5, 2026'
    expect(page).toContain(`<time dateTime="2026-11-05">${date}</time>`)
    expect(text(block(page, 'data-cw-synergos-counted', '</p>'))).toContain(lang === 'es' ? 'Conteo del 5 de noviembre de 2026' : 'Counted on November 5, 2026')
    const figures = text(block(page, 'data-cw-synergos-figure="lines"', '</dl>'))
    for (const value of ['14', '587 /709', lang === 'es' ? '6.600+' : '6,600+', '92', '140+']) expect(figures).toContain(value)
  })

  it('"Cómo se construye" enlaza el caso 13 y Synergos.Fabrica', () => {
    expect(hrefOf(page, 'data-cw-synergos-link="build-case"')).toBe(`/${lang}/portfolio/13`)
    expect(hrefOf(page, 'data-cw-synergos-link="harness"')).toBe('https://github.com/CHERCED-DEV/Synergos.Fabrica')
  })

  it('publica el JSON-LD CreativeWork cuyo autor es la Person del sitio (FR-903)', () => {
    const script = /<script type="application\/ld\+json" data-cw-synergos-ld=""[^>]*>([\s\S]*?)<\/script>/.exec(page)?.[1] ?? ''
    const data = JSON.parse(script) as Record<string, unknown>
    expect(data['@type']).toBe('CreativeWork')
    expect(data.author).toEqual({ '@id': expect.stringMatching(/\/#person$/) })
    expect(data.url).toMatch(new RegExp(`/${lang}/synergos$`))
    expect(data.inLanguage).toBe(lang)
  })
})

describe('paridad ES y EN', () => {
  it('las dos versiones tienen la misma estructura', () => {
    const shape = (markup: string) => [...markup.matchAll(/data-cw-[\w-]+(="[^"]*")?/g)].map((match) => match[0]).join('|')
    expect(shape(html.en)).toBe(shape(html.es))
  })

  it('ningún texto en español se cuela en inglés ni al revés', () => {
    const en = text(html.en)
    const es = text(html.es)
    for (const word of ['tareas', 'cerrada', 'Hitos', 'Conteo', 'Cómo se construye', 'Los verticales', 'en pausa']) expect(en, word).not.toContain(word)
    for (const word of ['tasks closed', 'Counted on', 'How it is built', 'The verticals', 'paused']) expect(es, word).not.toContain(word)
  })
})

describe('metadatos e imagen OG (FR-903)', () => {
  it.each(LANGS)('%s: título, descripción, canónica y alternativas', async (lang) => {
    const meta = await generateMetadata({ params: Promise.resolve({ lang }) })
    expect(meta.title).toBe(synergosShowcase.copy.title[lang])
    expect(meta.description).toBe(synergosShowcase.copy.description[lang])
    expect(meta.alternates?.canonical).toBe(`/${lang}/synergos`)
    expect(Object.keys(meta.alternates?.languages ?? {}).sort()).toEqual(['en', 'es', 'x-default'])
    expect(meta.openGraph?.images).toBeUndefined()
  })

  it.each(LANGS)('%s: la imagen OG usa la plantilla de la 004 con el título y la idea del caso', async (lang) => {
    const [image] = await generateImageMetadata({ params: { lang } })
    expect(image).toMatchObject({ id: 'og', size: { width: 1200, height: 630 }, contentType: 'image/png' })
    expect(image?.alt).toContain('Synergos')
    expect(image?.alt).toContain(getProject('12')!.summary[lang])
    expect(await generateImageMetadata({ params: { lang: 'fr' } })).toEqual([])
  })

  it('el href de la página es /[lang]/synergos', () => {
    expect(synergosHref('es')).toBe('/es/synergos')
    expect(synergosHref('en')).toBe('/en/synergos')
  })
})

describe('geometría del diagrama', () => {
  const items = lanes(synergosShowcase.lines, 'es')

  it('cada carril cabe en su lienzo, en escritorio y en móvil', () => {
    for (const layout of [wideLayout(items), tallLayout(items)]) {
      expect(layout.lanes).toHaveLength(14)
      for (const lane of layout.lanes) {
        expect(lane.labelY).toBeLessThan(layout.height)
        expect(lane.statusX).toBeLessThan(layout.width)
      }
      expect(layout.director.cy + layout.director.r).toBeLessThan(layout.height)
      expect(layout.release.x + layout.release.width).toBeLessThanOrEqual(layout.width)
      expect(layout.release.y + layout.release.height).toBeLessThanOrEqual(layout.height)
    }
  })

  it('en móvil los carriles bajan hacia el director, que queda debajo de todos', () => {
    const tall = tallLayout(items)
    const last = tall.lanes.at(-1)!
    expect(tall.director.cy).toBeGreaterThan(last.labelY)
    expect(tall.release.y).toBeGreaterThan(tall.director.cy)
    expect(tall.trunk).toMatch(/^M10 /)
  })

  it('el estado de cada carril se escribe "estado · hechas/total"', () => {
    expect(stateText(synergosShowcase.lines[0]!, 'es')).toBe('activa · 102/104')
    expect(stateText(synergosShowcase.lines.at(-1)!, 'en')).toBe('paused · 1/59')
  })
})
