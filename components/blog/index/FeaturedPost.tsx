import { postPath } from '@/lib/blog/paths'
import type { Locale } from '@/lib/i18n'
import { PostCard, type PostCardLabels, type PostCardPost } from '../PostCard'
import { FilterItem } from './BlogFilter'
import styles from './FeaturedPost.module.scss'

export function FeaturedPost({
  lang,
  post,
  badge,
  labels,
}: {
  lang: Locale
  post: PostCardPost
  badge: string
  labels: PostCardLabels
}) {
  return (
    <ul className={styles.featured} data-cw-featured="">
      <FilterItem id={post.id} className={styles.item}>
        <PostCard post={post} href={postPath(lang, post.id)} lang={lang} labels={labels} variant="featured" badge={badge} />
      </FilterItem>
    </ul>
  )
}
