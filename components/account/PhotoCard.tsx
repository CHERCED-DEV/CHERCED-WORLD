'use client'

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { AccountPanelCopy } from '@/content/account'
import { setPhotoSource, uploadAvatar } from '@/lib/actions/profile'
import type { ActionResult } from '@/lib/actions/result'
import type { PhotoSource } from '@/lib/data/types'
import { ActionNotice } from './ActionNotice'
import { Avatar } from './Avatar'
import { AvatarImageError, prepareAvatar } from './avatar-image'
import styles from './Dashboard.module.scss'
import { useRunner } from './useRunner'

type Props = {
  copy: AccountPanelCopy
  name: string
  photo: PhotoSource
  avatarSrc: string | null
  uploadSrc: string | null
  googleSrc: string | null
  locked: boolean
  lockedId: string
}

type Draft = { blob: Blob; url: string }

export function PhotoCard({ copy, name, photo, avatarSrc, uploadSrc, googleSrc, locked, lockedId }: Props) {
  const titleId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [preparing, setPreparing] = useState(false)
  const upload = useRunner<number>()
  const source = useRunner()
  const busy = preparing || upload.pending || source.pending

  useEffect(() => () => {
    if (draft) URL.revokeObjectURL(draft.url)
  }, [draft])

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setProblem(null)
    upload.clear()
    source.clear()
    setPreparing(true)
    try {
      const blob = await prepareAvatar(file)
      setDraft({ blob, url: URL.createObjectURL(blob) })
    } catch (error) {
      setProblem(copy.photoErrors[error instanceof AvatarImageError ? error.problem : 'read'])
    } finally {
      setPreparing(false)
    }
  }

  function save() {
    if (!draft) return
    const data = new FormData()
    data.set('avatar', new File([draft.blob], draft.blob.type === 'image/webp' ? 'avatar.webp' : 'avatar.jpg', { type: draft.blob.type }))
    upload.run(
      () => uploadAvatar(null, data),
      (result) => {
        if (result.ok) setDraft(null)
      },
    )
  }

  function pick(next: PhotoSource) {
    if (next === photo) return
    const data = new FormData()
    data.set('photo', next)
    upload.clear()
    source.run(() => setPhotoSource(null, data))
  }

  const options: Array<{ value: PhotoSource; label: string; available: boolean }> = [
    { value: 'upload', label: copy.photoUseUpload, available: Boolean(uploadSrc) },
    { value: 'google', label: copy.photoGoogle, available: Boolean(googleSrc) },
    { value: 'none', label: copy.photoNone, available: true },
  ]
  const fieldErrorKey = (result: ActionResult<unknown> | null) =>
    result && !result.ok ? (result.fieldErrors?.avatar ?? result.fieldErrors?.photo ?? null) : null
  const serverProblem = fieldErrorKey(upload.result) ?? fieldErrorKey(source.result)
  const shownProblem =
    problem ?? (serverProblem && serverProblem in copy.photoErrors ? copy.photoErrors[serverProblem as keyof AccountPanelCopy['photoErrors']] : null)

  return (
    <GlassSurface as="section" variant="standard" className={styles.card} aria-labelledby={titleId} data-cw-photo-card="">
      <header className={styles.cardHeader}>
        <h2 id={titleId} className={styles.cardTitle}>
          {copy.photoTitle}
        </h2>
      </header>
      <div className={styles.photoRow}>
        <Avatar src={draft?.url ?? avatarSrc} name={name} size="lg" />
        <div className={styles.photoSide}>
          {draft ? <p className={styles.caption}>{copy.photoPreview}</p> : null}
          <input ref={input} type="file" accept="image/*" className={styles.visuallyHidden} onChange={choose} tabIndex={-1} aria-hidden="true" data-cw-photo-input="" />
          {draft ? (
            <div className={styles.row}>
              <button type="button" className={buttonClassName({ variant: 'solid', size: 'sm' })} onClick={save} disabled={busy} data-cw-photo-save="">
                {copy.photoSave}
              </button>
              <button type="button" className={buttonClassName({ variant: 'ghost', size: 'sm' })} onClick={() => setDraft(null)} disabled={busy}>
                {copy.cancel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={buttonClassName({ size: 'sm' })}
              onClick={() => input.current?.click()}
              disabled={busy || locked}
              aria-describedby={locked ? lockedId : undefined}
              data-cw-photo-pick=""
            >
              {copy.photoPick}
            </button>
          )}
        </div>
      </div>
      <fieldset className={styles.sources} disabled={busy || locked || Boolean(draft)}>
        <legend className={styles.visuallyHidden}>{copy.photoTitle}</legend>
        {options
          .filter((option) => option.available)
          .map((option) => (
            <label key={option.value} className={cx(styles.chip, styles.radioChip)}>
              <input type="radio" name="photo" value={option.value} checked={photo === option.value} onChange={() => pick(option.value)} />
              <span>{option.label}</span>
            </label>
          ))}
      </fieldset>
      <p className={styles.purpose}>{copy.photoIntro}</p>
      {shownProblem ? (
        <p role="alert" className={cx(styles.notice, styles.noticeError)} data-cw-panel-notice="photo">
          {shownProblem}
        </p>
      ) : (
        <ActionNotice result={upload.result ?? source.result} copy={copy} success={copy.photoSaved} />
      )}
    </GlassSurface>
  )
}
