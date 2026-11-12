import type { CSSProperties } from 'react'
import { SYNERGOS_CASE_ID } from '@/content/synergos-showcase'
import type { Project, SiteContent } from '@/content/types'
import { localizedPath, type Locale } from '@/lib/i18n'
import { HomeBanner } from '../HomeBanner'
import enter from './Enter.module.scss'
import { featuredProjects } from './featured'
import styles from './Home.module.scss'
import { HomeFeatured, type HomeFeaturedLabels } from './HomeFeatured'
import { HOME_NOW_ID, HomeNow, type HomeNowLabels } from './HomeNow'
import { nowRoles } from './now'
import { RecruitersEntry, RecruitersFallback } from './RecruitersEntry'
import { ScrollCue } from './ScrollCue'

export type HomeViewLabels = {
  socials: string
  previousTitle: string
  cue: string
  now: HomeNowLabels
  featured?: HomeFeaturedLabels
}

export type HomeViewProps = {
  lang: Locale
  site: SiteContent
  projects: Project[]
  labels: HomeViewLabels
}

export function HomeView({ lang, site, projects, labels }: HomeViewProps) {
  const roles = nowRoles(site.about.career, projects, lang)
  const contact = localizedPath(lang, '/contactMe')
  const shown = [SYNERGOS_CASE_ID, ...roles.flatMap((role) => (role.project ? [role.project.id] : []))]
  const featured = labels.featured ? featuredProjects(projects, shown) : []

  return (
    <>
      <div className={styles.hero}>
        <HomeBanner
          lang={lang}
          home={site.home}
          socials={site.socials}
          socialsLabel={labels.socials}
          previousTitleLabel={labels.previousTitle}
          extra={site.recruiters ? <RecruitersEntry lang={lang} content={site.recruiters} writeHref={contact} /> : null}
        />
        {roles.length > 0 ? (
          <div className={enter.enter} style={{ '--cw-home-step': 5 } as CSSProperties}>
            <ScrollCue href={`#${HOME_NOW_ID}`} label={labels.cue} />
          </div>
        ) : null}
      </div>
      <HomeNow lang={lang} roles={roles} labels={labels.now} />
      {labels.featured ? <HomeFeatured lang={lang} projects={featured} total={projects.length} labels={labels.featured} /> : null}
      {site.recruiters ? <RecruitersFallback lang={lang} content={site.recruiters} writeHref={contact} /> : null}
    </>
  )
}
