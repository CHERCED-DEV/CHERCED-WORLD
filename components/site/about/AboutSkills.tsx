import type { SiteContent } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'

export type AboutSkillsProps = { lang: Locale; title: string; skills: SiteContent['about']['skills'] }

export function AboutSkills({ lang, title, skills }: AboutSkillsProps) {
  return (
    <section className={styles.section} aria-labelledby="about-skills" data-cw-about="skills">
      <SectionTitle id="about-skills">{title}</SectionTitle>
      <GlassSurface variant="standard" className={styles.panel}>
        <p className={styles.prose}>{skills.description[lang]}</p>
        <ul className={styles.bullets}>
          {skills.bullets.map((bullet) => (
            <li key={bullet.en} className={styles.bullet}>
              {bullet[lang]}
            </li>
          ))}
        </ul>
      </GlassSurface>
    </section>
  )
}
