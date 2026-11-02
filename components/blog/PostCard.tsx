import Image from 'next/image'
import Link from 'next/link'
import type { PostMeta } from '@/content/types'
import { formatPostDate } from '@/lib/blog/format'
import type { Locale } from '@/lib/i18n'
import styles from './PostCard.module.scss'

export type PostCardLabels = { readMore: string; originalLanguage: string; tags: string }

export function PostCard({
  post,
  href,
  lang,
  labels,
}: {
  post: PostMeta & { fallback: boolean }
  href: string
  lang: Locale
  labels: PostCardLabels
}) {
  const contentLang = post.fallback ? post.lang : undefined
  const titleId = `cw-post-card-${post.id}`

  return (
    <article className={styles.card} aria-labelledby={titleId} data-cw-post-card={post.id}>
      <h2 id={titleId} className={styles.title} lang={contentLang}>
        <Link href={href} className={styles.link}>
          {post.title}
        </Link>
      </h2>
      <Image
        src={post.image.src}
        alt={post.image.alt}
        width={post.image.width}
        height={post.image.height}
        sizes="256px"
        className={styles.image}
        lang={contentLang}
      />
      <p className={styles.description} lang={contentLang}>
        {post.description}
      </p>
      <p className={styles.meta}>
        <time dateTime={post.date}>{formatPostDate(post.date, lang)}</time>
      </p>
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
      <span className={styles.more} aria-hidden="true">
        {labels.readMore}
      </span>
    </article>
  )
}
