import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import blogEn from '@/content/i18n/en/blog.json'
import blogEs from '@/content/i18n/es/blog.json'
import commonEn from '@/content/i18n/en/common.json'
import commonEs from '@/content/i18n/es/common.json'
import siteEn from '@/content/i18n/en/site.json'
import siteEs from '@/content/i18n/es/site.json'
import { projects } from '@/content/projects'
import { projectTitle } from '@/lib/content/project-title'

const LANGS = ['es', 'en'] as const
const COMMON = { es: commonEs, en: commonEn } as const
const SITE = { es: siteEs, en: siteEn } as const
const BLOG = { es: blogEs, en: blogEn } as const

type Node = Record<string, unknown>

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

function attr(tag: string, name: string): string | null {
  return new RegExp(`\\s${name}="([^"]*)"`, 'i').exec(tag)?.[1]?.replace(/&amp;/g, '&') ?? null
}

function headTags(html: string, element: 'link' | 'meta', key: 'rel' | 'name', value: string): string[] {
  const head = html.slice(0, html.indexOf('</head>'))
  return [...head.matchAll(new RegExp(`<${element}\\b[^>]*>`, 'gi'))].map(([tag]) => tag).filter((tag) => attr(tag, key) === value)
}

function pathOf(href: string | null): string | null {
  return href ? new URL(href).pathname : null
}

function jsonLd(html: string): Node[] {
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(([, body]) => JSON.parse(body ?? '') as Node)
}

async function sitemapPaths(request: APIRequestContext): Promise<{ origin: string; paths: string[] }> {
  const xml = await (await request.get('/sitemap.xml')).text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc ?? ''))
  return { origin: urls[0]!.origin, paths: urls.map((url) => url.pathname) }
}

async function pageLd(page: Page): Promise<Node[]> {
  return page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? '{}')))
}

test.describe('cada URL del sitemap es indexable y su propia canónica (SC-803)', () => {
  onlyIn('desktop-chromium')

  test('200, canónica igual a sí misma, hreflang completo, sin noindex y con alt en cada imagen', async ({ request }) => {
    test.setTimeout(300_000)
    const { origin, paths } = await sitemapPaths(request)
    expect(paths.length).toBeGreaterThan(60)
    const problems: string[] = []
    for (let index = 0; index < paths.length; index += 4) {
      await Promise.all(
        paths.slice(index, index + 4).map(async (path) => {
          const response = await request.get(path, { maxRedirects: 0 })
          if (response.status() !== 200) return void problems.push(`${path}: HTTP ${response.status()}`)
          const html = await response.text()
          const canonical = headTags(html, 'link', 'rel', 'canonical').map((tag) => attr(tag, 'href'))
          if (canonical.length !== 1 || new URL(canonical[0] ?? '/', 'http://x').origin !== origin || pathOf(canonical[0] ?? null) !== path) {
            problems.push(`${path}: canónica ${canonical.join(', ')}`)
          }
          const robots = headTags(html, 'meta', 'name', 'robots').map((tag) => attr(tag, 'content') ?? '')
          if (robots.some((value) => /noindex/.test(value))) problems.push(`${path}: noindex`)
          const hreflang = headTags(html, 'link', 'rel', 'alternate').flatMap((tag) => attr(tag, 'hreflang') ?? [])
          if (['es', 'en', 'x-default'].some((lang) => !hreflang.includes(lang))) problems.push(`${path}: hreflang ${hreflang.join(', ')}`)
          const description = headTags(html, 'meta', 'name', 'description')
          if (description.length !== 1 || (attr(description[0]!, 'content') ?? '').length < 20) problems.push(`${path}: description`)
          const withoutAlt = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag).filter((tag) => !/\salt="/.test(tag))
          if (withoutAlt.length > 0) problems.push(`${path}: <img> sin alt ${withoutAlt[0]}`)
          for (const data of jsonLd(html)) if (data['@context'] !== 'https://schema.org') problems.push(`${path}: JSON-LD sin @context`)
        }),
      )
    }
    expect(problems).toEqual([])
  })

  test('el 404 es noindex y no declara canónica', async ({ request }) => {
    for (const path of ['/es/portfolio/99', '/en/no-existe']) {
      const response = await request.get(path)
      expect(response.status()).toBe(404)
      const html = await response.text()
      expect(headTags(html, 'meta', 'name', 'robots').map((tag) => attr(tag, 'content'))).toEqual(['noindex'])
      expect(headTags(html, 'link', 'rel', 'canonical')).toEqual([])
    }
  })

  test('las etiquetas con el slug del otro idioma redirigen con 308 y no están en el sitemap', async ({ request }) => {
    const { paths } = await sitemapPaths(request)
    const response = await request.get('/en/blog/tag/carrera', { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    expect(new URL(response.headers().location ?? '', 'http://x').pathname).toBe('/en/blog/tag/career')
    expect(paths).not.toContain('/en/blog/tag/carrera')
    expect(paths).toContain('/en/blog/tag/career')
  })

  test('robots.txt, sitemap, RSS y llms.txt usan el mismo origen que la canónica', async ({ request }) => {
    const { origin } = await sitemapPaths(request)
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`)
    expect(robots).toMatch(/Disallow: \/api\//)
    const feed = await (await request.get('/es/feed.xml')).text()
    expect(feed).toContain(`${origin}/es/blog/post4`)
    const llms = await (await request.get('/llms.txt')).text()
    expect(llms).toContain(`${origin}/en/aboutMe`)
    const home = await (await request.get('/es')).text()
    const canonical = headTags(home, 'link', 'rel', 'canonical').map((tag) => attr(tag, 'href'))
    expect(canonical).toEqual([`${origin}/es`])
  })
})

test.describe('datos estructurados de entidad (FR-810 a FR-815)', () => {
  onlyIn('desktop-chromium', 'no-js')

  for (const lang of LANGS) {
    test(`${lang}: Home publica WebSite y Person; Sobre mí, ProfilePage con el mismo Person`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}`)
      const home = await pageLd(page)
      const person = home.find((item) => item['@type'] === 'Person')
      const site = home.find((item) => item['@type'] === 'WebSite')
      expect(person?.sameAs).toEqual(['https://www.linkedin.com/in/cherced/', 'https://github.com/CHERCED-DEV', 'https://platzi.com/p/Cherced/'])
      expect(site).toMatchObject({ name: 'CHERCED-WORLD', author: { '@id': person?.['@id'] }, inLanguage: ['es', 'en'] })
      expect(String(site?.url)).toMatch(/^https?:\/\/[^/]+\/$/)

      await page.goto(`/${lang}/aboutMe`)
      const about = await pageLd(page)
      const profile = about.find((item) => item['@type'] === 'ProfilePage')
      const layoutPerson = about.find((item) => item['@type'] === 'Person')
      expect(profile).toBeTruthy()
      expect((profile?.mainEntity as Node | undefined)?.['@id']).toBe(layoutPerson?.['@id'])
      expect((profile?.mainEntity as Node | undefined)?.name).toBe('Camilo Hernández')
      expect(String(profile?.url)).toMatch(new RegExp(`/${lang}/aboutMe$`))
      expect(about.filter((item) => item['@type'] === 'WebSite')).toEqual([])
    })

    test(`${lang}: casos con CreativeWork y migas; posts con BlogPosting y migas`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}/portfolio/13`)
      const caseLd = await pageLd(page)
      const work = caseLd.find((item) => item['@type'] === 'CreativeWork')
      const caseCrumbs = caseLd.find((item) => item['@type'] === 'BreadcrumbList')
      expect(work?.name).toBe(projectTitle(projects.find((project) => project.id === '13')!, lang))
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(String(work?.name))
      expect(work?.hasPart).toEqual([{ '@type': 'SoftwareSourceCode', name: 'Synergos.Fabrica', codeRepository: 'https://github.com/CHERCED-DEV/Synergos.Fabrica' }])
      expect((caseCrumbs?.itemListElement as Node[]).map((item) => item.name)).toEqual([COMMON[lang]['nav.home'], COMMON[lang]['nav.portfolio'], work?.name])

      await page.goto(`/${lang}/blog/post4`)
      const postLd = await pageLd(page)
      const posting = postLd.find((item) => item['@type'] === 'BlogPosting')
      const postCrumbs = postLd.find((item) => item['@type'] === 'BreadcrumbList')
      const items = postCrumbs?.itemListElement as Node[]
      expect(items.map((item) => item.position)).toEqual([1, 2, 3])
      expect(items.at(-1)?.name).toBe(posting?.headline)
      expect(items.at(-1)?.item).toBe(posting?.url)
    })
  }
})

test.describe('títulos y descripciones para búsqueda (FR-820 a FR-822)', () => {
  onlyIn('desktop-chromium', 'no-js')

  test('las páginas de sección dicen de qué tratan, con el nombre al final', async ({ page }) => {
    await skipIntro(page)
    for (const lang of LANGS) {
      for (const [path, title, description] of [
        ['/services', SITE[lang]['meta.services.searchTitle'], SITE[lang]['meta.services.description']],
        ['/portfolio', SITE[lang]['meta.portfolio.searchTitle'], SITE[lang]['meta.portfolio.description']],
        ['/blog', BLOG[lang]['meta.blog.searchTitle'], BLOG[lang]['meta.blog.description']],
        ['/aboutMe', SITE[lang]['meta.about.title'], SITE[lang]['meta.about.description']],
        ['', COMMON[lang]['meta.title'], SITE[lang]['meta.home.description']],
      ] as const) {
        await page.goto(`/${lang}${path}`)
        await expect(page, `${lang}${path}`).toHaveTitle(path ? `${title} · Camilo Hernández` : title)
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description)
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title)
      }
    }
  })
})

test.describe('enlaces internos entre casos, posts y servicios (FR-850)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  test('el caso 2 enlaza sus posts y sus servicios, y el post vuelve al caso', async ({ page }, testInfo) => {
    await skipIntro(page)
    await page.goto('/es/portfolio/2')
    const related = page.locator('[data-cw-case-related]')
    await expect(related.locator('[data-cw-case-related-link="post"]')).toHaveCount(2)
    await expect(related.locator('a[href="/es/blog/post4"]')).toBeVisible()
    await expect(related.locator('a[href="/es/blog/post5"]')).toBeVisible()
    await expect(related.locator('[data-cw-case-related-link="services"]')).toHaveAttribute('href', '/es/services')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    const toPost = related.locator('a[href="/es/blog/post4"]')
    await toPost.scrollIntoViewIfNeeded()
    if (testInfo.project.name === 'mobile-chromium') await toPost.tap()
    else await toPost.click()
    await expect(page).toHaveURL(/\/es\/blog\/post4$/)
    const back = page.locator('[data-cw-related] [data-cw-related-case="2"]')
    await expect(back).toHaveAttribute('href', '/es/portfolio/2')
    await expect(back).toContainText(BLOG.es['related.case'])
    await back.scrollIntoViewIfNeeded()
    await expect(back).toBeVisible()
  })

  test('los casos de Servicios → Casos vuelven a Servicios; los de 2022–2023 no llevan enlaces nuevos', async ({ page }) => {
    await skipIntro(page)
    for (const id of ['12', '13', '14', '15']) {
      await page.goto(`/en/portfolio/${id}`)
      await expect(page.locator('[data-cw-case-related-link="services"]'), id).toHaveAttribute('href', '/en/services')
    }
    await page.goto('/en/portfolio/1')
    await expect(page.locator('[data-cw-case-related]')).toHaveCount(0)
  })
})
