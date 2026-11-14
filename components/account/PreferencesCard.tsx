'use client'

import { useEffect, useId, type FormEvent } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { AccountPanelCopy } from '@/content/account'
import { savePreferences } from '@/lib/actions/profile'
import type { ProfilePreferences, ThemePreference } from '@/lib/data/types'
import { emit, PREFERENCE_KEYS } from '@/lib/events'
import { localizedPath, type Locale } from '@/lib/i18n'
import { ActionNotice } from './ActionNotice'
import styles from './Dashboard.module.scss'
import { useRunner } from './useRunner'

const APPLIED_KEY = 'cw-account-prefs-applied'

type Props = { lang: Locale; copy: AccountPanelCopy; preferences: ProfilePreferences; locked: boolean; lockedId: string }

function applyTheme(theme: ThemePreference | null): void {
  const value: ThemePreference = theme ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  if (document.documentElement.getAttribute('data-theme') !== value) {
    emit('cw:theme-change', value)
  }
  if (!theme) {
    try {
      window.localStorage.removeItem(PREFERENCE_KEYS.theme)
    } catch {}
  }
}

function goToLanguage(current: Locale, preferred: Locale | null): boolean {
  if (!preferred || preferred === current) return false
  window.location.assign(localizedPath(preferred, '/account'))
  return true
}

export function PreferencesCard({ lang, copy, preferences, locked, lockedId }: Props) {
  const titleId = useId()
  const langId = useId()
  const themeId = useId()
  const runner = useRunner()

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(APPLIED_KEY) === '1') return
      window.sessionStorage.setItem(APPLIED_KEY, '1')
    } catch {
      return
    }
    if (preferences.theme) applyTheme(preferences.theme)
    goToLanguage(lang, preferences.lang)
  }, [lang, preferences.lang, preferences.theme])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const theme = data.get('prefTheme')
    const preferred = data.get('prefLang')
    runner.run(
      () => savePreferences(null, data),
      (result) => {
        if (!result.ok) return
        applyTheme(theme === 'dark' || theme === 'light' ? theme : null)
        goToLanguage(lang, preferred === 'es' || preferred === 'en' ? preferred : null)
      },
    )
  }

  return (
    <GlassSurface as="section" variant="standard" className={styles.card} aria-labelledby={titleId} data-cw-prefs-card="">
      <header className={styles.cardHeader}>
        <h2 id={titleId} className={styles.cardTitle}>
          {copy.prefsTitle}
        </h2>
      </header>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.pair}>
          <div className={styles.field}>
            <label htmlFor={langId}>{copy.prefLang}</label>
            <select id={langId} name="prefLang" defaultValue={preferences.lang ?? ''}>
              <option value="">{copy.auto}</option>
              <option value="es">{copy.langNames.es}</option>
              <option value="en">{copy.langNames.en}</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor={themeId}>{copy.prefTheme}</label>
            <select id={themeId} name="prefTheme" defaultValue={preferences.theme ?? ''}>
              <option value="">{copy.auto}</option>
              <option value="dark">{copy.themeNames.dark}</option>
              <option value="light">{copy.themeNames.light}</option>
            </select>
          </div>
        </div>
        <p className={styles.purpose}>{copy.prefsIntro}</p>
        <ActionNotice result={runner.result} copy={copy} success={copy.prefsSaved} />
        <div className={styles.row}>
          <button
            type="submit"
            className={buttonClassName({ size: 'sm' })}
            disabled={runner.pending || locked}
            aria-describedby={locked ? lockedId : undefined}
            data-cw-prefs-save=""
          >
            {runner.pending ? copy.saving : copy.prefsSave}
          </button>
        </div>
      </form>
    </GlassSurface>
  )
}
