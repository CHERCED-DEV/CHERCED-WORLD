import Image from 'next/image'
import type { ImageRef } from '@/content/types'
import { cx } from '@/components/ui/cx'
import styles from './About.module.scss'
import { avifSrcSet, LIGHT_SCHEME_QUERY, PORTRAIT_SIZES, themedPortrait } from './portrait'

export type AboutPortraitProps = { image: ImageRef; alt: string }

type Variant = { image: ImageRef; alt: string; theme: 'auto' | 'dark' | 'light'; className: string; eager?: boolean }

function Portrait({ image, alt, theme, className, eager = false }: Variant) {
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={avifSrcSet(image.src)} sizes={PORTRAIT_SIZES} />
      <img
        src={image.src}
        alt={alt}
        width={image.width}
        height={image.height}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        className={styles.portrait}
        data-cw-portrait-theme={theme}
      />
    </picture>
  )
}

export function AboutPortrait({ image, alt }: AboutPortraitProps) {
  const { dark, light } = themedPortrait(image)

  if (!light) {
    return (
      <figure className={styles.vitrine} data-cw-portrait="single">
        <Image src={dark.src} alt={alt} width={dark.width} height={dark.height} sizes={PORTRAIT_SIZES} preload className={styles.portrait} />
      </figure>
    )
  }

  return (
    <figure className={styles.vitrine} data-cw-portrait="themed">
      <picture className={cx(styles.picture, styles.portraitAuto)}>
        <source media={LIGHT_SCHEME_QUERY} type="image/avif" srcSet={avifSrcSet(light.src)} sizes={PORTRAIT_SIZES} />
        <source media={LIGHT_SCHEME_QUERY} srcSet={light.src} />
        <source type="image/avif" srcSet={avifSrcSet(dark.src)} sizes={PORTRAIT_SIZES} />
        <img
          src={dark.src}
          alt={alt}
          width={dark.width}
          height={dark.height}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={styles.portrait}
          data-cw-portrait-theme="auto"
        />
      </picture>
      <Portrait image={dark} alt={alt} theme="dark" className={cx(styles.picture, styles.portraitForcedDark)} />
      <Portrait image={light} alt={alt} theme="light" className={cx(styles.picture, styles.portraitForcedLight)} />
    </figure>
  )
}
