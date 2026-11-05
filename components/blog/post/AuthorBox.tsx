import Image from 'next/image'
import Link from 'next/link'
import { getSite } from '@/lib/content'
import { localizedPath, t, type Dictionary, type Locale } from '@/lib/i18n'
import { PERSON_NAME } from '@/lib/seo/person'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { themedPortrait } from '@/components/site/about/portrait'
import styles from './AuthorBox.module.scss'

export const AUTHOR_TITLE_ID = 'cw-author-title'

const PORTRAIT_SIZES = '144px'

export function AuthorBox({ lang, blog }: { lang: Locale; blog: Dictionary }) {
  const { dark, light } = themedPortrait(getSite().about.image)

  return (
    <section className={styles.author} aria-labelledby={AUTHOR_TITLE_ID} data-cw-author-box="" data-cw-glass="subtle">
      <span className={styles.portrait} data-cw-author-portrait={light ? 'themed' : 'single'}>
        <Image src={dark.src} alt="" width={dark.width} height={dark.height} sizes={PORTRAIT_SIZES} className={cx(styles.image, light && styles.dark)} data-cw-portrait-theme="dark" />
        {light ? (
          <Image src={light.src} alt="" width={light.width} height={light.height} sizes={PORTRAIT_SIZES} className={cx(styles.image, styles.light)} data-cw-portrait-theme="light" />
        ) : null}
      </span>
      <div className={styles.text}>
        <h2 id={AUTHOR_TITLE_ID} className={styles.name}>
          {PERSON_NAME}
        </h2>
        <p className={styles.line}>{t(blog, 'author.line')}</p>
      </div>
      <Link href={localizedPath(lang, '/contactMe')} className={buttonClassName({ variant: 'glass', size: 'sm', className: styles.cta })} data-cw-author-cta="">
        {t(blog, 'author.cta')}
      </Link>
    </section>
  )
}
