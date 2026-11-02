import Image from 'next/image'
import type { ImageRef, Localized } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'

export type AboutDescriptionProps = { lang: Locale; title: string; description: Localized; image: ImageRef }

export function AboutDescription({ lang, title, description, image }: AboutDescriptionProps) {
  return (
    <section className={styles.hero} aria-labelledby="about-title">
      <div className={styles.parallax}>
        <Image
          src={image.src}
          alt={image.alt[lang]}
          width={image.width}
          height={image.height}
          sizes="(min-width: 768px) 300px, 240px"
          preload
          className={styles.portrait}
        />
      </div>
      <SectionTitle as="h1" id="about-title" size="lg">
        {title}
      </SectionTitle>
      <GlassSurface variant="standard" className={styles.heroText}>
        <p>{description[lang]}</p>
      </GlassSurface>
    </section>
  )
}
