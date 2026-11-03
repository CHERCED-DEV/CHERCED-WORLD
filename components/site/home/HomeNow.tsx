import Link from 'next/link'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { localizedPath, type Locale } from '@/lib/i18n'
import styles from './Home.module.scss'
import { splitAround, type NowRole } from './now'

export type HomeNowLabels = {
  title: string
  since: string
  caseStudy: string
  more: string
}

export const HOME_NOW_ID = 'home-now'

function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

export function HomeNow({ lang, roles, labels }: { lang: Locale; roles: NowRole[]; labels: HomeNowLabels }) {
  if (roles.length === 0) return null
  const [sinceBefore, sinceAfter] = splitAround(labels.since, 'date')

  return (
    <section id={HOME_NOW_ID} tabIndex={-1} className={styles.now} aria-labelledby="home-now-title" data-cw-home-now="">
      <GlassSurface className={styles.panel}>
        <div className={styles.head}>
          <span className={styles.live} aria-hidden="true" />
          <h2 id="home-now-title" className={styles.heading}>
            {labels.title}
          </h2>
          <span className={styles.headLine} aria-hidden="true" />
        </div>
        <ol className={styles.roles}>
          {roles.map((role) => (
            <li key={role.id} className={styles.role} data-cw-home-role={role.id}>
              <h3 className={styles.company}>{role.company}</h3>
              <p className={styles.roleName}>{role.role}</p>
              <p className={styles.since}>
                <span>
                  {sinceBefore}
                  <time dateTime={role.start}>{role.since}</time>
                  {sinceAfter}
                </span>
              </p>
              {role.project ? (
                <Link
                  href={localizedPath(lang, `/portfolio/${role.project.id}`)}
                  className={cx(styles.link, styles.roleLink)}
                  data-cw-home-link="case"
                >
                  <span className={styles.linkText}>
                    {labels.caseStudy}
                    <span className="cw-visually-hidden">: {role.project.title}</span>
                  </span>
                  <Arrow />
                </Link>
              ) : null}
            </li>
          ))}
        </ol>
        <div className={styles.foot}>
          <Link href={localizedPath(lang, '/aboutMe')} className={styles.link} data-cw-home-link="about">
            <span className={styles.linkText}>{labels.more}</span>
            <Arrow />
          </Link>
        </div>
      </GlassSurface>
    </section>
  )
}
