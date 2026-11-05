import type { CSSProperties } from 'react'
import type { Project, SiteContent } from '@/content/types'
import type { Locale } from '@/lib/i18n'
import { HomeBanner } from '../HomeBanner'
import enter from './Enter.module.scss'
import styles from './Home.module.scss'
import { HOME_NOW_ID, HomeNow, type HomeNowLabels } from './HomeNow'
import { nowRoles } from './now'
import { ScrollCue } from './ScrollCue'

export type HomeViewLabels = {
  socials: string
  previousTitle: string
  cue: string
  now: HomeNowLabels
}

export type HomeViewProps = {
  lang: Locale
  site: SiteContent
  projects: Project[]
  labels: HomeViewLabels
}

export function HomeView({ lang, site, projects, labels }: HomeViewProps) {
  const roles = nowRoles(site.about.career, projects, lang)

  return (
    <>
      <div className={styles.hero}>
        <HomeBanner
          lang={lang}
          home={site.home}
          socials={site.socials}
          socialsLabel={labels.socials}
          previousTitleLabel={labels.previousTitle}
        />
        {roles.length > 0 ? (
          <div className={enter.enter} style={{ '--cw-home-step': 5 } as CSSProperties}>
            <ScrollCue href={`#${HOME_NOW_ID}`} label={labels.cue} />
          </div>
        ) : null}
      </div>
      <HomeNow lang={lang} roles={roles} labels={labels.now} />
    </>
  )
}
