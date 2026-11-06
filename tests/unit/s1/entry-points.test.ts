import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { HomeView, type HomeViewLabels } from '@/components/site/home/HomeView'
import { ToastProvider } from '@/components/ui/Toast'
import { synergosShowcase } from '@/content/synergos-showcase'
import { getProjects, getSite } from '@/lib/content'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { default: AboutMePage } = await import('@/app/[lang]/aboutMe/page')
const { default: CaseStudyPage } = await import('@/app/[lang]/portfolio/[id]/page')
const { default: sitemap } = await import('@/app/sitemap')
const { buildLlmsTxt } = await import('@/lib/agent/llms')
const { getDictionary } = await import('@/lib/i18n/server')
const { uiLabels } = await import('@/components/experience/labels')
const model = await import('@/components/experience/palette-model')
const { synergosJsonLd } = await import('@/lib/seo/synergos')
const { personId } = await import('@/lib/seo/person')

const LANGS = ['es', 'en'] as const
type Lang = (typeof LANGS)[number]

const CTA = synergosShowcase.copy.cta

const Provider = ToastProvider as (props: { closeLabel: string; children?: ReactNode }) => ReactElement

function ctas(html: string): Array<{ href: string; from: string; text: string }> {
  return [...html.matchAll(/(<a [^>]*data-cw-synergos-cta="(\w+)"[^>]*>)([\s\S]*?)<\/a>/g)].map(([, tag = '', from = '', inner = '']) => ({
    href: /href="([^"]+)"/.exec(tag)?.[1] ?? '',
    from,
    text: inner.replace(/<[^>]+>/g, '').trim(),
  }))
}

function homeLabels(lang: Lang): HomeViewLabels {
  return {
    socials: 's',
    previousTitle: 'p',
    cue: 'c',
    now: { title: 'n', since: '{date}', caseStudy: 'case', more: 'more', showcase: CTA[lang] },
  }
}

describe.each(LANGS)('los botones "%s" llevan a /[lang]/synergos', (lang) => {
  it('Home: la tarjeta de Synergos de "Ahora trabajo en" suma el botón, además del enlace al caso', () => {
    const html = renderToStaticMarkup(
      createElement(Provider, { closeLabel: 'x' }, createElement(HomeView, { lang, site: getSite(), projects: getProjects(), labels: homeLabels(lang) })),
    )
    expect(ctas(html)).toEqual([{ href: `/${lang}/synergos`, from: 'home', text: CTA[lang] }])
    const role = html.slice(html.indexOf('data-cw-home-role="synergos-labs"'))
    const card = role.slice(0, role.indexOf('</li>'))
    expect(card).toContain(`href="/${lang}/portfolio/12"`)
    expect(card).toContain('data-cw-synergos-cta="home"')
    const other = html.slice(html.indexOf('data-cw-home-role="sistecredito-ai-first"'))
    expect(other.slice(0, other.indexOf('</li>'))).not.toContain('data-cw-synergos-cta')
  })

  it('Home: sin etiqueta no hay botón', () => {
    const labels = homeLabels(lang)
    const html = renderToStaticMarkup(
      createElement(
        Provider,
        { closeLabel: 'x' },
        createElement(HomeView, { lang, site: getSite(), projects: getProjects(), labels: { ...labels, now: { ...labels.now, showcase: undefined } } }),
      ),
    )
    expect(html).not.toContain('data-cw-synergos-cta')
  })

  it('Sobre mí: el botón va justo debajo de las cifras de "Quién soy"', async () => {
    const html = renderToStaticMarkup(await AboutMePage({ params: Promise.resolve({ lang }) }))
    expect(ctas(html)).toEqual([{ href: `/${lang}/synergos`, from: 'about', text: CTA[lang] }])
    const figures = html.indexOf('data-cw-about="figures"')
    const button = html.indexOf('data-cw-synergos-cta="about"')
    const figuresEnd = html.indexOf('</section>', figures)
    expect(figures).toBeGreaterThan(-1)
    expect(button).toBeGreaterThan(figuresEnd)
    expect(html.slice(figuresEnd, button)).not.toMatch(/<section|<h2/)
    expect(html.indexOf('id="scene-career"')).toBeGreaterThan(button)
  })

  it('Caso 12: un enlace destacado al showcase junto a "Verlo en vivo"; los otros casos no lo llevan', async () => {
    const html = renderToStaticMarkup(await CaseStudyPage({ params: Promise.resolve({ lang, id: '12' }) }))
    expect(ctas(html)).toEqual([{ href: `/${lang}/synergos`, from: 'case', text: CTA[lang] }])
    const hero = html.slice(html.indexOf('<header'), html.indexOf('</header>'))
    expect(hero).toContain('data-cw-case-see-live')
    expect(hero).toContain('data-cw-synergos-cta="case"')
    for (const id of ['13', '1']) {
      const other = renderToStaticMarkup(await CaseStudyPage({ params: Promise.resolve({ lang, id }) }))
      expect(other, id).not.toContain('data-cw-synergos-cta')
    }
  })
})

describe('la página no entra al menú principal ni al footer (P-903)', () => {
  it('ni el header, ni el footer, ni la navegación nombran /synergos', () => {
    for (const file of ['components/shell/nav.ts', 'components/shell/SiteHeader.tsx', 'components/shell/SiteFooter.tsx', 'components/shell/Dock.tsx', 'components/shell/FloatMenu.tsx']) {
      expect(readFileSync(join(process.cwd(), file), 'utf8'), file).not.toMatch(/synergos/i)
    }
  })
})

describe('paleta: comando > synergos', () => {
  async function setup(lang: Lang) {
    const [experience, common] = await Promise.all([getDictionary(lang, 'experience'), getDictionary(lang, 'common')])
    const labels = uiLabels(experience, common)
    const context = { theme: 'dark' as const, email: null, cv: null, now: `/${lang}/now`, synergos: `/${lang}/synergos`, capsuleFound: false }
    const docs = model.toPaletteDocs([], model.buildCommands(labels, context))
    return { docs, searcher: model.createPaletteSearcher(docs) }
  }

  it.each(LANGS)('%s: ">synergos" deja el showcase primero y navega a la página', async (lang) => {
    const ctx = await setup(lang)
    for (const query of ['>synergos', '> synergos', '>master product']) {
      const [first] = model.paletteResults(query, ctx.docs, ctx.searcher, 's')
      expect(first?.id, query).toBe('action:synergos')
      expect(first?.command).toEqual({ type: 'navigate', href: `/${lang}/synergos` })
    }
    const [first] = model.paletteResults('>synergos', ctx.docs, ctx.searcher, 's')
    expect(first?.title).toBe(lang === 'es' ? 'Ver Synergos, mi master product' : 'See Synergos, my master product')
  })

  it('solo aparece en modo de comandos, detrás de /now', async () => {
    const ctx = await setup('es')
    expect(model.paletteResults('', ctx.docs, ctx.searcher, 's').some((item) => item.id === 'action:synergos')).toBe(false)
    expect(model.paletteResults('synergos', ctx.docs, ctx.searcher, 's').some((item) => item.id === 'action:synergos')).toBe(false)
    const commands = model.paletteResults('>', ctx.docs, ctx.searcher, 's').map((item) => item.id)
    expect(commands.indexOf('action:synergos')).toBe(commands.indexOf('action:now') + 1)
  })
})

describe('sitemap, llms.txt y JSON-LD', () => {
  it('el sitemap lista /es/synergos y /en/synergos con sus alternativas', async () => {
    const entries = await sitemap()
    for (const lang of LANGS) {
      const entry = entries.find((item) => new URL(item.url).pathname === `/${lang}/synergos`)
      expect(entry, lang).toBeDefined()
      expect(Object.keys(entry?.alternates?.languages ?? {}).sort()).toEqual(['en', 'es', 'x-default'])
    }
  })

  it('llms.txt la enlaza en los dos idiomas, al frente de los casos de estudio', async () => {
    const lines = (await buildLlmsTxt(new URL('https://cherced-world.test'))).split('\n')
    const heading = lines.indexOf('## Case studies')
    expect(lines[heading + 1]).toBe(
      '- [Synergos, my master product](https://cherced-world.test/en/synergos) · [Synergos, mi master product](https://cherced-world.test/es/synergos)',
    )
  })

  it('CreativeWork con autor = @id de la Person, sus tres repos y la fecha del conteo', () => {
    const base = new URL('https://cherced-world.test')
    const data = synergosJsonLd('es', base)
    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      '@id': 'https://cherced-world.test/es/synergos#synergos',
      name: 'Synergos',
      url: 'https://cherced-world.test/es/synergos',
      inLanguage: 'es',
      image: 'https://cherced-world.test/es/synergos/opengraph-image/og',
      dateModified: '2026-11-05',
      author: { '@id': personId(base) },
    })
    expect(data.hasPart.map((part) => part.name)).toEqual(['Synergos.CMS', 'Synergos.UI', 'Synergos.Fabrica'])
    expect(synergosJsonLd('en', base).headline).toBe('Synergos, my master product')
  })
})
