import type { PostMeta } from '@/content/types'
import { postPath } from '@/lib/blog/paths'
import type { Locale } from '@/lib/i18n'
import { cx } from '@/components/ui/cx'
import { BlogIntro } from './BlogIntro'
import styles from './BlogIndex.module.scss'
import { PostCard, type PostCardLabels } from './PostCard'

export type BlogIndexProps = {
  lang: Locale
  posts: Array<PostMeta & { fallback: boolean }>
  intro: { title: string; titleStrong: string; welcome: string }
  labels: PostCardLabels
}

export function BlogIndex({ lang, posts, intro, labels }: BlogIndexProps) {
  return (
    <div className={cx('cw-container', styles.page)} data-cw-blog-index="">
      <BlogIntro title={intro.title} titleStrong={intro.titleStrong} welcome={intro.welcome} />
      <ul className={styles.list}>
        {posts.map((post) => (
          <li key={post.id} className={styles.item}>
            <PostCard post={post} href={postPath(lang, post.id)} lang={lang} labels={labels} />
          </li>
        ))}
      </ul>
    </div>
  )
}
