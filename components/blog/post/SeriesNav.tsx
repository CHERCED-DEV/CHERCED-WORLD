import Link from 'next/link'
import { postPath } from '@/lib/blog/paths'
import { t, type Dictionary, type Locale } from '@/lib/i18n'
import type { SeriesNavData } from './series'
import styles from './SeriesNav.module.scss'

export const SERIES_TITLE_ID = 'cw-series-title'

export function SeriesNav({ series, lang, blog }: { series: SeriesNavData; lang: Locale; blog: Dictionary }) {
  const { name, position, parts, current } = series

  return (
    <nav className={styles.series} aria-labelledby={SERIES_TITLE_ID} data-cw-series={series.id}>
      <p id={SERIES_TITLE_ID} className={styles.title} data-cw-series-position={`${position.n}/${position.total}`}>
        {t(blog, 'series.position', { series: name, n: position.n, total: position.total })}
      </p>
      {parts.length > 1 ? (
        <ol className={styles.parts}>
          {parts.map((part) => (
            <li key={part.id} className={styles.part}>
              {part.id === current ? (
                <span className={styles.current} aria-current="page" lang={part.lang !== lang ? part.lang : undefined}>
                  {part.title}
                </span>
              ) : (
                <Link href={postPath(lang, part.id)} className={styles.link} lang={part.lang !== lang ? part.lang : undefined} data-cw-series-link={part.id}>
                  {part.title}
                </Link>
              )}
            </li>
          ))}
        </ol>
      ) : null}
    </nav>
  )
}
