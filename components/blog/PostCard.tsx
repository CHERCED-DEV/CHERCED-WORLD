import Link from 'next/link'
import type { PostMeta } from '@/content/types'
import { formatPostDate } from '@/lib/blog/format'
import type { Locale } from '@/lib/i18n'
import { Icon } from '@/components/ui/Icon'
import { PostMedia } from './PostMedia'
import styles from './PostCard.module.scss'

export type PostCardLabels = { readMore: string; originalLanguage: string; tags: string }

export type PostCardPost = PostMeta & { fallback: boolean; readingTime?: string }

export function PostCard({
  post,
  href,
  lang,
  labels,
}: {
  post: PostCardPost
  href: string
  lang: Locale
  labels: PostCardLabels
}) {
  const contentLang = post.fallback ? post.lang : undefined
  const titleId = `cw-post-card-${post.id}`

  return (
    <article className={styles.card} aria-labelledby={titleId} data-cw-post-card={post.id}>
      <h2 id={titleId} className={styles.title} lang={contentLang}>
        <Link href={href} className={styles.link} data-cw-post-link="">
          {post.title}
        </Link>
      </h2>
      <PostMedia image={post.image} variant="card" lang={contentLang} />
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
        <ul className={styles.tags} aria-label={labels.tags} lang={contentLang}>
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
    </article>
  )
}
