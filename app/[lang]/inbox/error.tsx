'use client'

import { useParams } from 'next/navigation'
import styles from '@/components/admin/admin.module.scss'
import { Button } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import en from '@/content/i18n/en/admin.json'
import es from '@/content/i18n/es/admin.json'
import { defaultLocale, isLocale } from '@/lib/i18n/config'

const texts = {
  es: { title: es['admin.unavailable.title'], text: es['admin.unavailable.text'], retry: es['admin.unavailable.retry'] },
  en: { title: en['admin.unavailable.title'], text: en['admin.unavailable.text'], retry: en['admin.unavailable.retry'] },
}

export default function InboxError({ retry }: { error: unknown; retry: () => void }) {
  const params = useParams<{ lang?: string }>()
  const copy = texts[isLocale(params?.lang) ? params.lang : defaultLocale]

  return (
    <section className={cx('cw-container', styles.authWrap)} data-cw-panel-unavailable="">
      <div className={styles.authCard} data-cw-glass="standard" role="alert">
        <h1 className={styles.authTitle}>{copy.title}</h1>
        <p className={styles.muted}>{copy.text}</p>
        <Button variant="solid" onClick={retry}>
          {copy.retry}
        </Button>
      </div>
    </section>
  )
}
