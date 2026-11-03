import Link from 'next/link'
import type { Adjacent } from '@/lib/blog/order'
import { blogPath, postPath } from '@/lib/blog/paths'
import type { ListedPost } from '@/lib/content'
import { t, type Dictionary, type Locale } from '@/lib/i18n'
import { cx } from '@/components/ui/cx'
import { Icon } from '@/components/ui/Icon'
import styles from './PostNav.module.scss'

export const POST_NAV_TITLE_ID = 'cw-post-nav-title'

type Direction = 'previous' | 'next'

function NavLink({ post, direction, lang, label }: { post: ListedPost; direction: Direction; lang: Locale; label: string }) {
  return (
    <Link
      href={postPath(lang, post.id)}
      rel={direction === 'previous' ? 'prev' : 'next'}
      className={cx(styles.link, styles[direction])}
      data-cw-post-nav-link={direction}
    >
      <span className={styles.label}>
        <Icon name="back" size={16} className={styles.arrow} />
        <span>{label}</span>
      </span>
      <span className={styles.postTitle} lang={post.fallback ? post.lang : undefined}>
        {post.title}
      </span>
    </Link>
  )
}

export function PostNav({ neighbors, lang, blog }: { neighbors: Adjacent<ListedPost>; lang: Locale; blog: Dictionary }) {
  const { previous, next } = neighbors
  if (!previous && !next) return null

  return (
    <nav className={styles.nav} aria-labelledby={POST_NAV_TITLE_ID} data-cw-post-nav="">
      <h2 id={POST_NAV_TITLE_ID} className={styles.title}>
        {t(blog, 'nav.title')}
      </h2>
      <ul className={styles.list}>
        <li className={styles.slot}>
          {previous ? <NavLink post={previous} direction="previous" lang={lang} label={t(blog, 'nav.previous')} /> : null}
        </li>
        <li className={styles.slot}>
          {next ? <NavLink post={next} direction="next" lang={lang} label={t(blog, 'nav.next')} /> : null}
        </li>
      </ul>
      <Link href={blogPath(lang)} className={styles.index} data-cw-post-nav-link="index">
        {t(blog, 'nav.index')}
      </Link>
    </nav>
  )
}
