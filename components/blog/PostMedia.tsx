import Image from 'next/image'
import type { Locale, PostMeta } from '@/content/types'
import { cx } from '@/components/ui/cx'
import { GeneratedCover } from './index/GeneratedCover'
import styles from './PostMedia.module.scss'

export type PostMediaVariant = 'card' | 'featured' | 'cover'

export type GeneratedCoverSource = Pick<PostMeta, 'title' | 'date' | 'tags'> & { lang: Locale; contentLang?: Locale }

export type PostImage = PostMeta['image']

const WIDE_MIN_WIDTH = 960
const WIDE_MIN_RATIO = 1.3
const COMPACT_SIZES = '256px'

const WIDE_SIZES: Record<PostMediaVariant, string> = {
  card: '(min-width: 992px) 480px, (min-width: 560px) 520px, calc(100vw - 60px)',
  featured: '(min-width: 992px) 600px, (min-width: 768px) 700px, calc(100vw - 60px)',
  cover: '(min-width: 1024px) 960px, calc(100vw - 28px)',
}

export function isWideImage(image: Pick<PostImage, 'width' | 'height'>): boolean {
  return image.width >= WIDE_MIN_WIDTH && image.width / image.height >= WIDE_MIN_RATIO
}

export function PostMedia({
  image,
  variant,
  priority = false,
  lang,
  className,
  generated,
}: {
  image: PostImage
  variant: PostMediaVariant
  priority?: boolean
  lang?: Locale
  className?: string
  generated?: GeneratedCoverSource
}) {
  if (generated) {
    return (
      <div className={cx(styles.media, styles[variant], styles.generated, className)} data-cw-post-media="generated">
        <GeneratedCover
          title={generated.title}
          date={generated.date}
          tags={generated.tags}
          lang={generated.lang}
          contentLang={generated.contentLang}
          variant={variant === 'cover' ? 'cover' : 'card'}
          className={styles.fill}
        />
      </div>
    )
  }

  const wide = isWideImage(image)
  const loading = priority ? ({ loading: 'eager', fetchPriority: 'high' } as const) : ({ loading: 'lazy' } as const)
  const sizes = wide ? WIDE_SIZES[variant] : COMPACT_SIZES

  return (
    <div className={cx(styles.media, styles[variant], wide ? styles.wide : styles.compact, className)} data-cw-post-media={wide ? 'wide' : 'compact'}>
      {wide ? null : (
        <Image src={image.src} alt="" aria-hidden="true" width={image.width} height={image.height} sizes={sizes} className={styles.ambient} {...loading} />
      )}
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        className={styles.image}
        lang={lang}
        {...loading}
      />
    </div>
  )
}
