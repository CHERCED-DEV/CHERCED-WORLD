import Image from 'next/image'
import type { PostMeta } from '@/content/types'
import { formatPostDate } from '@/lib/blog/format'
import { shouldShowToc } from '@/lib/blog/outline'
import { shareTargets } from '@/lib/blog/share'
import { t, type Dictionary, type Locale } from '@/lib/i18n'
import { cx } from '@/components/ui/cx'
import { Icon } from '@/components/ui/Icon'
import { buttonClassName } from '@/components/ui/Button'
import { CopyButton } from './CopyButton'
import { shareCopyLabels } from './labels'
import type { PreparedPost } from './mdx/prepare'
import styles from './PostView.module.scss'

export type PostViewProps = {
  lang: Locale
  meta: PostMeta
  fallback: boolean
  prepared: PreparedPost
  url: string
  blog: Dictionary
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

export function Toc({ prepared, blog, contentLang }: { prepared: PreparedPost; blog: Dictionary; contentLang?: Locale }) {
  return (
    <nav className={styles.toc} aria-labelledby="cw-toc-title" data-cw-toc="">
      <h2 id="cw-toc-title" className={styles.tocTitle}>
        {t(blog, 'toc.title')}
      </h2>
      <ol className={styles.tocList} lang={contentLang}>
        {prepared.headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? styles.tocSub : undefined}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </nav>
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

export function PostView({ lang, meta, fallback, prepared, url, blog }: PostViewProps) {
  const contentLang = fallback ? meta.lang : undefined

  return (
    <article className={cx('cw-container', styles.post)} aria-labelledby="cw-post-title" data-cw-post={meta.id}>
      <header className={styles.header}>
        <h1 id="cw-post-title" className={styles.title} lang={contentLang}>
          {meta.title}
        </h1>
        <Image
          src={meta.image.src}
          alt={meta.image.alt}
          width={meta.image.width}
          height={meta.image.height}
          sizes="256px"
          loading="eager"
          fetchPriority="high"
          className={styles.image}
          lang={contentLang}
        />
        <div className={styles.byline}>
          <p className={styles.author}>{t(blog, 'post.by', { author: meta.author })}</p>
          <p className={styles.meta}>
            <time dateTime={meta.date}>{formatPostDate(meta.date, lang)}</time>
            <span aria-hidden="true"> · </span>
            <span data-cw-reading-time={prepared.minutes}>{t(blog, 'post.readingTime', { n: prepared.minutes })}</span>
          </p>
          {meta.tags.length > 0 ? (
            <ul className={styles.tags} aria-label={t(blog, 'post.tags')} lang={contentLang}>
              {meta.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <p className={styles.description} lang={contentLang}>
          {meta.description}
        </p>
      </header>

      {fallback ? <LanguageNotice blog={blog} contentLang={meta.lang} /> : null}
      {shouldShowToc(prepared.headings) ? <Toc prepared={prepared} blog={blog} contentLang={contentLang} /> : null}

      <div className={styles.body} lang={contentLang} data-cw-post-body="">
        {prepared.body}
      </div>

      <Share url={url} title={meta.title} blog={blog} />
    </article>
  )
}
