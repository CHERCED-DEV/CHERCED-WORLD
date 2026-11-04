import Image, { getImageProps } from 'next/image'
import type { ImageRef } from '@/content/types'
import { cx } from '@/components/ui/cx'
import styles from './About.module.scss'
import { LIGHT_SCHEME_QUERY, PORTRAIT_SIZES, themedPortrait } from './portrait'

export type AboutPortraitProps = { image: ImageRef; alt: string }

export function AboutPortrait({ image, alt }: AboutPortraitProps) {
  const { dark, light } = themedPortrait(image)
  const common = { width: dark.width, height: dark.height, sizes: PORTRAIT_SIZES }

  if (!light) {
    return (
      <figure className={styles.vitrine} data-cw-portrait="single">
        <Image {...common} alt={alt} src={dark.src} preload fetchPriority="high" className={styles.portrait} />
      </figure>
    )
  }

  const { props: auto } = getImageProps({ ...common, alt, src: dark.src, loading: 'eager', fetchPriority: 'high' })
  const { props: lightProps } = getImageProps({ ...common, alt, src: light.src })

  return (
    <figure className={styles.vitrine} data-cw-portrait="themed">
      <picture className={styles.portraitAuto}>
        <source media={LIGHT_SCHEME_QUERY} srcSet={lightProps.srcSet} sizes={lightProps.sizes} />
        <img {...auto} alt={alt} className={styles.portrait} data-cw-portrait-theme="auto" />
      </picture>
      <Image
        {...common}
        alt={alt}
        src={dark.src}
        className={cx(styles.portrait, styles.portraitForcedDark)}
        data-cw-portrait-theme="dark"
      />
      <Image
        {...common}
        alt={alt}
        src={light.src}
        className={cx(styles.portrait, styles.portraitForcedLight)}
        data-cw-portrait-theme="light"
      />
    </figure>
  )
}
