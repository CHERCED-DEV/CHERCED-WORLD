import type { CareerEntry } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Locale } from '@/lib/i18n'
import { formatPeriod, isPublishable } from '../format'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'

export type AboutCareerProps = { lang: Locale; title: string; presentLabel: string; entries: CareerEntry[] }

export function AboutCareer({ lang, title, presentLabel, entries }: AboutCareerProps) {
  if (!isPublishable(entries)) return null

  return (
    <section className={styles.section} aria-labelledby="about-career" data-cw-about="career">
      <SectionTitle id="about-career">{title}</SectionTitle>
      <GlassSurface as="ol" variant="standard" className={styles.timeline}>
        {entries.map((entry) => (
          <li key={entry.id} className={styles.job}>
            <div className={styles.jobHead}>
              <p className={styles.period}>{formatPeriod(entry.start, entry.end, lang, presentLabel)}</p>
              <h3 className={styles.jobRole}>{entry.role[lang]}</h3>
            </div>
            <p className={styles.jobCompany}>{entry.company}</p>
            <p className={styles.prose}>{entry.description[lang]}</p>
          </li>
        ))}
      </GlassSurface>
    </section>
  )
}
