'use client'

import { useId, type FormEvent } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { AccountPanelCopy } from '@/content/account'
import { grantProfileConsent } from '@/lib/actions/profile'
import { localizedPath, type Locale } from '@/lib/i18n'
import { ActionNotice } from './ActionNotice'
import styles from './Dashboard.module.scss'
import { useRunner } from './useRunner'

export function ConsentGate({ lang, copy, id, privacy }: { lang: Locale; copy: AccountPanelCopy; id: string; privacy: string }) {
  const checkId = useId()
  const runner = useRunner()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    runner.run(() => grantProfileConsent(null, data))
  }

  return (
    <GlassSurface as="section" variant="subtle" className={styles.consentGate} aria-labelledby={id} data-cw-consent-gate="">
      <h2 id={id} className={styles.cardTitle}>
        {copy.consentTitle}
      </h2>
      <form className={styles.form} onSubmit={submit}>
        <label htmlFor={checkId} className={styles.check}>
          <input id={checkId} type="checkbox" name="consent" required data-cw-consent-check="" />
          <span>{copy.consent}</span>
        </label>
        <p className={styles.purpose}>
          {copy.consentNote} <a href={localizedPath(lang, '/privacy')}>{privacy}</a>
        </p>
        <ActionNotice result={runner.result} copy={copy} success="" />
        <div className={styles.row}>
          <button type="submit" className={buttonClassName({ variant: 'solid', size: 'sm' })} disabled={runner.pending} data-cw-consent-grant="">
            {copy.consentButton}
          </button>
        </div>
      </form>
    </GlassSurface>
  )
}
