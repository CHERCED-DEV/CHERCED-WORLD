import type { EducationEntry } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Locale } from '@/lib/i18n'
import { formatPeriod, isPublishable } from '../format'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'

export type AboutEducationProps = { lang: Locale; title: string; presentLabel: string; entries: EducationEntry[] }

export function AboutEducation({ lang, title, presentLabel, entries }: AboutEducationProps) {
  if (!isPublishable(entries)) return null

  return (
    <section className={styles.section} aria-labelledby="about-education" data-cw-about="education">
      <SectionTitle id="about-education">{title}</SectionTitle>
      <GlassSurface variant="standard" className={styles.panel}>
        <ul className={styles.entries}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.entry}>
              <h3 className={styles.entryTitle}>{entry.institution}</h3>
              <p className={styles.entryText}>
                {entry.degree[lang]}
                <span className={styles.entryPeriod}>{formatPeriod(entry.start, entry.end, lang, presentLabel)}</span>
              </p>
            </li>
          ))}
        </ul>
      </GlassSurface>
    </section>
  )
}
