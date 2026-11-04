import type { ImageRef, Localized } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'
import { AboutPortrait } from './AboutPortrait'

export type AboutDescriptionProps = { lang: Locale; title: string; description: Localized; image: ImageRef }

export function AboutDescription({ lang, title, description, image }: AboutDescriptionProps) {
  return (
    <section className={styles.hero} aria-labelledby="about-title">
      <AboutPortrait image={image} alt={image.alt[lang]} />
      <div className={styles.heroCopy}>
        <SectionTitle as="h1" id="about-title" size="lg">
          {title}
        </SectionTitle>
        <GlassSurface variant="standard" className={styles.heroText}>
          <p>{description[lang]}</p>
        </GlassSurface>
      </div>
    </section>
  )
}
