import Link from 'next/link'
import type { ReactNode } from 'react'
import type { RecruitersContent } from '@/content/types'
import { buttonClassName } from '@/components/ui/Button'
import { CvActions, CvLink } from '@/components/ui/CvLink'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks, Hairline } from '@/components/ui/graphics'
import { featuredPitches } from '@/content/pitches'
import { getProjects } from '@/lib/content'
import { projectTitle } from '@/lib/content/project-title'
import type { Locale } from '@/lib/i18n'
import styles from './Recruiters.module.scss'

export const RECRUITERS_ID = 'recruiters'

export type RecruitersBlockProps = {
  lang: Locale
  content: RecruitersContent
  writeHref: string
  withCv?: boolean
  compact?: boolean
  bare?: boolean
  id?: string
  className?: string
  certifications?: ReactNode
}

function RecruitersBody({
  lang,
  content,
  writeHref,
  withCv,
  titleId,
  certifications,
  actionsFirst,
}: Omit<RecruitersBlockProps, 'compact' | 'bare' | 'id' | 'className'> & { titleId: string; actionsFirst: boolean }) {
  const actions = (
    <div className={cx(styles.actions, actionsFirst && styles.actionsFirst)} data-cw-recruiters-actions="">
      {withCv ? <CvActions lang={lang} downloadVariant="solid" className={styles.cv} /> : null}
      <CvLink lang={lang} />
      <Link href={writeHref} className={buttonClassName({ variant: withCv ? 'glass' : 'solid' })} data-cw-recruiters-write="">
        {content.write[lang]}
      </Link>
    </div>
  )
  return (
    <>
      <div className={styles.head}>
        <h2 id={titleId} className={styles.heading}>
          {content.title[lang]}
        </h2>
        <Hairline glint className={styles.headLine} />
      </div>
      <p className={styles.intro}>{content.intro[lang]}</p>
      {actionsFirst ? actions : null}
      <div className={styles.grid}>
        <div className={styles.block}>
          <h3 className={styles.label}>{content.rolesTitle[lang]}</h3>
          <ul className={styles.roles} data-cw-recruiters-roles="">
            {content.roles.map((role) => (
              <li key={role.es} className={styles.role}>
                {role[lang]}
              </li>
            ))}
          </ul>
          {content.motivation ? (
            <p className={styles.motivation} data-cw-recruiters-motivation="">
              {content.motivation[lang]}
            </p>
          ) : null}
        </div>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt className={styles.label}>{content.modalityTitle[lang]}</dt>
            <dd className={styles.value} data-cw-recruiters-modality="">
              {content.modality[lang]}
            </dd>
          </div>
          <div className={styles.fact}>
            <dt className={styles.label}>{content.englishTitle[lang]}</dt>
            <dd className={styles.value} data-cw-recruiters-english="">
              {content.english[lang]}
            </dd>
          </div>
        </dl>
      </div>
      <PitchLinks lang={lang} />
      {certifications ? <div className={styles.certifications}>{certifications}</div> : null}
      {actionsFirst ? null : actions}
    </>
  )
}

const PITCH_COPY = {
  es: { title: 'Escucha el pitch (60 s)', note: 'Un minuto por caso: problema, decisión, resultado y stack.' },
  en: { title: 'Listen to the pitch (60 s)', note: 'One minute per case: problem, decision, result and stack.' },
} as const

const ROUTE_LINK = { es: 'Pruébame en 10 minutos', en: 'Try me in 10 minutes' } as const

function PitchLinks({ lang }: { lang: Locale }) {
  const pitches = featuredPitches()
  if (pitches.length === 0) return null
  const projects = new Map(getProjects().map((project) => [project.id, project]))
  return (
    <div className={cx(styles.block, styles.pitches)} data-cw-recruiters-pitches="">
      <h3 className={styles.label}>{PITCH_COPY[lang].title}</h3>
      <p className={styles.motivation}>{PITCH_COPY[lang].note}</p>
      <ul className={styles.roles}>
        {pitches.map((pitch) => {
          const project = projects.get(pitch.caseId)
          if (!project) return null
          return (
            <li key={pitch.caseId} className={styles.role}>
              <Link href={`/${lang}/portfolio/${pitch.caseId}#case-pitch-${pitch.caseId}`} prefetch={false}>
                {projectTitle(project, lang)}
              </Link>
            </li>
          )
        })}
      </ul>
      <p className={styles.motivation}>
        <Link href={`/${lang}/ai-lab/ruta`} prefetch={false} data-cw-recruiters-route="">
          {ROUTE_LINK[lang]}
        </Link>
      </p>
    </div>
  )
}

export function RecruitersBlock({
  lang,
  content,
  writeHref,
  withCv = true,
  compact = false,
  bare = false,
  id = RECRUITERS_ID,
  className,
  certifications,
}: RecruitersBlockProps) {
  const titleId = `${id}-title`
  const body = (
    <RecruitersBody
      lang={lang}
      content={content}
      writeHref={writeHref}
      withCv={withCv}
      titleId={titleId}
      certifications={certifications}
      actionsFirst={bare}
    />
  )
  if (bare) {
    return (
      <section id={id} className={cx(styles.bare, className)} aria-labelledby={titleId} data-cw-recruiters="">
        {body}
      </section>
    )
  }
  return (
    <section id={id} className={cx(styles.recruiters, compact && styles.compact, className)} aria-labelledby={titleId} data-cw-recruiters="">
      <GlassSurface className={styles.panel} edge grain light>
        <CornerMarks />
        {body}
      </GlassSurface>
    </section>
  )
}
