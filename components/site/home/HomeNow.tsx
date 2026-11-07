import Link from 'next/link'
import { SYNERGOS_CASE_ID } from '@/content/synergos-showcase'
import { ShowcaseLink } from '@/components/site/synergos/ShowcaseLink'
import { cx } from '@/components/ui/cx'
import { GlassSurface, glassMotionAttributes, type GlassFloatLevel } from '@/components/ui/GlassSurface'
import { CornerMarks, GlowOrb, Hairline } from '@/components/ui/graphics'
import { Reveal } from '@/components/ui/Reveal'
import { Sweep } from '@/components/ui/Sweep'
import { localizedPath, type Locale } from '@/lib/i18n'
import styles from './Home.module.scss'
import { splitAround, type NowRole } from './now'

export type HomeNowLabels = {
  title: string
  since: string
  caseStudy: string
  more: string
  showcase?: string
}

export const HOME_NOW_ID = 'home-now'

const STAGGER = 70

export const ROLE_FLOAT_LEVELS: readonly GlassFloatLevel[] = [3, 1, 2]

export function roleFloatLevel(index: number): GlassFloatLevel {
  return ROLE_FLOAT_LEVELS[index % ROLE_FLOAT_LEVELS.length] ?? 1
}

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
    <section id={HOME_NOW_ID} className={styles.now} aria-labelledby="home-now-title" data-cw-home-now="">
      <GlassSurface className={styles.panel} edge grain depth light>
        <GlowOrb size="sm" x="0%" y="0%" />
        <CornerMarks />
        <Reveal className={styles.head}>
          <span className={styles.live} aria-hidden="true" />
          <h2 id="home-now-title" className={styles.heading}>
            {labels.title}
          </h2>
          <Hairline glint className={styles.headLine} />
        </Reveal>
        <ol className={styles.roles}>
          {roles.map((role, index) => (
            <Reveal
              as="li"
              key={role.id}
              delay={(index + 1) * STAGGER}
              className={styles.role}
              data-cw-home-role={role.id}
              {...glassMotionAttributes({ float: roleFloatLevel(index) })}
            >
              <h3 className={styles.company}>{role.company}</h3>
              <p className={styles.roleName}>{role.role}</p>
              <p className={styles.since}>
                <span>
                  {sinceBefore}
                  <time dateTime={role.start}>{role.since}</time>
                  {sinceAfter}
                </span>
              </p>
              {labels.showcase && role.project?.id === SYNERGOS_CASE_ID ? (
                <ShowcaseLink lang={lang} label={labels.showcase} from="home" size="md" className={styles.roleShowcase} />
              ) : role.project ? (
                <Link
                  href={localizedPath(lang, `/portfolio/${role.project.id}`)}
                  className={cx(styles.link, styles.roleLink)}
                  data-cw-home-link="case"
                  aria-label={`${labels.caseStudy}: ${role.project.title}`}
                >
                  <span className={styles.linkText}>{labels.caseStudy}</span>
                  <Arrow />
                </Link>
              ) : null}
              <Sweep />
            </Reveal>
          ))}
        </ol>
        <Reveal className={styles.foot} delay={(roles.length + 1) * STAGGER}>
          <Link href={localizedPath(lang, '/aboutMe')} className={styles.link} data-cw-home-link="about">
            <span className={styles.linkText}>{labels.more}</span>
            <Arrow />
          </Link>
        </Reveal>
      </GlassSurface>
    </section>
  )
}
