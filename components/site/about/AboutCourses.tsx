import Image from 'next/image'
import type { SiteContent } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Icon } from '@/components/ui/Icon'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'

export type AboutCoursesProps = {
  lang: Locale
  title: string
  newTab: string
  courses: SiteContent['about']['courses']
}

export function AboutCourses({ lang, title, newTab, courses }: AboutCoursesProps) {
  return (
    <section className={styles.section} aria-labelledby="about-courses" data-cw-about="courses">
      <SectionTitle id="about-courses">{title}</SectionTitle>
      <GlassSurface variant="standard" className={styles.panel}>
        <ul className={styles.entries}>
          {courses.schools.map((school) => (
            <li key={school.name.en} className={styles.entry}>
              <h3 className={styles.entryTitle}>{school.name[lang]}</h3>
              <p className={styles.entryText}>{school.description[lang]}</p>
            </li>
          ))}
        </ul>
        <a href={courses.platzi.href} target="_blank" rel="noopener noreferrer" className={styles.platzi}>
          {courses.platzi.icon ? <Image src={courses.platzi.icon} alt="" width={40} height={40} sizes="40px" /> : null}
          <span>{courses.platzi.label[lang]}</span>
          <Icon name="external" size={18} />
          <span className="cw-visually-hidden">{newTab}</span>
        </a>
      </GlassSurface>
    </section>
  )
}
