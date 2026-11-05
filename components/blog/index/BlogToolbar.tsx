import { GlassSurface } from '@/components/ui/GlassSurface'
import { Icon } from '@/components/ui/Icon'
import { BlogSearch } from './BlogSearch'
import { ALL_TAGS } from './model'
import { FilterLink, TagFilter } from './TagFilter'
import type { BlogIndexView } from './view'
import styles from './BlogToolbar.module.scss'

export const BLOG_RESULTS_ID = 'cw-blog-results'

const FILTER_LABEL_ID = 'cw-blog-filter-label'

function RssIcon() {
  return (
    <svg className={styles.rssIcon} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M5 4.5a14.5 14.5 0 0 1 14.5 14.5M5 10.5a8.5 8.5 0 0 1 8.5 8.5" />
      <circle cx="6" cy="18" r="1.6" />
    </svg>
  )
}

export function BlogToolbar({ toolbar, search, tag }: Pick<BlogIndexView, 'toolbar' | 'search' | 'tag'>) {
  return (
    <GlassSurface variant="subtle" edge grain className={styles.toolbar} data-cw-blog-toolbar="">
      {search ? <BlogSearch docs={search.docs} labels={search.labels} controls={BLOG_RESULTS_ID} /> : null}
      {tag ? (
        <div className={styles.summary} data-cw-tag-summary={tag.slug}>
          <h2 className={styles.summaryText} aria-live="polite" data-cw-tag-results={tag.count}>
            {tag.summary}
          </h2>
          <FilterLink filterKey={ALL_TAGS} href={tag.clear.href} className={styles.summaryClear}>
            <Icon name="close" size={14} />
            {tag.clear.label}
          </FilterLink>
        </div>
      ) : null}
      <div className={styles.row}>
        <p id={FILTER_LABEL_ID} className={styles.label}>
          {toolbar.filterLabel}
        </p>
        <a href={toolbar.rss.href} type="application/rss+xml" className={styles.rss} data-cw-blog-rss="">
          <RssIcon />
          {toolbar.rss.label}
        </a>
      </div>
      <TagFilter items={toolbar.tags} active={toolbar.active} labelledBy={FILTER_LABEL_ID} />
    </GlassSurface>
  )
}
