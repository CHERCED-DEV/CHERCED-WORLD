import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BackgroundIntensity } from '@/components/motion'
import { isLocale, localizedPath, t, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { CaseStudy } from '@/components/site/portfolio/CaseStudy'
import { caseEvidenceLabels, caseStudyExtraLabels } from '@/components/site/portfolio/labels'
import { caseStudyNeighbors, technologyCounts, type CaseStudyLabels } from '@/components/site/portfolio/projects'
import { caseRelatedLinks, casePostIds, type RelatedPostTitle } from '@/components/site/portfolio/related'
import { pageMetadata } from '@/components/site/metadata'
import { synergosShowcase, SYNERGOS_CASE_ID } from '@/content/synergos-showcase'
import { getProject, getProjects, getSite, loadPost, projectTitle } from '@/lib/content'
import { caseBreadcrumbJsonLd, caseStudyJsonLd } from '@/lib/seo/case-study'
import { jsonLdScript } from '@/lib/seo/person'

type Props = { params: Promise<{ lang: string; id: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return getProjects().map((project) => ({ id: project.id }))
}

async function resolve(params: Props['params']) {
  const { lang, id } = await params
  if (!isLocale(lang)) notFound()
  const project = getProject(id)
  if (!project) notFound()
  return { lang, project }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, project } = await resolve(params)
  const common = await getDictionary(lang, 'common')
  return pageMetadata({
    lang,
    path: `/portfolio/${project.id}`,
    title: projectTitle(project, lang),
    description: project.summary[lang],
    common,
    ogImageFile: true,
  })
}

async function relatedPostTitles(projectId: string, lang: Locale): Promise<RelatedPostTitle[]> {
  const posts = await Promise.all(casePostIds(projectId).map((id) => loadPost(id, lang)))
  return posts.flatMap((post) => (post ? [{ id: post.meta.id, title: post.meta.title, lang: post.meta.lang }] : []))
}

export default async function CaseStudyPage({ params }: Props) {
  const { lang, project } = await resolve(params)
  const [dict, portfolio, common, posts] = await Promise.all([
    getDictionary(lang, 'site'),
    getDictionary(lang, 'portfolio'),
    getDictionary(lang, 'common'),
    relatedPostTitles(project.id, lang),
  ])
  const labels: CaseStudyLabels = {
    context: t(dict, 'project.context'),
    role: t(dict, 'project.role'),
    decisions: t(dict, 'project.decisions'),
    result: t(dict, 'project.result'),
    technologies: t(dict, 'project.technologies'),
    links: t(dict, 'project.links'),
    live: t(dict, 'project.live'),
    github: t(dict, 'project.github'),
    newTab: t(dict, 'a11y.newTab'),
  }

  const projects = getProjects()
  const extraLabels = caseStudyExtraLabels(portfolio)

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <CaseStudy
        project={project}
        lang={lang}
        labels={labels}
        extras={{
          labels: extraLabels,
          neighbors: caseStudyNeighbors(projects, project.id, lang),
          usage: technologyCounts(projects),
          portfolioHref: localizedPath(lang, '/portfolio'),
          evidence: caseEvidenceLabels(dict),
          showcase: project.id === SYNERGOS_CASE_ID ? synergosShowcase.copy.cta[lang] : undefined,
          related: caseRelatedLinks({
            projectId: project.id,
            lang,
            posts,
            services: getSite().services.items,
            labels: { post: extraLabels.relatedPost, services: extraLabels.relatedServices },
          }),
        }}
      />
      <script type="application/ld+json" data-cw-case-ld="" dangerouslySetInnerHTML={{ __html: jsonLdScript(caseStudyJsonLd(project, lang)) }} />
      <script
        type="application/ld+json"
        data-cw-breadcrumbs=""
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(caseBreadcrumbJsonLd(project, lang, { home: t(common, 'nav.home'), section: t(common, 'nav.portfolio') })),
        }}
      />
    </>
  )
}
