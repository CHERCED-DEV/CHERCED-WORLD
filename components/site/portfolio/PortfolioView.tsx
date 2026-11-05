import Image from 'next/image'
import type { Project, SiteContent } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import styles from './Portfolio.module.scss'
import { ProjectsExplorer, type ExplorerLabels } from './ProjectsExplorer'
import { portfolioIntro, toSlide } from './projects'

export type PortfolioViewProps = {
  lang: Locale
  portfolio: SiteContent['portfolio']
  projects: Project[]
  technologies: string[]
  labels: ExplorerLabels & { title: string; projects: string }
}

export function PortfolioView({ lang, portfolio, projects, technologies, labels }: PortfolioViewProps) {
  const intro = portfolioIntro(portfolio, lang)
  return (
    <div className={styles.page}>
      <section className={styles.intro} aria-labelledby="portfolio-title">
        <SectionTitle as="h1" id="portfolio-title">
          {labels.title}
        </SectionTitle>
        {intro ? (
          <GlassSurface variant="standard" className={styles.introCard}>
            <p className={styles.prose} data-cw-portfolio-intro="">
              {intro}
            </p>
          </GlassSurface>
        ) : null}
      </section>

      <section className={styles.projects} aria-labelledby="portfolio-projects">
        <div className={styles.band}>
          <Image src="/assets/imgs/mobilePortfolio.png" alt="" fill sizes="100vw" className={styles.bandImage} />
          <SectionTitle id="portfolio-projects">{labels.projects}</SectionTitle>
        </div>
        <ProjectsExplorer projects={projects.map((project) => toSlide(project, lang))} technologies={technologies} labels={labels} />
        <footer className={styles.footer} data-cw-glass="strong">
          <p>{portfolio.footer[lang]}</p>
        </footer>
      </section>
    </div>
  )
}
