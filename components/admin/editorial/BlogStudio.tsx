'use client'

import { useEffect, useState } from 'react'
import { editorialCopy } from '@/content/editorial'
import type { Locale } from '@/content/types'
import { publishEditorialDraft, requestEditorialReview, saveEditorialDraft, unpublishEditorialDraft } from '@/lib/actions/editorial'
import { exportDraft, type EditorialDraft, type DraftInput } from '@/lib/editorial/model'
import type { PublishedSummary } from '@/lib/editorial/published'
import { buttonClassName } from '@/components/ui/Button'
import { MarkdownPreview } from './MarkdownPreview'
import styles from './Editorial.module.scss'

type Storage = 'mongo' | 'local'

function byDraft(items: readonly PublishedSummary[]): Record<string, PublishedSummary> {
  return Object.fromEntries(items.map((item) => [item.draftId, item]))
}

export function BlogStudio({
  lang,
  initialDrafts,
  initialPublished = [],
  storage,
  role = 'owner',
}: {
  lang: Locale
  initialDrafts: EditorialDraft[]
  initialPublished?: PublishedSummary[]
  storage: Storage
  role?: 'owner' | 'guest'
}) {
  const copy = editorialCopy[lang]
  const [drafts, setDrafts] = useState(initialDrafts)
  const [published, setPublished] = useState(() => byDraft(initialPublished))
  const [draft, setDraft] = useState<DraftInput | null>(initialDrafts[0] ?? null)
  const [tags, setTags] = useState(initialDrafts[0]?.tags.join(', ') ?? '')
  const [dirty, setDirty] = useState(false)
  const [pending, setPending] = useState(false)
  const [preview, setPreview] = useState(false)
  const [status, setStatus] = useState('')
  const live = draft ? published[draft.id] : undefined
  const meta = draft ? drafts.find(item => item.id === draft.id) : undefined
  const owner = role === 'owner'

  useEffect(() => {
    if (!dirty) return
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])

  function select(next: DraftInput) {
    if (pending || (dirty && !window.confirm(copy.discard))) return
    setDraft(next); setTags(next.tags.join(', ')); setDirty(false); setStatus(''); setPreview(false)
  }

  function change(patch: Partial<DraftInput>) {
    if (!draft) return
    setDraft({ ...draft, ...patch }); setDirty(true); setStatus('')
  }

  function current(): DraftInput | null {
    return draft ? { ...draft, tags: [...new Set(tags.split(',').map(tag => tag.trim()).filter(Boolean))] } : null
  }

  async function persist(): Promise<EditorialDraft | null> {
    const input = current()
    if (!input) return null
    const result = await saveEditorialDraft(input)
    if (!result.ok) { setStatus(copy[result.error]); return null }
    setDraft(result.draft)
    setDrafts(items => [result.draft, ...items.filter(item => item.id !== result.draft.id)])
    setDirty(false)
    return result.draft
  }

  async function save() {
    if (!draft || pending) return
    setPending(true); setStatus('')
    try { if (await persist()) setStatus(copy.saved) }
    catch { setStatus(copy.unavailable) }
    finally { setPending(false) }
  }

  async function publish() {
    if (!draft || pending) return
    setPending(true); setStatus('')
    try {
      const saved = dirty || draft.version === 0 ? await persist() : draft
      if (!saved) return
      const result = await publishEditorialDraft({ id: saved.id, version: saved.version })
      if (!result.ok) { setStatus(result.error === 'unavailable' ? copy.publishUnavailable : copy[result.error]); return }
      const again = Boolean(published[saved.id])
      setPublished(items => ({ ...items, [saved.id]: result.post }))
      setDrafts(items => items.map(item => item.id === saved.id ? { ...item, review: null } : item))
      const note = result.dropped.length > 0 ? ` ${copy.dropped.replace('{tags}', result.dropped.join(', '))}` : ''
      setStatus(`${again ? copy.republished : copy.publishedNow}${note}`)
    } catch { setStatus(copy.publishUnavailable) }
    finally { setPending(false) }
  }

  async function unpublish() {
    if (!draft || pending || !window.confirm(copy.confirmUnpublish)) return
    setPending(true); setStatus('')
    try {
      const result = await unpublishEditorialDraft({ id: draft.id })
      if (!result.ok) { setStatus(result.error === 'unavailable' ? copy.publishUnavailable : copy[result.error]); return }
      setPublished(items => Object.fromEntries(Object.entries(items).filter(([id]) => id !== draft.id)))
      setStatus(copy.unpublished)
    } catch { setStatus(copy.publishUnavailable) }
    finally { setPending(false) }
  }

  async function sendForReview() {
    if (!draft || pending) return
    setPending(true); setStatus('')
    try {
      const saved = dirty || draft.version === 0 ? await persist() : draft
      if (!saved) return
      const result = await requestEditorialReview({ id: saved.id, version: saved.version })
      if (!result.ok) { setStatus(copy[result.error]); return }
      setDrafts(items => [result.draft, ...items.filter(item => item.id !== result.draft.id)])
      setStatus(copy.requested)
    } catch { setStatus(copy.unavailable) }
    finally { setPending(false) }
  }

  function download() {
    const input = current()
    if (!input) return
    const url = URL.createObjectURL(new Blob([exportDraft(input)], { type: 'text/markdown;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = `borrador-${input.id}-${input.lang}.md`; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const ready = Boolean(draft && draft.title.trim() && draft.description.trim() && draft.body.trim())

  return <div className={styles.workspace} data-cw-blog-studio="">
    <aside className={styles.library} aria-label={copy.drafts}>
      <h2>{copy.drafts}</h2>
      <button className={buttonClassName({ variant: 'solid', size: 'sm' })} disabled={pending} onClick={() => select({ id: crypto.randomUUID(), version: 0, lang, title: '', description: '', body: '', tags: [] })}>{copy.create}</button>
      <div className={styles.list}>{drafts.map(item => <button key={item.id} className={styles.draft} aria-current={draft?.id === item.id ? 'true' : undefined} disabled={pending} onClick={() => select(item)}><strong>{item.title}</strong><small>{item.lang.toUpperCase()} · {new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(new Date(item.updatedAt))}{published[item.id] ? <> · <span className={styles.live} data-cw-draft-live="">{copy.live}</span></> : null}{item.review ? <> · <span className={styles.live} data-cw-draft-review="">{copy.inReview}</span></> : null}{owner && item.author ? <> · {item.author.name}</> : null}</small></button>)}</div>
      {owner ? null : <p className={styles.note} data-cw-guest-note="">{copy.guestNote}</p>}
      <p className={styles.note}>{copy[storage]}</p>
    </aside>
    {draft ? <form className={styles.editor} onSubmit={event => { event.preventDefault(); void save() }}>
      {owner && meta?.author ? <p className={styles.note} data-cw-draft-author="">{copy.authorNote.replace('{name}', meta.author.name)}</p> : null}
      <label className={styles.field}>{copy.titleLabel}<input name="title" value={draft.title} required maxLength={180} disabled={pending} onChange={event => change({ title: event.target.value })} /></label>
      <label className={styles.field}>{copy.description}<textarea name="description" rows={2} maxLength={320} disabled={pending} value={draft.description} onChange={event => change({ description: event.target.value })} /></label>
      <div className={styles.metadata}>
        <label className={styles.field}>{copy.language}<select name="lang" value={draft.lang} disabled={pending} onChange={event => change({ lang: event.target.value as Locale })}><option value="es">Español</option><option value="en">English</option></select></label>
        <label className={styles.field}>{copy.tags}<input name="tags" value={tags} disabled={pending} onChange={event => { setTags(event.target.value); setDirty(true); setStatus('') }} /></label>
      </div>
      <div className={styles.actions}><button type="button" className={buttonClassName({ size: 'sm' })} aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? copy.edit : copy.preview}</button><span className={styles.note}>{draft.body.trim() ? draft.body.trim().split(/\s+/).length : 0} {copy.words}</span></div>
      {preview ? <article className={styles.preview} aria-label={copy.preview} lang={draft.lang}><h2>{draft.title || copy.untitled}</h2><p>{draft.description}</p><MarkdownPreview body={draft.body} /></article> : <label className={styles.field}>{copy.body}<textarea className={styles.body} name="body" value={draft.body} disabled={pending} maxLength={100_000} aria-describedby="editorial-hint" onChange={event => change({ body: event.target.value })} /></label>}
      <p id="editorial-hint" className={styles.note}>{copy.hint}</p>
      <div className={styles.actions}>
        <button type="submit" className={buttonClassName({ variant: 'solid' })} disabled={pending || !draft.title.trim()}>{pending ? copy.saving : copy.save}</button>
        {owner ? <button type="button" className={buttonClassName({ variant: 'solid' })} disabled={pending || !ready} onClick={() => void publish()} data-cw-publish="">{pending ? copy.publishing : live ? copy.republish : copy.publish}</button> : <button type="button" className={buttonClassName({ variant: 'solid' })} disabled={pending || !ready} onClick={() => void sendForReview()} data-cw-request-review="">{pending ? copy.requesting : copy.requestReview}</button>}
        {owner && live ? <button type="button" className={buttonClassName({})} disabled={pending} onClick={() => void unpublish()} data-cw-unpublish="">{copy.unpublish}</button> : null}
        <button type="button" className={buttonClassName({})} onClick={download}>{copy.export}</button>
      </div>
      {live ? <p className={styles.note} data-cw-published-link=""><a href={`/${live.lang}/blog/${live.id}`} target="_blank" rel="noopener noreferrer">{copy.view}</a> · /{live.lang}/blog/{live.id}</p> : null}
      <p className={styles.status} role="status" aria-live="polite">{status || (dirty ? copy.unsaved : '')}</p>
      <p className={styles.note}>{owner ? copy.review : copy.guestReview}</p>
    </form> : <div className={styles.editor}><p>{copy.empty}</p><p className={styles.note}>{owner ? copy.review : copy.guestReview}</p></div>}
  </div>
}
