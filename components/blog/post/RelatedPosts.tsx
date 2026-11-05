import Link from 'next/link'
import { formatPostDate } from '@/lib/blog/format'
import { postPath } from '@/lib/blog/paths'
import { t, type Dictionary, type Locale } from '@/lib/i18n'
import styles from './RelatedPosts.module.scss'

export const RELATED_TITLE_ID = 'cw-related-title'

export type RelatedPost = { id: string; lang: Locale; title: string; description: string; date: string }

export function RelatedPosts({ posts, lang, blog }: { posts: readonly RelatedPost[]; lang: Locale; blog: Dictionary }) {
  if (posts.length === 0) return null

  return (
    <section className={styles.related} aria-labelledby={RELATED_TITLE_ID} data-cw-related="">
      <h2 id={RELATED_TITLE_ID} className={styles.title}>
        {t(blog, 'related.title')}
      </h2>
      <ul className={styles.list}>
        {posts.map((post) => {
          const contentLang = post.lang !== lang ? post.lang : undefined
          return (
            <li key={post.id}>
              <Link href={postPath(lang, post.id)} className={styles.card} data-cw-related-link={post.id} data-cw-glass="subtle" data-cw-light="">
                <time dateTime={post.date} className={styles.date}>
                  {formatPostDate(post.date, lang)}
                </time>
                <span className={styles.postTitle} lang={contentLang}>
                  {post.title}
                </span>
                <span className={styles.description} lang={contentLang}>
                  {post.description}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
