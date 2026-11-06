import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BackgroundIntensity } from '@/components/motion'
import { isLocale, localizedPath, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { CaseStudy } from '@/components/site/portfolio/CaseStudy'
import { caseEvidenceLabels, caseStudyExtraLabels } from '@/components/site/portfolio/labels'
import { caseStudyNeighbors, technologyCounts, type CaseStudyLabels } from '@/components/site/portfolio/projects'
import { pageMetadata } from '@/components/site/metadata'
import { synergosShowcase, SYNERGOS_CASE_ID } from '@/content/synergos-showcase'
import { getProject, getProjects, projectTitle } from '@/lib/content'

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

export default async function CaseStudyPage({ params }: Props) {
  const { lang, project } = await resolve(params)
  const [dict, portfolio] = await Promise.all([getDictionary(lang, 'site'), getDictionary(lang, 'portfolio')])
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

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <CaseStudy
        project={project}
        lang={lang}
        labels={labels}
        extras={{
          labels: caseStudyExtraLabels(portfolio),
          neighbors: caseStudyNeighbors(projects, project.id, lang),
          usage: technologyCounts(projects),
          portfolioHref: localizedPath(lang, '/portfolio'),
          evidence: caseEvidenceLabels(dict),
          showcase: project.id === SYNERGOS_CASE_ID ? synergosShowcase.copy.cta[lang] : undefined,
        }}
      />
    </>
  )
}
