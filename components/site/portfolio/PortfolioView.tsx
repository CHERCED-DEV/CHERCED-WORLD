import Image from 'next/image'
import type { Project, SiteContent } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { localizedPath, type Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import type { SlideProject } from './carousel'
import styles from './Portfolio.module.scss'
import { ProjectsExplorer, type ExplorerLabels } from './ProjectsExplorer'

export type PortfolioViewProps = {
  lang: Locale
  portfolio: SiteContent['portfolio']
  projects: Project[]
  technologies: string[]
  labels: ExplorerLabels & { title: string; projects: string }
}

export function toSlide(project: Project, lang: Locale): SlideProject {
  return {
    id: project.id,
    title: project.title,
    summary: project.summary[lang],
    technologies: project.technologies,
    href: localizedPath(lang, `/portfolio/${project.id}`),
    image: {
      src: project.image.src,
      alt: project.image.alt[lang],
      width: project.image.width,
      height: project.image.height,
    },
  }
}

export function PortfolioView({ lang, portfolio, projects, technologies, labels }: PortfolioViewProps) {
  return (
    <div className={styles.page}>
      <section className={styles.intro} aria-labelledby="portfolio-title">
        <SectionTitle as="h1" id="portfolio-title">
          {labels.title}
        </SectionTitle>
        <GlassSurface variant="standard" className={styles.introCard}>
          {portfolio.intro.map((paragraph) => (
            <p key={paragraph.en} className={styles.prose}>
              {paragraph[lang]}
            </p>
          ))}
        </GlassSurface>
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
