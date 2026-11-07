import type { ReactNode } from 'react'
import type { ImageRef, Localized } from '@/content/types'
import { CvLink } from '@/components/ui/CvLink'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'
import { AboutPortrait } from './AboutPortrait'

export type AboutDescriptionProps = {
  id?: string
  lang: Locale
  title: string
  description: Localized
  image: ImageRef
  children?: ReactNode
}

export function AboutDescription({ id, lang, title, description, image, children }: AboutDescriptionProps) {
  return (
    <section id={id} className={styles.hero} aria-labelledby="about-title" data-cw-scene="who">
      <AboutPortrait image={image} alt={image.alt[lang]} />
      <div className={styles.heroCopy}>
        <SectionTitle as="h1" id="about-title" size="lg">
          {title}
        </SectionTitle>
        <GlassSurface variant="standard" edge light className={styles.heroText}>
          <p>{description[lang]}</p>
          <CvLink lang={lang} className={styles.heroCv} />
        </GlassSurface>
        {children}
      </div>
    </section>
  )
}
