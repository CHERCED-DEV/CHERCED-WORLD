import Link from 'next/link'
import type { RecruitersContent } from '@/content/types'
import { buttonClassName } from '@/components/ui/Button'
import { CvActions } from '@/components/ui/CvLink'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks, Hairline } from '@/components/ui/graphics'
import { Reveal } from '@/components/ui/Reveal'
import type { Locale } from '@/lib/i18n'
import styles from './Recruiters.module.scss'

export const RECRUITERS_ID = 'recruiters'

export type RecruitersBlockProps = {
  lang: Locale
  content: RecruitersContent
  writeHref: string
  withCv?: boolean
  compact?: boolean
  className?: string
}

export function RecruitersBlock({ lang, content, writeHref, withCv = true, compact = false, className }: RecruitersBlockProps) {
  const titleId = `${RECRUITERS_ID}-title`
  return (
    <section
      id={RECRUITERS_ID}
      className={cx(styles.recruiters, compact && styles.compact, className)}
      aria-labelledby={titleId}
      data-cw-recruiters=""
    >
      <GlassSurface className={styles.panel} edge grain light>
        <CornerMarks />
        <Reveal className={styles.head}>
          <h2 id={titleId} className={styles.heading}>
            {content.title[lang]}
          </h2>
          <Hairline glint className={styles.headLine} />
        </Reveal>
        <p className={styles.intro}>{content.intro[lang]}</p>
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
        <div className={styles.actions}>
          {withCv ? <CvActions lang={lang} downloadVariant="solid" className={styles.cv} /> : null}
          <Link href={writeHref} className={buttonClassName({ variant: withCv ? 'glass' : 'solid' })} data-cw-recruiters-write="">
            {content.write[lang]}
          </Link>
        </div>
      </GlassSurface>
    </section>
  )
}
