import type { Project, SiteContent } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks, GridLines, Scanline } from '@/components/ui/graphics'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import { typeset } from '../typeset'
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
              {typeset(intro, lang)}
            </p>
          </GlassSurface>
        ) : null}
      </section>

      <section className={styles.projects} aria-labelledby="portfolio-projects">
        <GlassSurface variant="subtle" edge grain className={styles.band} data-cw-portfolio-band="">
          <GridLines fade="radial" />
          <CornerMarks inset={-1} />
          <Scanline axis="x" edge="bottom" delay={600} />
          <SectionTitle id="portfolio-projects">{labels.projects}</SectionTitle>
        </GlassSurface>
        <ProjectsExplorer projects={projects.map((project) => toSlide(project, lang))} technologies={technologies} labels={labels} />
        <footer className={styles.footer} data-cw-glass="strong">
          <p>{portfolio.footer[lang]}</p>
        </footer>
      </section>
    </div>
  )
}
