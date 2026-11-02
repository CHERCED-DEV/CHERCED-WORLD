import type { Metadata } from 'next'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { PortfolioView } from '@/components/site/portfolio/PortfolioView'
import { getAllTechnologies, getProjects, getSite } from '@/lib/content'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

const EXPLORER_KEYS = {
  title: 'portfolio.title',
  projects: 'portfolio.projects',
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
} as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const [site, common] = await Promise.all([getDictionary(lang, 'site'), getDictionary(lang, 'common')])
  return pageMetadata({
    lang,
    path: '/portfolio',
    title: t(site, 'meta.portfolio.title'),
    description: t(site, 'meta.portfolio.description'),
    common,
  })
}

export default async function PortfolioPage({ params }: Props) {
  const lang = await resolveLang(params)
  const dict = await getDictionary(lang, 'site')
  const labels = Object.fromEntries(Object.entries(EXPLORER_KEYS).map(([name, key]) => [name, t(dict, key)])) as Record<
    keyof typeof EXPLORER_KEYS,
    string
  >

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <PortfolioView
        lang={lang}
        portfolio={getSite().portfolio}
        projects={getProjects()}
        technologies={getAllTechnologies()}
        labels={labels}
      />
    </>
  )
}
