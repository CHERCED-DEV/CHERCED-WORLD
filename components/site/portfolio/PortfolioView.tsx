import type { Project, SiteContent } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks, GridLines } from '@/components/ui/graphics'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import { typeset } from '../typeset'
import { fillTemplate } from './carousel'
import styles from './Portfolio.module.scss'
import { ProjectsExplorer, type ExplorerLabels } from './ProjectsExplorer'
import { portfolioIntro, projectYears, splitLede, toSlide } from './projects'

export type PortfolioViewProps = {
  lang: Locale
  portfolio: SiteContent['portfolio']
  projects: Project[]
  technologies: string[]
  labels: ExplorerLabels & { title: string; projects: string; eyebrow: string }
}

export function PortfolioView({ lang, portfolio, projects, technologies, labels }: PortfolioViewProps) {
  const intro = portfolioIntro(portfolio, lang)
  const lede = intro ? splitLede(intro) : null
  const years = projectYears(projects)
  const eyebrow = years ? fillTemplate(labels.eyebrow, { count: projects.length, from: years.from, to: years.to }) : null
  return (
    <div className={styles.page}>
      <section className={styles.intro} aria-labelledby="portfolio-title">
        <GlassSurface className={styles.hero} edge grain depth light data-cw-portfolio-hero="">
          <GridLines fade="radial" />
          <CornerMarks />
          {eyebrow ? (
            <p className={styles.eyebrow} data-cw-portfolio-eyebrow="">
              {eyebrow}
            </p>
          ) : null}
          <SectionTitle as="h1" id="portfolio-title">
            {labels.title}
          </SectionTitle>
          {lede ? (
            <p className={styles.introText} data-cw-portfolio-intro="">
              <span className={styles.lede}>{typeset(lede.lede, lang)}</span>
              {lede.rest ? <> {typeset(lede.rest, lang)}</> : null}
            </p>
          ) : null}
        </GlassSurface>
      </section>

      <section className={styles.projects} aria-labelledby="portfolio-projects">
        <h2 id="portfolio-projects" className="cw-visually-hidden">
          {labels.projects}
        </h2>
        <ProjectsExplorer projects={projects.map((project) => toSlide(project, lang))} technologies={technologies} labels={labels} />
        <p className={styles.footer} data-cw-portfolio-more="">
          {portfolio.footer[lang]}
        </p>
      </section>
    </div>
  )
}
