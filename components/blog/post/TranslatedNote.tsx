import type { PostMeta } from '@/content/types'
import { languageName } from '@/lib/blog/format'
import { t, type Dictionary, type Locale } from '@/lib/i18n'
import { Icon } from '@/components/ui/Icon'
import styles from './TranslatedNote.module.scss'

export function translatedFrom(meta: Pick<PostMeta, 'lang' | 'originalLang'>, fallback: boolean): Locale | null {
  return !fallback && meta.originalLang !== meta.lang ? meta.originalLang : null
}

export function TranslatedNote({ originalLang, lang, blog }: { originalLang: Locale; lang: Locale; blog: Dictionary }) {
  return (
    <p role="note" className={styles.note} data-cw-translated-from={originalLang}>
      <Icon name="globe" size={16} />
      <span>{t(blog, 'post.translatedFrom', { lang: languageName(originalLang, lang) })}</span>
    </p>
  )
}
