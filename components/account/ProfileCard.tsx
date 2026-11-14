'use client'

import { useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { AccountPanelCopy, ProfileFieldKey } from '@/content/account'
import { countryOptions, displayLanguage, PROFILE_LANGUAGES, PROFILE_TEXT_MAX, REASON_NOTE_MAX } from '@/lib/accounts/profile-options'
import type { DashboardProfile } from '@/lib/accounts/dashboard'
import { saveProfile } from '@/lib/actions/profile'
import { PROFILE_REASONS } from '@/lib/data/types'
import type { Locale } from '@/lib/i18n'
import { ActionNotice } from './ActionNotice'
import styles from './Dashboard.module.scss'
import { useRunner } from './useRunner'

type Props = { lang: Locale; copy: AccountPanelCopy; profile: DashboardProfile; locked: boolean; lockedId: string }

function Purpose({ id, text }: { id: string; text: string }) {
  return (
    <span id={id} className={styles.purpose}>
      {text}
    </span>
  )
}

function linkLabel(url: string): string {
  return url.replace(/^https:\/\/(www\.)?/, '')
}

function ProfileView({ copy, profile }: { copy: AccountPanelCopy; profile: DashboardProfile }) {
  const rows: Array<[ProfileFieldKey, ReactNode]> = [
    ['country', profile.countryName],
    ['city', profile.city],
    ['role', profile.role],
    ['company', profile.company],
    [
      'linkedin',
      profile.linkedin ? (
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
          {linkLabel(profile.linkedin)}
        </a>
      ) : null,
    ],
    [
      'github',
      profile.github ? (
        <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer">
          @{profile.github}
        </a>
      ) : null,
    ],
    ['languages', profile.languageNames.length > 0 ? profile.languageNames.join(' · ') : null],
    ['reason', profile.reason ? copy.reasons[profile.reason] : null],
    ['reasonNote', profile.reasonNote],
  ]
  return (
    <dl className={styles.facts} data-cw-profile-view="">
      {rows.map(([key, value]) => (
        <div key={key} className={styles.fact} data-cw-profile-field={key}>
          <dt>{copy.fields[key].label}</dt>
          <dd className={value ? undefined : styles.emptyValue}>{value ?? copy.empty}</dd>
        </div>
      ))}
    </dl>
  )
}

function ProfileForm({ lang, copy, profile, onDone }: { lang: Locale; copy: AccountPanelCopy; profile: DashboardProfile; onDone: (saved: boolean) => void }) {
  const base = useId()
  const runner = useRunner()
  const countries = useMemo(() => countryOptions(lang), [lang])
  const errors = runner.result && !runner.result.ok ? runner.result.fieldErrors ?? {} : {}
  const id = (key: string) => `${base}-${key}`
  const describedBy = (key: ProfileFieldKey) => cx(`${id(key)}-purpose`, errors[key] && `${id(key)}-error`)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    runner.run(
      () => saveProfile(null, data),
      (result) => {
        if (result.ok) onDone(true)
      },
    )
  }

  function error(key: ProfileFieldKey) {
    const code = errors[key]
    if (!code) return null
    const text = code in copy.fieldErrors ? copy.fieldErrors[code as keyof AccountPanelCopy['fieldErrors']] : copy.fieldErrors.invalid
    return (
      <span id={`${id(key)}-error`} className={styles.fieldError}>
        {text}
      </span>
    )
  }

  function textField(key: 'city' | 'role' | 'company' | 'linkedin' | 'github', value: string | null, max = PROFILE_TEXT_MAX) {
    const field = copy.fields[key]
    return (
      <div className={styles.field}>
        <label htmlFor={id(key)}>{field.label}</label>
        <input
          id={id(key)}
          name={key}
          type="text"
          defaultValue={value ?? ''}
          maxLength={key === 'linkedin' ? 200 : max}
          placeholder={field.placeholder}
          autoComplete="off"
          aria-invalid={errors[key] ? true : undefined}
          aria-describedby={describedBy(key)}
        />
        <Purpose id={`${id(key)}-purpose`} text={field.purpose} />
        {error(key)}
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate data-cw-profile-form="">
      <div className={styles.field}>
        <label htmlFor={id('country')}>{copy.fields.country.label}</label>
        <select id={id('country')} name="country" defaultValue={profile.country ?? ''} aria-describedby={describedBy('country')} aria-invalid={errors.country ? true : undefined}>
          <option value="">{copy.countryPlaceholder}</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
        <Purpose id={`${id('country')}-purpose`} text={copy.fields.country.purpose} />
        {error('country')}
      </div>
      {textField('city', profile.city)}
      {textField('role', profile.role)}
      {textField('company', profile.company)}
      {textField('linkedin', profile.linkedin ? profile.linkedin.replace(/^https:\/\//, '') : null)}
      {textField('github', profile.github)}
      <fieldset className={styles.field} aria-describedby={describedBy('languages')}>
        <legend>{copy.fields.languages.label}</legend>
        <div className={styles.chips}>
          {PROFILE_LANGUAGES.map((code) => (
            <label key={code} className={styles.chip}>
              <input type="checkbox" name="languages" value={code} defaultChecked={profile.languages.includes(code)} />
              <span>{displayLanguage(code, lang)}</span>
            </label>
          ))}
        </div>
        <Purpose id={`${id('languages')}-purpose`} text={copy.fields.languages.purpose} />
        {error('languages')}
      </fieldset>
      <div className={styles.field}>
        <label htmlFor={id('reason')}>{copy.fields.reason.label}</label>
        <select id={id('reason')} name="reason" defaultValue={profile.reason ?? ''} aria-describedby={describedBy('reason')}>
          <option value="">{copy.noReason}</option>
          {PROFILE_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {copy.reasons[reason]}
            </option>
          ))}
        </select>
        <Purpose id={`${id('reason')}-purpose`} text={copy.fields.reason.purpose} />
        {error('reason')}
      </div>
      <div className={styles.field}>
        <label htmlFor={id('reasonNote')}>{copy.fields.reasonNote.label}</label>
        <textarea
          id={id('reasonNote')}
          name="reasonNote"
          rows={3}
          maxLength={REASON_NOTE_MAX}
          defaultValue={profile.reasonNote ?? ''}
          aria-describedby={describedBy('reasonNote')}
          aria-invalid={errors.reasonNote ? true : undefined}
        />
        <Purpose id={`${id('reasonNote')}-purpose`} text={copy.fields.reasonNote.purpose} />
        {error('reasonNote')}
      </div>
      {runner.result && !runner.result.ok ? <ActionNotice result={runner.result} copy={copy} success={copy.saved} /> : null}
      <div className={styles.row}>
        <button type="submit" className={buttonClassName({ variant: 'solid' })} disabled={runner.pending} data-cw-profile-save="">
          {runner.pending ? copy.saving : copy.save}
        </button>
        <button type="button" className={buttonClassName({ variant: 'ghost' })} onClick={() => onDone(false)} disabled={runner.pending}>
          {copy.cancel}
        </button>
      </div>
    </form>
  )
}

export function ProfileCard({ lang, copy, profile, locked, lockedId }: Props) {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const titleId = useId()

  return (
    <GlassSurface as="section" variant="standard" className={styles.card} aria-labelledby={titleId} data-cw-profile-card="">
      <header className={styles.cardHeader}>
        <h2 id={titleId} className={styles.cardTitle}>
          {copy.profileTitle}
        </h2>
        {!editing ? (
          <button
            type="button"
            className={buttonClassName({ size: 'sm' })}
            onClick={() => {
              setSaved(false)
              setEditing(true)
            }}
            disabled={locked}
            aria-describedby={locked ? lockedId : undefined}
            data-cw-profile-edit=""
          >
            {copy.edit}
          </button>
        ) : null}
      </header>
      <p className={styles.muted}>{copy.profileIntro}</p>
      {editing ? (
        <ProfileForm
          lang={lang}
          copy={copy}
          profile={profile}
          onDone={(done) => {
            setSaved(done)
            setEditing(false)
          }}
        />
      ) : (
        <>
          {saved ? <ActionNotice result={{ ok: true, data: undefined }} copy={copy} success={copy.saved} /> : null}
          <ProfileView copy={copy} profile={profile} />
        </>
      )}
    </GlassSurface>
  )
}
