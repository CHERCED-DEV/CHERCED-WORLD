import type { YearLabel } from '@/lib/blog/groups'
import { postPath } from '@/lib/blog/paths'
import type { Locale } from '@/lib/i18n'
import { cx } from '@/components/ui/cx'
import { Hairline } from '@/components/ui/graphics'
import { PostCard, type PostCardLabels, type PostCardPost } from '../PostCard'
import { FilterGroup, FilterItem } from './BlogFilter'
import styles from './YearGroup.module.scss'

const REVEAL_STAGGER_MS = 70

export function yearGroupId(year: number): string {
  return `cw-blog-year-${year}`
}

export function YearGroup({
  lang,
  year,
  label,
  title,
  posts,
  labels,
}: {
  lang: Locale
  year: number
  label: YearLabel
  title: string
  posts: readonly PostCardPost[]
  labels: PostCardLabels
}) {
  const headingId = yearGroupId(year)
  return (
    <FilterGroup ids={posts.map((post) => post.id)} group={label} labelledBy={headingId} className={cx(styles.group, styles[label])}>
      <h2 id={headingId} className={styles.heading}>
        {label === 'now' ? <span aria-hidden="true" className={styles.live} /> : null}
        <span className={styles.label}>{title}</span>
        <Hairline glint={label === 'now'} className={styles.line} />
        <span className={styles.year}>{year}</span>
      </h2>
      <ul className={styles.list}>
        {posts.map((post, index) => (
          <FilterItem key={post.id} id={post.id} className={styles.item} delay={(index % 2) * REVEAL_STAGGER_MS}>
            <PostCard post={post} href={postPath(lang, post.id)} lang={lang} labels={labels} />
          </FilterItem>
        ))}
      </ul>
    </FilterGroup>
  )
}
