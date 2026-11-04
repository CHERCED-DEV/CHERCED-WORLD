import Image from 'next/image'
import type { LanguageSkill } from '@/content/types'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'
import { LevelBar } from './LevelBar'

export type AboutLanguagesProps = {
  lang: Locale
  title: string
  languages: LanguageSkill[]
  levelLabel: (value: number) => string
}

export function AboutLanguages({ lang, title, languages, levelLabel }: AboutLanguagesProps) {
  return (
    <section className={styles.section} aria-labelledby="about-languages" data-cw-about="languages">
      <SectionTitle id="about-languages">{title}</SectionTitle>
      <ul className={styles.languages}>
        {languages.map((language) => (
          <li key={language.id} className={styles.tech} data-cw-glass="subtle" data-cw-light="">
            <p className={styles.techName}>{language.name[lang]}</p>
            {language.icon ? (
              <Image src={language.icon} alt="" width={56} height={56} sizes="56px" className={styles.techIcon} />
            ) : null}
            <LevelBar value={language.progress} label={levelLabel(language.progress)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
