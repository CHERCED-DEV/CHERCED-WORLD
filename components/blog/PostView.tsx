import Link from 'next/link'
import type { PostMeta } from '@/content/types'
import { formatPostDate } from '@/lib/blog/format'
import type { Adjacent } from '@/lib/blog/order'
import { shouldShowToc } from '@/lib/blog/outline'
import { shareTargets } from '@/lib/blog/share'
import { tagPath } from '@/lib/blog/tags'
import type { ListedPost } from '@/lib/content'
import { t, type Dictionary, type Locale } from '@/lib/i18n'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { Hairline } from '@/components/ui/graphics'
import { Icon } from '@/components/ui/Icon'
import { sharedText } from '@/components/ui/sharedText'
import { CopyButton } from './CopyButton'
import { shareCopyLabels } from './labels'
import type { PreparedPost } from './mdx/prepare'
import { AuthorBox } from './post/AuthorBox'
import { usesGeneratedCover, type GeneratedCoverComponent } from './post/cover'
import { RelatedPosts, type RelatedPost } from './post/RelatedPosts'
import type { SeriesNavData } from './post/series'
import { SeriesNav } from './post/SeriesNav'
import { withNode } from './post/template'
import { TocSheet } from './post/TocSheet'
import { translatedFrom, TranslatedNote } from './post/TranslatedNote'
import { PostMedia } from './PostMedia'
import { PostNav } from './PostNav'
import styles from './PostView.module.scss'
import { ReadingProgress } from './ReadingProgress'
import { Toc } from './Toc'

export const POST_BODY_ID = 'cw-post-body'

export type PostViewProps = {
  lang: Locale
  meta: PostMeta
  fallback: boolean
  prepared: PreparedPost
  url: string
  blog: Dictionary
  neighbors?: Adjacent<ListedPost>
  related?: readonly RelatedPost[]
  series?: SeriesNavData | null
  linkTags?: boolean
  generatedCover?: GeneratedCoverComponent
}

export function LanguageNotice({ blog, contentLang }: { blog: Dictionary; contentLang: Locale }) {
  return (
    <div role="note" className={styles.notice} data-cw-lang-notice={contentLang}>
      <Icon name="globe" size={22} />
      <p>
        <strong>{t(blog, 'post.originalLanguage')}.</strong> {t(blog, 'post.fallbackNotice')}
      </p>
    </div>
  )
}

export function Share({ url, title, blog }: { url: string; title: string; blog: Dictionary }) {
  return (
    <section className={styles.share} aria-labelledby="cw-share-title" data-cw-share="">
      <h2 id="cw-share-title" className={styles.shareTitle}>
        {t(blog, 'share.title')}
      </h2>
      <ul className={styles.shareList}>
        <li className="cw-js-only">
          <CopyButton text={url} labels={shareCopyLabels(blog)} />
        </li>
        {shareTargets({ url, title }).map((target) => (
          <li key={target.id}>
            <a
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClassName({ variant: 'glass', size: 'sm' })}
              aria-label={t(blog, 'share.on', { network: target.name })}
              data-cw-share-target={target.id}
            >
              {target.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function UpdatedDate({ updated, lang, blog }: { updated: string; lang: Locale; blog: Dictionary }) {
  return (
    <span data-cw-updated={updated}>
      {withNode(t(blog, 'post.updated'), 'date', <time dateTime={updated}>{formatPostDate(updated, lang)}</time>)}
    </span>
  )
}

export function PostView({ lang, meta, fallback, prepared, url, blog, neighbors, related = [], series, linkTags = false, generatedCover }: PostViewProps) {
  const contentLang = fallback ? meta.lang : undefined
  const withToc = shouldShowToc(prepared.headings)
  const original = translatedFrom(meta, fallback)
  const GeneratedCover = usesGeneratedCover(meta, generatedCover) ? generatedCover : null

  return (
    <article className={cx('cw-container', styles.post)} aria-labelledby="cw-post-title" data-cw-post={meta.id}>
      <ReadingProgress target="[data-cw-post-body]" />
      <header className={styles.header}>
        <p className={styles.kicker}>
          <time dateTime={meta.date}>{formatPostDate(meta.date, lang)}</time>
          {meta.updated ? (
            <>
              <span aria-hidden="true" className={styles.dot} />
              <UpdatedDate updated={meta.updated} lang={lang} blog={blog} />
            </>
          ) : null}
          <span aria-hidden="true" className={styles.dot} />
          <span data-cw-reading-time={prepared.minutes}>{t(blog, 'post.readingTime', { n: prepared.minutes })}</span>
        </p>
        <h1 id="cw-post-title" className={styles.title} lang={contentLang}>
          {meta.title}
        </h1>
        <p className={styles.description} lang={contentLang}>
          {meta.description}
        </p>
        <div className={styles.byline}>
          <p className={styles.author}>{t(blog, 'post.by', { author: meta.author })}</p>
          {meta.tags.length > 0 ? (
            <ul className={styles.tags} aria-label={t(blog, 'post.tags')}>
              {meta.tags.map((tag) => (
                <li key={tag}>
                  {linkTags ? (
                    <Link href={tagPath(lang, tag)} className={styles.tagLink} data-cw-post-tag={tag}>
                      {tag}
                    </Link>
                  ) : (
                    tag
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          {original ? <TranslatedNote originalLang={original} lang={lang} blog={blog} /> : null}
        </div>
        <figure className={styles.cover} data-cw-post-cover="">
          {GeneratedCover ? (
            <GeneratedCover title={meta.title} date={meta.date} tags={meta.tags} lang={meta.lang} variant="cover" />
          ) : (
            <PostMedia image={meta.image} variant="cover" priority lang={contentLang} />
          )}
        </figure>
      </header>

      {fallback ? <LanguageNotice blog={blog} contentLang={meta.lang} /> : null}
      {series ? <SeriesNav series={series} lang={lang} blog={blog} /> : null}

      <div className={cx(styles.layout, withToc && styles.withToc)} data-cw-post-layout={withToc ? 'toc' : 'single'}>
        {withToc ? <Toc headings={prepared.headings} title={t(blog, 'toc.title')} contentLang={contentLang} className={styles.toc} /> : null}
        {withToc ? (
          <TocSheet
            headings={prepared.headings}
            labels={{ title: t(blog, 'toc.title'), close: sharedText(lang, 'common', 'dialog.close') }}
            contentLang={contentLang}
          />
        ) : null}
        <div id={POST_BODY_ID} className={styles.body} lang={contentLang} data-cw-post-body="">
          {prepared.body}
        </div>
      </div>

      <Hairline glint className={styles.rule} />
      <AuthorBox lang={lang} blog={blog} />
      <Share url={url} title={meta.title} blog={blog} />
      <RelatedPosts posts={related} lang={lang} blog={blog} />
      {neighbors ? <PostNav neighbors={neighbors} lang={lang} blog={blog} /> : null}
    </article>
  )
}
