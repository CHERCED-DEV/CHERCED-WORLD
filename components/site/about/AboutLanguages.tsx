import Image from 'next/image'
import type { LanguageSkill } from '@/content/types'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'
import { LevelBar } from './LevelBar'

const FLAGS: Record<Locale, string> = {
  es: '/assets/icons/flags/spain.png',
  en: '/assets/icons/flags/uniteStates.png',
}

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
          <li key={language.id} className={styles.tech} data-cw-glass="subtle">
            <p className={styles.techName}>{language.name[lang]}</p>
            <Image src={FLAGS[language.id]} alt="" width={56} height={56} sizes="56px" className={styles.techIcon} />
            <LevelBar value={language.progress} label={levelLabel(language.progress)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
