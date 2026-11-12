import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { compile } from 'sass'
import { describe, expect, it } from 'vitest'
import { nearestIndex, slideStep, stepIndex } from '@/components/site/portfolio/carousel'
import { CaseGallery, GALLERY_SWIPE_QUERY, type GalleryImage } from '@/components/site/portfolio/CaseGallery'
import { eraLabels } from '@/components/site/portfolio/labels'
import { PortfolioView, type PortfolioViewProps } from '@/components/site/portfolio/PortfolioView'
import { ProjectEmbed, type EmbedLabels } from '@/components/site/portfolio/ProjectEmbed'
import { getAllTechnologies, getProjects, getSite, projectTitle } from '@/lib/content'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

const root = process.cwd()
const projects = getProjects()

function css(file: string): string {
  return compile(join(root, 'components', 'site', 'portfolio', file), { loadPaths: [join(root, 'styles')], style: 'expanded' }).css
}

type Block = { prelude: string; body: string }

function topLevelBlocks(source: string): Block[] {
  const blocks: Block[] = []
  let depth = 0
  let start = 0
  let open = -1
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (char === '{') {
      if (depth === 0) open = i
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0) {
        blocks.push({ prelude: source.slice(start, open).trim(), body: source.slice(open + 1, i) })
        start = i + 1
      }
    }
  }
  return blocks
}

const MOBILE_OR_TOUCH = /^@media \(max-width: 767\.98px\)/

function desktopCss(source: string): string {
  return topLevelBlocks(source)
    .filter((block) => !MOBILE_OR_TOUCH.test(block.prelude))
    .map((block) => `${block.prelude} {${block.body}}`)
    .join('\n')
}

function mobileCss(source: string): string {
  return topLevelBlocks(source)
    .filter((block) => MOBILE_OR_TOUCH.test(block.prelude))
    .map((block) => `${block.prelude} {${block.body}}`)
    .join('\n')
}

async function explorerLabels(lang: 'es' | 'en'): Promise<PortfolioViewProps['labels']> {
  const dict = await getDictionary(lang, 'site')
  const keys = {
    title: 'portfolio.title',
    projects: 'portfolio.projects',
    eyebrow: 'portfolio.eyebrow',
    filter: 'portfolio.filter',
    filterAll: 'portfolio.filterAll',
    carousel: 'portfolio.carousel',
    carouselHint: 'portfolio.carouselHint',
    slide: 'portfolio.slide',
    prev: 'portfolio.prev',
    next: 'portfolio.next',
    current: 'portfolio.current',
    filteredAll: 'portfolio.filteredAll',
    filteredOne: 'portfolio.filteredOne',
    filteredMany: 'portfolio.filteredMany',
    viewCase: 'portfolio.viewCase',
    technologies: 'project.technologies',
    era: 'portfolio.era',
    filteredEra: 'portfolio.filteredEra',
    clearFilters: 'portfolio.clearFilters',
  } as const
  const text = Object.fromEntries(Object.entries(keys).map(([name, key]) => [name, t(dict, key)])) as Record<keyof typeof keys, string>
  return { ...text, eras: eraLabels(dict) }
}

describe('carrusel con asomo (T841)', () => {
  it('mide el paso entre diapositivas y cae al ancho del carril sin dos diapositivas', () => {
    expect(slideStep(0, 350, 390)).toBe(350)
    expect(slideStep(0, undefined, 390)).toBe(390)
    expect(slideStep(undefined, undefined, 390)).toBe(390)
    expect(slideStep(350, 350, 390)).toBe(390)
  })

  it('con el paso solapado, el índice cercano sigue siendo exacto', () => {
    const step = 390 - 40
    for (let i = 0; i < 15; i++) expect(nearestIndex(i * step, step, 15)).toBe(i)
    expect(nearestIndex(step * 0.6, step, 15)).toBe(1)
  })

  it('avanza y retrocede dando la vuelta', () => {
    expect(stepIndex(0, 'next', 3)).toBe(1)
    expect(stepIndex(0, 'prev', 3)).toBe(2)
    expect(stepIndex(2, 'next', 3)).toBe(0)
  })

  it('en el HTML del servidor trae los filtros juntos, el conteo, los puntos y el cristal solo en la tarjeta actual', async () => {
    const props: PortfolioViewProps = {
      lang: 'es',
      portfolio: getSite().portfolio,
      projects,
      technologies: getAllTechnologies(),
      labels: await explorerLabels('es'),
    }
    const html = renderToStaticMarkup(createElement(PortfolioView, props))
    expect(html).toMatch(/data-cw-filters=""[\s\S]*data-cw-era-group=""[\s\S]*data-cw-filter=""[\s\S]*data-cw-filter-count=""[^>]*>Mostrando los 15 proyectos</)
    const dots = html.match(/<ol[^>]*data-cw-carousel-dots=""[^>]*>([\s\S]*?)<\/ol>/)
    expect(dots?.[0]).toContain('aria-hidden="true"')
    expect(dots?.[1].match(/<li\b/g)).toHaveLength(projects.length)
    expect(dots?.[1].match(/data-current=""/g)).toHaveLength(1)
    expect(html.match(/data-cw-blur=""/g)).toHaveLength(1)
    expect(html).toMatch(new RegExp(`data-cw-slide="${projects[0]!.id}"[^>]*>\\s*<article[^>]*data-cw-blur=""`))
  })
})

describe('galería deslizable (T843)', () => {
  const labels = { zoom: 'Ampliar', close: 'Cerrar', prev: 'Captura anterior', next: 'Captura siguiente', counter: '{n} de {total}', thumb: 'Ver {n} de {total}' }
  const image = (n: number): GalleryImage => ({ src: `/assets/imgs/projects/x${n}.webp`, alt: `Captura ${n}`, width: 960, height: 640 })

  it('con varias capturas ofrece botones anterior y siguiente para el gesto', () => {
    const html = renderToStaticMarkup(createElement(CaseGallery, { images: [image(1), image(2), image(3)], labels, title: 'X' }))
    expect(html).toMatch(/<button[^>]*aria-label="Captura anterior"[^>]*data-cw-gallery-step="prev"/)
    expect(html).toMatch(/<button[^>]*aria-label="Captura siguiente"[^>]*data-cw-gallery-step="next"/)
    expect(html).toContain('data-cw-gallery-stage=""')
  })

  it('con una sola captura no hay nada que deslizar', () => {
    const html = renderToStaticMarkup(createElement(CaseGallery, { images: [image(1)], labels, title: 'X' }))
    expect(html).not.toContain('data-cw-gallery-step')
  })

  it('el gesto solo se activa en < md o con puntero táctil', () => {
    expect(GALLERY_SWIPE_QUERY).toBe('(max-width: 767.98px), (pointer: coarse)')
  })
})

describe('embebido en una hoja (T844)', () => {
  it('la hoja trae "Cerrar" y "Abrir en una pestaña nueva", y el servidor nunca pinta el iframe', async () => {
    const dict = await getDictionary('es', 'portfolio')
    const keys = [
      'heading', 'intro', 'load', 'open', 'loading', 'ready', 'reload', 'openLive', 'expand', 'collapse', 'view', 'desktop',
      'mobile', 'frame', 'slowTitle', 'slowBody', 'retry', 'close', 'noScript',
    ] as const
    const labels = Object.fromEntries(keys.map((key) => [key, t(dict, `embed.${key}`)])) as EmbedLabels
    const project = projects.find((item) => item.links.live)!
    const html = renderToStaticMarkup(
      createElement(ProjectEmbed, {
        id: 'en-vivo',
        url: project.links.live!,
        title: projectTitle(project, 'es'),
        poster: { src: project.image.src, alt: project.image.alt.es, width: project.image.width, height: project.image.height },
        labels,
      }),
    )
    expect(html).not.toContain('<iframe')
    const sheet = html.match(/<dialog[^>]*data-cw-sheet=""[\s\S]*<\/dialog>/)?.[0] ?? ''
    expect(sheet).toContain('aria-modal="true"')
    expect(sheet).toMatch(/<a [^>]*href="[^"]+"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*data-cw-embed-sheet-external=""[\s\S]*?Abrir el sitio en una pestaña nueva/)
    expect(sheet).toMatch(/<button[^>]*data-cw-embed-sheet-close=""[\s\S]*?Cerrar el sitio en vivo/)
    expect(sheet).toContain(`aria-label="${labels.close}"`)
  })
})

describe('el escritorio no cambia: lo nuevo vive en < md o con puntero táctil (FR-651)', () => {
  it('el carrusel: asomo, puntos, filtros sticky y conteo solo en < md, con JS y sin movimiento reducido', () => {
    const source = css('Portfolio.module.scss')
    const desktop = desktopCss(source)
    expect(desktop).not.toMatch(/position: sticky/)
    expect(desktop).not.toMatch(/--cw-peek/)
    expect(desktop).toMatch(/\.dots \{\s*display: none;\s*\}/)
    expect(desktop).toMatch(/\.filterCount \{\s*display: none;\s*\}/)
    const mobile = mobileCss(source)
    expect(mobile).toMatch(/and \(prefers-reduced-motion: no-preference\)\s*\{\s*:global\(:root\[data-js\]\) \.filters \{[^}]*position: sticky;[^}]*top: var\(--cw-header-h\)/)
    expect(mobile).toMatch(/\.track \{\s*--cw-peek: clamp\(28px, 10vw, 40px\);/)
    expect(mobile).toMatch(/\.slide \{[^}]*margin-right: calc\(var\(--cw-peek\) \* -1\);/)
    expect(mobile).toMatch(/\.filters \.chipButton \{\s*min-height: 44px;/)
    expect(mobile).not.toMatch(/min-width: 992px/)
  })

  it('las tarjetas ADR se apilan solo en < md, con JS y sin movimiento reducido', () => {
    const source = css('AdrCards.module.scss')
    expect(desktopCss(source)).not.toMatch(/position: sticky/)
    expect(mobileCss(source)).toMatch(/prefers-reduced-motion: no-preference\)\s*\{\s*:global\(:root\[data-js\]\) \.card \{\s*position: sticky;/)
  })

  it('los botones y la entrada de la galería solo en < md o con puntero táctil, y la animación sin movimiento reducido', () => {
    const source = css('CaseGallery.module.scss')
    const desktop = desktopCss(source)
    expect(desktop).toMatch(/\.steps \{\s*display: none;\s*\}/)
    expect(desktop).not.toMatch(/animation: cw-gallery/)
    const mobile = mobileCss(source)
    expect(mobile).toMatch(/\.step \{[^}]*width: 44px;[^}]*height: 44px;/)
    expect(mobile).toMatch(/prefers-reduced-motion: no-preference\)\s*\{\s*\.image\[data-enter=next\]/)
  })
})
