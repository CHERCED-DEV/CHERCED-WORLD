import type { EducationEntry } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Reveal } from '@/components/ui/Reveal'
import type { Locale } from '@/lib/i18n'
import { isPublishable } from '../format'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'
import { Period } from './Period'

export type AboutEducationProps = { lang: Locale; title: string; presentLabel: string; entries: EducationEntry[] }

export function AboutEducation({ lang, title, presentLabel, entries }: AboutEducationProps) {
  if (!isPublishable(entries)) return null

  return (
    <section className={styles.section} aria-labelledby="about-education" data-cw-about="education">
      <SectionTitle id="about-education">{title}</SectionTitle>
      <Reveal className={styles.revealBlock}>
        <GlassSurface variant="standard" edge light className={styles.panel}>
          <ul className={styles.entries}>
            {entries.map((entry) => (
              <li key={entry.id} className={styles.entry}>
                <h3 className={styles.entryTitle}>{entry.institution}</h3>
                <p className={styles.entryText}>
                  {entry.degree[lang]}
                  <Period className={styles.entryPeriod} start={entry.start} end={entry.end} lang={lang} presentLabel={presentLabel} />
                </p>
              </li>
            ))}
          </ul>
        </GlassSurface>
      </Reveal>
    </section>
  )
}
