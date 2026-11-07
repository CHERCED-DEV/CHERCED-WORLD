import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { RelatedPosts } from '@/components/blog/post/RelatedPosts'
import { CaseStudy, type CaseStudyExtras } from '@/components/site/portfolio/CaseStudy'
import { caseStudyExtraLabels } from '@/components/site/portfolio/labels'
import { caseRelatedLinks, casePostIds, caseServiceIds, postCaseIds, relatedCases } from '@/components/site/portfolio/related'
import { SERVICE_CASES } from '@/components/site/services/model'
import portfolioEs from '@/content/i18n/es/portfolio.json'
import siteEs from '@/content/i18n/es/site.json'
import blogEs from '@/content/i18n/es/blog.json'
import { CASE_POSTS } from '@/content/related'
import { SERVICE_IDS } from '@/content/types'
import { getProject, getProjects, getSite } from '@/lib/content'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { postRegistry } = await import('@/content/posts/registry')

const LABELS = { post: caseStudyExtraLabels(portfolioEs).relatedPost, services: caseStudyExtraLabels(portfolioEs).relatedServices }
const POSTS = [
  { id: 'post4', title: 'De un portafolio de 2023 a uno hecho con Spec-Driven Development y agentes', lang: 'es' as const },
  { id: 'post5', title: 'Querido Camilo de 2023', lang: 'es' as const },
]

describe('enlaces internos entre casos, posts y servicios (FR-850, SC-805)', () => {
  it('cada relación caso → post apunta a un caso y a posts que existen', () => {
    for (const [caseId, posts] of Object.entries(CASE_POSTS)) {
      expect(getProject(caseId), caseId).not.toBeNull()
      for (const post of posts) expect(Object.keys(postRegistry), post).toContain(post)
    }
    expect(casePostIds('2')).toEqual(['post4', 'post5'])
    expect(postCaseIds('post4')).toEqual(['2'])
    expect(postCaseIds('post1')).toEqual([])
  })

  it('el caso sabe a qué servicios sirve, con el mismo mapa que usa Servicios → Casos', () => {
    for (const [service, cases] of Object.entries(SERVICE_CASES)) {
      for (const id of cases ?? []) expect(caseServiceIds(id, SERVICE_IDS), `${service} ${id}`).toContain(service)
    }
    expect(caseServiceIds('2', SERVICE_IDS)).toEqual(['software-factory', 'product'])
    expect(caseServiceIds('1', SERVICE_IDS)).toEqual([])
  })

  it('caso 2: dos posts y un enlace a Servicios con los títulos de sus servicios', () => {
    const links = caseRelatedLinks({ projectId: '2', lang: 'es', posts: POSTS, services: getSite().services.items, labels: LABELS })
    expect(links.map((link) => [link.kind, link.href])).toEqual([
      ['post', '/es/blog/post4'],
      ['post', '/es/blog/post5'],
      ['services', '/es/services'],
    ])
    expect(links[2]?.name).toBe('FÁBRICAS DE SOFTWARE A LA MEDIDA · DESARROLLO DE PRODUCTO')
    expect(caseRelatedLinks({ projectId: '1', lang: 'es', posts: [], services: getSite().services.items, labels: LABELS })).toEqual([])
  })

  it('un post en otro idioma declara su lang', () => {
    const [link] = caseRelatedLinks({ projectId: '2', lang: 'en', posts: [{ ...POSTS[0]!, lang: 'es' }], services: [], labels: LABELS })
    expect(link).toMatchObject({ href: '/en/blog/post4', lang: 'es' })
  })

  it('el caso los pinta como enlaces internos dentro de su nav de enlaces, sin pestaña nueva', () => {
    const project = getProject('2')!
    const extras: CaseStudyExtras = {
      labels: caseStudyExtraLabels(portfolioEs),
      neighbors: null,
      usage: {},
      portfolioHref: '/es/portfolio',
      related: caseRelatedLinks({ projectId: '2', lang: 'es', posts: POSTS, services: getSite().services.items, labels: LABELS }),
    }
    const labels = {
      context: siteEs['project.context'],
      role: siteEs['project.role'],
      decisions: siteEs['project.decisions'],
      result: siteEs['project.result'],
      technologies: siteEs['project.technologies'],
      links: siteEs['project.links'],
      live: siteEs['project.live'],
      github: siteEs['project.github'],
      newTab: siteEs['a11y.newTab'],
    }
    const html = renderToStaticMarkup(createElement(CaseStudy, { project, lang: 'es', labels, extras }))
    const nav = html.slice(html.indexOf(`aria-label="${labels.links}"`), html.indexOf('</nav>', html.indexOf(`aria-label="${labels.links}"`)))
    const anchors = [...nav.matchAll(/<a [^>]*data-cw-case-related-link="(post|services)"[^>]*>/g)]
    expect(anchors.map(([, kind]) => kind)).toEqual(['post', 'post', 'services'])
    for (const [tag] of anchors) expect(tag).not.toContain('target=')
    expect(nav).toContain(POSTS[0]!.title)
  })

  it('el post enlaza su caso desde "Posts relacionados"', () => {
    const cases = relatedCases('post4', getProjects(), 'es')
    expect(cases).toEqual([{ id: '2', title: 'CHERCED-WORLD 2026', summary: getProject('2')!.summary.es, href: '/es/portfolio/2' }])
    const html = renderToStaticMarkup(createElement(RelatedPosts, { posts: [], cases, lang: 'es', blog: blogEs }))
    expect(html).toContain('data-cw-related-case="2"')
    expect(html).toContain('href="/es/portfolio/2"')
    expect(html).toContain(blogEs['related.case'])
    expect(renderToStaticMarkup(createElement(RelatedPosts, { posts: [], cases: [], lang: 'es', blog: blogEs }))).toBe('')
  })
})
