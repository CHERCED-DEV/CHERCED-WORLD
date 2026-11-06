import { expect, test, type Page } from '@playwright/test'
import { tags as catalog } from '@/content/posts/tags'
import { postIds } from '@/lib/content'

type Lang = 'es' | 'en'

const LANGS: readonly Lang[] = ['es', 'en']

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

async function skipIntro(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
}

const other = (lang: Lang): Lang => (lang === 'es' ? 'en' : 'es')

function foreignIn(lang: Lang): Set<string> {
  return new Set(catalog.filter((names) => names.es !== names.en).map((names) => names[other(lang)]))
}

function shownTags(page: Page): Promise<string[]> {
  return page
    .locator('[data-cw-tag-nav] li a, [data-cw-post-card] ul li, [data-cw-post-tag], [data-cw-tag-results]')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''))
}

function foreignShown(texts: readonly string[], lang: Lang): string[] {
  const foreign = foreignIn(lang)
  return texts.filter((text) => foreign.has(text) || [...foreign].some((label) => text.includes(`«${label}»`) || text.includes(`“${label}”`)))
}

const OLD_URLS: ReadonlyArray<readonly [string, string]> = [
  ['/es/blog/tag/architecture', '/es/blog/tag/arquitectura'],
  ['/es/blog/tag/refactoring', '/es/blog/tag/refactorizacion'],
  ['/es/blog/tag/coupling', '/es/blog/tag/acoplamiento'],
  ['/es/blog/tag/ai-agents', '/es/blog/tag/agentes-de-ia'],
  ['/es/blog/tag/spec-driven-development', '/es/blog/tag/desarrollo-guiado-por-especificaciones'],
  ['/en/blog/tag/carrera', '/en/blog/tag/career'],
  ['/en/blog/tag/cuento', '/en/blog/tag/story'],
  ['/en/blog/tag/inteligencia-artificial', '/en/blog/tag/artificial-intelligence'],
  ['/es/blog/tag/career', '/es/blog/tag/carrera'],
  ['/en/blog/tag/arquitectura', '/en/blog/tag/architecture'],
]

const STABLE_URLS = ['/es/blog/tag/humor', '/es/blog/tag/carrera', '/es/blog/tag/nextjs', '/en/blog/tag/architecture', '/en/blog/tag/spec-driven-development', '/en/blog/tag/career']

test.describe('etiquetas en el idioma de la página (B9, T941)', () => {
  onlyIn('no-js')

  for (const lang of LANGS) {
    test(`/${lang}: el índice, cada página de etiqueta y cada post muestran solo etiquetas de ${lang}`, async ({ page }) => {
      test.setTimeout(120_000)
      await page.goto(`/${lang}/blog`)
      const index = await shownTags(page)
      expect(index.length).toBeGreaterThan(5)
      expect(foreignShown(index, lang), `/${lang}/blog`).toEqual([])

      const tagPages = await page.locator('[data-cw-tag-nav] li a').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
      expect(tagPages.slice(1).length).toBeGreaterThan(5)
      for (const href of tagPages.slice(1)) {
        const response = await page.goto(href)
        expect(response?.status(), href).toBe(200)
        expect(page.url(), href).toMatch(new RegExp(`${href}$`))
        expect(foreignShown(await shownTags(page), lang), href).toEqual([])
        expect(foreignShown([await page.title()], lang), `${href} <title>`).toEqual([])
      }

      for (const id of postIds()) {
        await page.goto(`/${lang}/blog/${id}`)
        const tags = await page.locator('[data-cw-post-tag]').evaluateAll((links) => links.map((link) => [link.textContent?.trim() ?? '', link.getAttribute('href') ?? '']))
        expect(foreignShown(tags.map(([text]) => text ?? ''), lang), `/${lang}/blog/${id}`).toEqual([])
        for (const [, href] of tags) expect(href, `/${lang}/blog/${id}`).toMatch(new RegExp(`^/${lang}/blog/tag/[a-z0-9-]+$`))
        const meta = await page.locator('meta[property="article:tag"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('content') ?? ''))
        expect(foreignShown(meta, lang), `/${lang}/blog/${id} article:tag`).toEqual([])
      }
    })
  }

  test('/es/blog/post5 enlaza sus etiquetas en español', async ({ page }) => {
    await page.goto('/es/blog/post5')
    const tags = page.locator('[data-cw-post-tag]')
    await expect(tags).toHaveText(['refactorización', 'arquitectura', 'humor', 'acoplamiento'])
    expect(await tags.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual([
      '/es/blog/tag/refactorizacion',
      '/es/blog/tag/arquitectura',
      '/es/blog/tag/humor',
      '/es/blog/tag/acoplamiento',
    ])
    await page.goto('/en/blog/post5')
    await expect(page.locator('[data-cw-post-tag]')).toHaveText(['refactoring', 'architecture', 'humor', 'coupling'])
  })

  test('la página de etiqueta declara su par en el otro idioma con el slug de ese idioma', async ({ page }) => {
    await page.goto('/es/blog/tag/carrera')
    await expect(page.getByRole('heading', { name: '1 post con «carrera»' })).toBeVisible()
    await expect(page.locator('head link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/blog\/tag\/career$/)
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', /\/es\/blog\/tag\/carrera$/)
    await expect(page.locator('head meta[name="robots"]')).toHaveCount(0)
  })
})

test.describe('URL de etiqueta viejas (B9)', () => {
  onlyIn('desktop-chromium')

  for (const [old, current] of OLD_URLS) {
    test(`${old} redirige con 308 a ${current}`, async ({ request }) => {
      const response = await request.get(old, { maxRedirects: 0 })
      expect(response.status()).toBe(308)
      expect(new URL(response.headers()['location'] ?? '', 'http://x').pathname).toBe(current)
      const landed = await request.get(old)
      expect(landed.status()).toBe(200)
      expect(new URL(landed.url()).pathname).toBe(current)
      expect(await landed.text()).toMatch(/data-cw-tag-results="[1-9]\d*"/)
    })
  }

  test('las URL que no cambian siguen respondiendo 200 sin redirigir', async ({ request }) => {
    for (const path of STABLE_URLS) {
      const response = await request.get(path, { maxRedirects: 0 })
      expect(response.status(), path).toBe(200)
    }
  })

  test('el sitemap publica solo los slugs actuales de cada idioma', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1] ?? '').pathname).filter((path) => path.includes('/blog/tag/'))
    expect(locs).toContain('/es/blog/tag/arquitectura')
    expect(locs).toContain('/en/blog/tag/architecture')
    for (const [old] of OLD_URLS) expect(locs, old).not.toContain(old)
  })

  for (const lang of LANGS) {
    test(`/${lang}: el RSS y el índice de búsqueda del asistente usan las etiquetas de ${lang}`, async ({ request }) => {
      const foreign = foreignIn(lang)
      const rss = await (await request.get(`/${lang}/feed.xml`)).text()
      const categories = [...rss.matchAll(/<category>([^<]+)<\/category>/g)].map((match) => match[1] ?? '')
      expect(categories.length).toBeGreaterThan(5)
      expect(categories.filter((category) => foreign.has(category))).toEqual([])
      const index = (await (await request.get(`/api/search-index/${lang}`)).json()) as { facts: { posts: Array<{ id: string; tags: string[] }> } }
      const tags = index.facts.posts.flatMap((post) => post.tags)
      expect(tags.length).toBeGreaterThan(5)
      expect(tags.filter((tag) => foreign.has(tag))).toEqual([])
    })
  }
})

test.describe('búsqueda del blog con etiquetas bilingües (B9)', () => {
  onlyIn('desktop-chromium')

  for (const [lang, term, label] of [
    ['es', 'arquitectura', 'Buscar en el blog'],
    ['en', 'architecture', 'Search the blog'],
  ] as const) {
    test(`/${lang}/blog: "${term}" encuentra los posts con esa etiqueta`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}/blog`)
      await page.getByRole('searchbox', { name: label }).fill(term)
      await expect(page.locator('[data-cw-blog-search-status]')).not.toHaveText('', { timeout: 15_000 })
      const shown = await page.locator('[data-cw-post-card]').evaluateAll((cards) =>
        cards.filter((card) => card.checkVisibility()).map((card) => card.getAttribute('data-cw-post-card')),
      )
      expect(shown).toEqual(expect.arrayContaining(['post4', 'post5']))
    })
  }
})
