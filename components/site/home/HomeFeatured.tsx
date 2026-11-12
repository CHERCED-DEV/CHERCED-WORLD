import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks, Hairline } from '@/components/ui/graphics'
import { Reveal } from '@/components/ui/Reveal'
import { imageSrc } from '@/lib/content/image'
import { projectTitle } from '@/lib/content/project-title'
import { localizedPath, type Locale } from '@/lib/i18n'
import type { EraLabels } from '../portfolio/labels'
import { fillTemplate } from '../portfolio/carousel'
import styles from './Home.module.scss'

export type HomeFeaturedLabels = {
  title: string
  viewCase: string
  all: string
  eras: EraLabels
}

export const HOME_FEATURED_ID = 'home-featured'

const STAGGER = 70

function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

export function HomeFeatured({ lang, projects, total, labels }: { lang: Locale; projects: Project[]; total: number; labels: HomeFeaturedLabels }) {
  if (projects.length === 0) return null

  return (
    <section id={HOME_FEATURED_ID} className={styles.featured} aria-labelledby="home-featured-title" data-cw-home-featured="">
      <GlassSurface className={styles.panel} edge grain depth light>
        <CornerMarks />
        <Reveal className={styles.head}>
          <span className={styles.mark} aria-hidden="true" />
          <h2 id="home-featured-title" className={styles.heading}>
            {labels.title}
          </h2>
          <Hairline glint className={styles.headLine} />
        </Reveal>
        <ul className={styles.cases}>
          {projects.map((project, index) => {
            const title = projectTitle(project, lang)
            return (
              <Reveal as="li" key={project.id} delay={(index + 1) * STAGGER} className={styles.case} data-cw-home-case={project.id}>
                <div className={styles.caseStage}>
                  <Image
                    src={imageSrc(project.image, lang)}
                    alt=""
                    width={project.image.width}
                    height={project.image.height}
                    sizes="(min-width: 768px) 280px, 112px"
                    className={styles.caseImage}
                  />
                </div>
                <div className={styles.caseText}>
                  <p className={styles.caseEra}>{labels.eras[project.era]}</p>
                  <h3 className={styles.caseTitle}>
                    <Link href={localizedPath(lang, `/portfolio/${project.id}`)} className={styles.caseLink} data-cw-home-featured-link="">
                      {title}
                    </Link>
                  </h3>
                  <span className={styles.caseCta} aria-hidden="true">
                    <span className={styles.linkText}>{labels.viewCase}</span>
                    <Arrow />
                  </span>
                </div>
              </Reveal>
            )
          })}
        </ul>
        <Reveal className={styles.foot} delay={(projects.length + 1) * STAGGER}>
          <Link href={localizedPath(lang, '/portfolio')} className={styles.link} data-cw-home-link="portfolio">
            <span className={styles.linkText}>{fillTemplate(labels.all, { count: total })}</span>
            <Arrow />
          </Link>
        </Reveal>
      </GlassSurface>
    </section>
  )
}
