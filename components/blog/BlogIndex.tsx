import Link from 'next/link'
import { cx } from '@/components/ui/cx'
import { BlogIntro } from './BlogIntro'
import { BlogFilterProvider } from './index/BlogFilter'
import { SearchEmpty } from './index/BlogSearch'
import { BLOG_RESULTS_ID, BlogToolbar } from './index/BlogToolbar'
import { FeaturedPost } from './index/FeaturedPost'
import type { BlogIndexView } from './index/view'
import { YearGroup } from './index/YearGroup'
import styles from './BlogIndex.module.scss'

export function BlogIndex({ lang, intro, cardLabels, featured, groups, toolbar, search, tag }: BlogIndexView) {
  return (
    <div className={cx('cw-container', styles.page)} data-cw-blog-index="" data-cw-blog-tag={tag?.slug}>
      <BlogIntro title={intro.title} titleStrong={intro.titleStrong} welcome={intro.welcome} />
      <BlogFilterProvider>
        <BlogToolbar toolbar={toolbar} search={search} tag={tag} />
        <div id={BLOG_RESULTS_ID} className={styles.results}>
          {featured ? <FeaturedPost lang={lang} post={featured.post} badge={featured.badge} labels={cardLabels} /> : null}
          {groups.map((group) => (
            <YearGroup key={group.year} lang={lang} year={group.year} label={group.label} title={group.title} posts={group.posts} labels={cardLabels} />
          ))}
          {search ? <SearchEmpty labels={search.labels} /> : null}
          {tag && tag.count === 0 ? (
            <div className={styles.empty} data-cw-tag-empty="">
              <Link href={tag.index.href} className={styles.emptyLink}>
                {tag.index.label}
              </Link>
            </div>
          ) : null}
        </div>
      </BlogFilterProvider>
    </div>
  )
}
