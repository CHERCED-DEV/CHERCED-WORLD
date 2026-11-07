import Link from 'next/link'
import { formatPostDate } from '@/lib/blog/format'
import { postPath } from '@/lib/blog/paths'
import { t, type Dictionary, type Locale } from '@/lib/i18n'
import styles from './RelatedPosts.module.scss'

export const RELATED_TITLE_ID = 'cw-related-title'

export type RelatedPost = { id: string; lang: Locale; title: string; description: string; date: string }

export type RelatedCaseCard = { id: string; title: string; summary: string; href: string }

export function RelatedPosts({
  posts,
  cases = [],
  lang,
  blog,
}: {
  posts: readonly RelatedPost[]
  cases?: readonly RelatedCaseCard[]
  lang: Locale
  blog: Dictionary
}) {
  if (posts.length === 0 && cases.length === 0) return null

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
        {cases.map((item) => (
          <li key={`case-${item.id}`}>
            <Link href={item.href} className={styles.card} data-cw-related-case={item.id} data-cw-glass="subtle" data-cw-light="">
              <span className={styles.date}>{t(blog, 'related.case')}</span>
              <span className={styles.postTitle}>{item.title}</span>
              <span className={styles.description}>{item.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
