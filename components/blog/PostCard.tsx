import Link from 'next/link'
import type { PostMeta } from '@/content/types'
import { formatPostDate } from '@/lib/blog/format'
import type { Locale } from '@/lib/i18n'
import { cx } from '@/components/ui/cx'
import { glassMotionAttributes } from '@/components/ui/GlassSurface'
import { Icon } from '@/components/ui/Icon'
import { Sweep } from '@/components/ui/Sweep'
import { typeset } from '@/components/site/typeset'
import { PostMedia, type GeneratedCoverSource } from './PostMedia'
import styles from './PostCard.module.scss'

export type PostCardLabels = { readMore: string; originalLanguage: string; tags: string }

export type PostCardPost = PostMeta & { fallback: boolean; readingTime?: string }

export type PostCardVariant = 'grid' | 'featured'

export function generatedCoverOf(post: PostCardPost, lang: Locale): GeneratedCoverSource | undefined {
  if (post.cover !== 'generated') return undefined
  return { title: post.title, date: post.date, tags: post.tags, lang, contentLang: post.fallback ? post.lang : undefined }
}

export function PostCard({
  post,
  href,
  lang,
  labels,
  variant = 'grid',
  badge,
  priority = false,
}: {
  post: PostCardPost
  href: string
  lang: Locale
  labels: PostCardLabels
  variant?: PostCardVariant
  badge?: string
  priority?: boolean
}) {
  const contentLang = post.fallback ? post.lang : undefined
  const titleId = `cw-post-card-${post.id}`
  const featured = variant === 'featured'

  return (
    <article
      className={cx(styles.card, featured && styles.featured)}
      aria-labelledby={titleId}
      data-cw-post-card={post.id}
      data-cw-post-variant={variant}
      data-cw-glass="standard"
      data-cw-light=""
      {...glassMotionAttributes({ float: 1 })}
    >
      {badge ? (
        <p className={styles.badge} data-cw-featured-badge="">
          <span aria-hidden="true" className={styles.badgeDot} />
          {badge}
        </p>
      ) : null}
      <h2 id={titleId} className={styles.title} lang={contentLang}>
        <Link href={href} className={styles.link} data-cw-post-link="">
          {typeset(post.title, contentLang ?? lang, { keepHyphens: true })}
        </Link>
      </h2>
      <PostMedia
        image={post.image}
        variant={featured ? 'featured' : 'card'}
        priority={priority}
        lang={contentLang}
        className={styles.media}
        generated={generatedCoverOf(post, lang)}
      />
      <p className={styles.description} lang={contentLang}>
        {post.description}
      </p>
      <div className={styles.meta}>
        <p className={styles.metaRow}>
          <time dateTime={post.date}>{formatPostDate(post.date, lang)}</time>
          {post.readingTime ? (
            <>
              <span aria-hidden="true" className={styles.dot} />
              <span data-cw-reading-time="">{post.readingTime}</span>
            </>
          ) : null}
        </p>
      </div>
      {post.tags.length > 0 ? (
        <ul className={styles.tags} aria-label={labels.tags}>
          {post.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      ) : null}
      {post.fallback ? (
        <p className={styles.notice} data-cw-lang-notice={post.lang}>
          {labels.originalLanguage}
        </p>
      ) : null}
      <span className={styles.more} aria-hidden="true" data-cw-read-more="">
        <span>{labels.readMore}</span>
        <Icon name="back" size={18} className={styles.arrow} />
      </span>
      {featured ? <Sweep /> : null}
    </article>
  )
}
