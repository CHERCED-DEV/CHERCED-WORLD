import type { ReactNode } from 'react'
import type { Certification } from '@/content/types'
import { formatMonth } from '@/components/site/format'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Icon } from '@/components/ui/Icon'
import type { Locale } from '@/lib/i18n'
import styles from './Certifications.module.scss'

export type CertificationsLabels = { title: string; profile: string; newTab: string }

export type CertificationsProps = {
  lang: Locale
  items: readonly Certification[]
  profileHref: string | null
  labels: CertificationsLabels
  headingId?: string
  plain?: boolean
}

export function Certifications({ lang, items, profileHref, labels, headingId = 'about-certifications', plain = false }: CertificationsProps) {
  if (items.length === 0) return null
  const body: ReactNode = (
    <>
      <h3 id={headingId} className={styles.title}>
        {labels.title}
      </h3>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.name.en} className={styles.item} data-cw-certification="">
            <span className={styles.name}>{item.name[lang]}</span>
            <span className={styles.meta}>
              {item.issuer}
              {item.date ? (
                <>
                  {' · '}
                  <time dateTime={item.date}>{formatMonth(item.date, lang)}</time>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {profileHref ? (
        <a href={profileHref} target="_blank" rel="noopener noreferrer" className={styles.link} data-cw-certifications-profile="">
          <span>{labels.profile}</span>
          <Icon name="external" size={16} />
          <span className="cw-visually-hidden">{labels.newTab}</span>
        </a>
      ) : null}
    </>
  )
  return (
    <section className={styles.certifications} aria-labelledby={headingId} data-cw-certifications="">
      {plain ? (
        <div className={cx(styles.panel, styles.plain)}>{body}</div>
      ) : (
        <GlassSurface className={styles.panel} edge light>
          {body}
        </GlassSurface>
      )}
    </section>
  )
}
