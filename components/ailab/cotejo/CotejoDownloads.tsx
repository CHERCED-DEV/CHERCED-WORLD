'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { CotejoClient } from '@/lib/ailab/cotejo/client'
import type { CotejoExports } from '@/lib/ailab/cotejo/protocol'
import type { Locale } from '@/lib/i18n/config'
import { cotejoText } from './copy'
import styles from './CotejoStage.module.scss'

export type CotejoDownloadKind = 'json' | 'sarif' | 'markdown' | 'summary'

export const COTEJO_DOWNLOADS: ReadonlyArray<{ kind: CotejoDownloadKind; extension: string; type: string }> = [
  { kind: 'json', extension: 'json', type: 'application/json' },
  { kind: 'sarif', extension: 'sarif', type: 'application/sarif+json' },
  { kind: 'markdown', extension: 'md', type: 'text/markdown' },
  { kind: 'summary', extension: 'txt', type: 'text/plain' },
]

export function downloadFileName(base: string, kind: CotejoDownloadKind, lang: Locale): string {
  const entry = COTEJO_DOWNLOADS.find((item) => item.kind === kind)!
  return `${base}${kind === 'summary' ? (lang === 'en' ? '-summary' : '-resumen') : ''}.${entry.extension}`
}

function save(name: string, content: string, type: string): void {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }))
  link.download = name
  link.click()
  URL.revokeObjectURL(link.href)
}

export type CotejoDownloadsProps = { lang: Locale; client: CotejoClient; base: string; disabled: boolean }

export function CotejoDownloads({ lang, client, base, disabled }: CotejoDownloadsProps) {
  const text = cotejoText(lang)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  const download = async (kind: CotejoDownloadKind) => {
    setBusy(true)
    setFailed(false)
    try {
      const exports: CotejoExports = await client.exports()
      const entry = COTEJO_DOWNLOADS.find((item) => item.kind === kind)!
      save(downloadFileName(base, kind, lang), exports[kind], entry.type)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="cotejo-downloads-title" data-cw-cotejo-downloads="">
      <h4 id="cotejo-downloads-title" className={styles.panelTitle}>
        {text('cotejo.downloads.title')}
      </h4>
      <p className={styles.muted}>{text('cotejo.downloads.hint')}</p>
      <div className={styles.row}>
        <Button variant="ghost" size="sm" disabled={disabled || busy} onClick={() => void download('json')} data-cw-cotejo-download-json="">
          {text('cotejo.downloads.json')}
        </Button>
        <Button variant="ghost" size="sm" disabled={disabled || busy} onClick={() => void download('sarif')} data-cw-cotejo-download-sarif="">
          {text('cotejo.downloads.sarif')}
        </Button>
        <Button variant="ghost" size="sm" disabled={disabled || busy} onClick={() => void download('markdown')} data-cw-cotejo-download-markdown="">
          {text('cotejo.downloads.markdown')}
        </Button>
        <Button variant="ghost" size="sm" disabled={disabled || busy} onClick={() => void download('summary')} data-cw-cotejo-download-summary="">
          {text('cotejo.downloads.summary')}
        </Button>
      </div>
      {failed ? (
        <p className={styles.error} role="alert">
          {text('cotejo.downloads.failed')}
        </p>
      ) : null}
    </section>
  )
}
