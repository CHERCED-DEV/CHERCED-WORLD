import type { CSSProperties } from 'react'
import type { CareerEntry } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Locale } from '@/lib/i18n'
import { isPublishable } from '../format'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'
import { CareerDeck } from './CareerDeck'
import { Period } from './Period'

export type AboutCareerProps = {
  id?: string
  lang: Locale
  title: string
  presentLabel: string
  openLabel: string
  closeLabel: string
  entries: CareerEntry[]
}

export function AboutCareer({ id, lang, title, presentLabel, openLabel, closeLabel, entries }: AboutCareerProps) {
  if (!isPublishable(entries)) return null

  return (
    <section id={id} className={`${styles.section} ${styles.scene}`} aria-labelledby="about-career" data-cw-about="career" data-cw-scene="career">
      <SectionTitle id="about-career">{title}</SectionTitle>
      <ol className={styles.timeline} data-cw-timeline="">
        {entries.map((entry, index) => {
          const current = entry.end === null
          return (
            <li
              key={entry.id}
              className={styles.milestone}
              data-cw-job={entry.id}
              data-current={current ? '' : undefined}
              style={{ '--cw-i': index } as CSSProperties}
            >
              <span className={styles.node} aria-hidden="true" />
              <p className={styles.when}>
                <span className={styles.whenChip} data-cw-glass="strong">
                  <Period start={entry.start} end={entry.end} lang={lang} presentLabel={presentLabel} />
                </span>
              </p>
              <GlassSurface variant="standard" grain depth edge light className={styles.milestoneCard}>
                <h3 className={styles.jobRole}>{entry.role[lang]}</h3>
                <p className={styles.jobCompany}>{entry.company}</p>
                <p className={styles.jobText}>{entry.description[lang]}</p>
              </GlassSurface>
            </li>
          )
        })}
      </ol>
      <CareerDeck
        lang={lang}
        labels={{ present: presentLabel, open: openLabel, close: closeLabel }}
        jobs={entries.map((entry) => ({
          id: entry.id,
          role: entry.role[lang],
          company: entry.company,
          description: entry.description[lang],
          start: entry.start,
          end: entry.end,
        }))}
      />
    </section>
  )
}
