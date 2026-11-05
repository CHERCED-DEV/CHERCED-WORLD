import type { Locale } from '@/content/types'
import { formatPostDate } from '@/lib/blog/format'
import { cx } from '@/components/ui/cx'
import styles from './GeneratedCover.module.scss'

export type GeneratedCoverVariant = 'card' | 'cover'

export type GeneratedCoverProps = {
  title: string
  date: string
  tags: readonly string[]
  lang: Locale
  variant: GeneratedCoverVariant
  contentLang?: Locale
  className?: string
}

export const GENERATED_COVER_BRAND = 'CHERCED-WORLD'

export const GENERATED_COVER_MAX_TAGS = 3

export function coverTags(tags: readonly string[], max = GENERATED_COVER_MAX_TAGS): string[] {
  return [...new Set(tags)].slice(0, max)
}

export function GeneratedCover({ title, date, tags, lang, variant, contentLang, className }: GeneratedCoverProps) {
  const shown = coverTags(tags)
  return (
    <div className={cx(styles.root, styles[variant], className)} aria-hidden="true" data-cw-generated-cover={variant}>
      <span className={styles.grid} />
      <span className={styles.glow} />
      <span className={styles.inner}>
        <span className={styles.brand}>
          <span className={styles.bar} />
          {GENERATED_COVER_BRAND}
        </span>
        <span className={styles.glass}>
          <span className={styles.title} lang={contentLang}>
            {title}
          </span>
        </span>
        <span className={styles.foot}>
          <span className={styles.date}>{formatPostDate(date, lang)}</span>
          {shown.length > 0 ? (
            <span className={styles.tags} lang={contentLang}>
              {shown.map((tag) => (
                <span key={tag} className={styles.tag}>
                  #{tag}
                </span>
              ))}
            </span>
          ) : null}
        </span>
      </span>
    </div>
  )
}
