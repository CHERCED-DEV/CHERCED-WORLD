import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Locale } from '@/lib/i18n/config'
import { pickKeys, t, type Dictionary } from '@/lib/i18n/translate'
import { integer } from './format'
import { SPEND_ENDPOINT, SPEND_KEYS, SPEND_SECTION_ID } from './spend-config'
import { SpendPanel } from './SpendPanel'
import styles from './Engineering.module.scss'

type Props = { lang: Locale; dict: Dictionary; targetUsd: number; capUsd: number }

export function SpendSection({ lang, dict, targetUsd, capUsd }: Props) {
  return (
    <GlassSurface as="section" id={SPEND_SECTION_ID} className={styles.panel} aria-labelledby="eng-spend-title" data-cw-eng-spend-section="">
      <h2 id="eng-spend-title" className={styles.h2}>
        {t(dict, 'engineering.spend.title')}
      </h2>
      <p>{t(dict, 'engineering.spend.intro', { target: integer(targetUsd, lang), cap: integer(capUsd, lang) })}</p>
      <SpendPanel lang={lang} dict={pickKeys(dict, SPEND_KEYS)} endpoint={SPEND_ENDPOINT} />
    </GlassSurface>
  )
}
