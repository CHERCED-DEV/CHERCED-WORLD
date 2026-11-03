import Image from 'next/image'
import type { ImageRef, Localized } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { cx } from '@/components/ui/cx'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'
import { PORTRAIT_SIZES, themedPortrait } from './portrait'

export type AboutDescriptionProps = { lang: Locale; title: string; description: Localized; image: ImageRef }

export function AboutDescription({ lang, title, description, image }: AboutDescriptionProps) {
  const { dark, light } = themedPortrait(image)
  const alt = image.alt[lang]

  return (
    <section className={styles.hero} aria-labelledby="about-title">
      <figure className={styles.vitrine} data-cw-portrait={light ? 'themed' : 'single'}>
        <Image
          src={dark.src}
          alt={alt}
          width={dark.width}
          height={dark.height}
          sizes={PORTRAIT_SIZES}
          fetchPriority="high"
          preload={!light}
          className={cx(styles.portrait, light && styles.portraitDark)}
          data-cw-portrait-theme="dark"
        />
        {light ? (
          <Image
            src={light.src}
            alt={alt}
            width={light.width}
            height={light.height}
            sizes={PORTRAIT_SIZES}
            fetchPriority="high"
            className={cx(styles.portrait, styles.portraitLight)}
            data-cw-portrait-theme="light"
          />
        ) : null}
      </figure>
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
