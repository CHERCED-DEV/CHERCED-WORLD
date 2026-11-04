import { postPath } from '@/lib/blog/paths'
import type { Locale } from '@/lib/i18n'
import { cx } from '@/components/ui/cx'
import { Reveal } from '@/components/ui/Reveal'
import { BlogIntro } from './BlogIntro'
import styles from './BlogIndex.module.scss'
import { PostCard, type PostCardLabels, type PostCardPost } from './PostCard'

export type BlogIndexProps = {
  lang: Locale
  posts: PostCardPost[]
  intro: { title: string; titleStrong: string; welcome: string }
  labels: PostCardLabels
}

const REVEAL_STAGGER_MS = 70

export function BlogIndex({ lang, posts, intro, labels }: BlogIndexProps) {
  return (
    <div className={cx('cw-container', styles.page)} data-cw-blog-index="">
      <BlogIntro title={intro.title} titleStrong={intro.titleStrong} welcome={intro.welcome} />
      <ul className={styles.list}>
        {posts.map((post, index) => (
          <Reveal as="li" key={post.id} className={styles.item} delay={(index % 2) * REVEAL_STAGGER_MS}>
            <PostCard post={post} href={postPath(lang, post.id)} lang={lang} labels={labels} />
          </Reveal>
        ))}
      </ul>
    </div>
  )
}
