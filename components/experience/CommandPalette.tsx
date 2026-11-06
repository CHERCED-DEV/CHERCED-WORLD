'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import { cx } from '@/components/ui/cx'
import { browserPreferences } from '@/lib/capabilities/preferences'
import { otherLocale, type Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { t } from '@/lib/i18n/translate'
import { loadSearchIndex } from '@/lib/search/client'
import type { SearchDoc } from '@/lib/search/types'
import styles from './CommandPalette.module.scss'
import { useSheetKeyboard } from './sheet-keyboard'
import type { ExperienceLabels } from './labels'
import {
  buildCommands,
  createPaletteSearcher,
  executePaletteCommand,
  groupItems,
  paletteExtensions,
  paletteResults,
  toPaletteDocs,
  type PaletteGroup,
  type PaletteItem,
} from './palette-model'
import { currentTheme, readCapsuleFound, rememberCapsuleFound } from './preferences'

export type CommandPaletteProps = {
  lang: Locale
  labels: ExperienceLabels
  pages: SearchDoc[]
  email: string | null
  cv: string | null
  singleKey: boolean
  open: boolean
  session: number
  onClose: () => void
  onOpenAssistant: () => void
  onOpenCapsule: () => void
  onOpenShortcuts: () => void
}

const GROUP_LABEL: Record<PaletteGroup, string> = {
  secret: 'palette.group.secret',
  pages: 'palette.group.pages',
  projects: 'palette.group.projects',
  skills: 'palette.group.skills',
  posts: 'palette.group.posts',
  actions: 'palette.group.actions',
  commands: 'palette.group.commands',
}

export function CommandPalette(props: CommandPaletteProps) {
  const titleId = useId()
  const hintId = useId()
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      labelledBy={titleId}
      describedBy={hintId}
      className={styles.palette}
      mobileSheet
    >
      <PaletteBody key={props.session} {...props} titleId={titleId} hintId={hintId} />
    </Dialog>
  )
}

type BodyProps = CommandPaletteProps & { titleId: string; hintId: string }

type IndexState = { status: 'loading' | 'ready' | 'error'; docs: SearchDoc[] }

function PaletteBody({
  lang,
  labels,
  pages,
  email,
  cv,
  singleKey,
  onClose,
  onOpenAssistant,
  onOpenCapsule,
  onOpenShortcuts,
  titleId,
  hintId,
}: BodyProps) {
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  useSheetKeyboard(bodyRef)
  const listId = useId()
  const optionPrefix = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [index, setIndex] = useState<IndexState>({ status: 'loading', docs: pages })
  const [context] = useState(() => ({
    theme: currentTheme(),
    email,
    cv,
    now: localizedPath(lang, '/now'),
    aiLab: localizedPath(lang, '/ai-lab'),
    capsuleFound: readCapsuleFound(),
    extensions: paletteExtensions(),
  }))

  useEffect(() => {
    let alive = true
    loadSearchIndex(lang).then(
      (loaded) => alive && setIndex({ status: 'ready', docs: loaded.docs }),
      () => alive && setIndex((current) => ({ ...current, status: 'error' })),
    )
    return () => {
      alive = false
    }
  }, [lang])

  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [])

  const docs = useMemo(
    () => toPaletteDocs(index.docs, buildCommands(labels, context), context.extensions),
    [index.docs, labels, context],
  )
  const searcher = useMemo(() => createPaletteSearcher(docs), [docs])
  const items = useMemo(
    () => paletteResults(query, docs, searcher, t(labels, 'palette.secret')),
    [query, docs, searcher, labels],
  )
  const groups = useMemo(() => groupItems(items), [items])
  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups])
  const offsets = useMemo(
    () => groups.map((_, index) => groups.slice(0, index).reduce((total, group) => total + group.items.length, 0)),
    [groups],
  )
  const current = flat.length === 0 ? -1 : Math.min(active, flat.length - 1)
  const optionId = (position: number) => `${optionPrefix}-${position}`

  useEffect(() => {
    if (current < 0) return
    document.getElementById(`${optionPrefix}-${current}`)?.scrollIntoView({ block: 'nearest' })
  }, [current, optionPrefix])

  const copyEmail = async () => {
    if (!email) return
    try {
      await navigator.clipboard.writeText(email)
      toast.success(t(labels, 'palette.copied'))
    } catch {
      toast.error(t(labels, 'palette.copyFailed', { email }))
    }
  }

  const preferences = () =>
    browserPreferences({ lang, pathname: () => pathname ?? `/${lang}`, navigate: (href) => router.push(href) })

  const run = (item: PaletteItem | undefined) => {
    if (!item) return
    executePaletteCommand(item.command, {
      close: onClose,
      navigate: (href) => router.push(href),
      setTheme: (to) => preferences().setTheme(to),
      switchLang: () => preferences().setLanguage(otherLocale(lang)),
      open: (href) => window.open(href, '_blank', 'noopener,noreferrer'),
      shortcuts: onOpenShortcuts,
      assistant: onOpenAssistant,
      copyEmail: () => void copyEmail(),
      capsule: () => {
        rememberCapsuleFound()
        onOpenCapsule()
      },
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (flat.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current + 1) % flat.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current - 1 + flat.length) % flat.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      run(flat[current])
    }
  }

  const announcement =
    flat.length === 0
      ? t(labels, 'palette.noResults', { query: query.trim() })
      : flat.length === 1
        ? t(labels, 'palette.result')
        : t(labels, 'palette.results', { count: flat.length })

  return (
    <div ref={bodyRef} className={styles.body} data-cw-palette-body="">
      <h2 id={titleId} className="cw-visually-hidden">
        {t(labels, 'palette.title')}
      </h2>
      <div className={styles.search}>
        <Icon name="search" className={styles.searchIcon} />
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          role="combobox"
          aria-label={t(labels, 'palette.label')}
          aria-expanded={flat.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={current >= 0 ? optionId(current) : undefined}
          placeholder={t(labels, 'palette.placeholder')}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          maxLength={120}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          data-cw-palette-input=""
        />
        <button type="button" className={styles.close} aria-label={t(labels, 'dialog.close')} onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      </div>

      <div id={listId} role="listbox" aria-label={t(labels, 'palette.title')} className={styles.list} data-cw-palette-list="">
        {groups.map((group, groupIndex) => {
          const groupLabelId = `${listId}-${group.group}`
          return (
            <div key={group.group} role="group" aria-labelledby={groupLabelId} className={styles.group}>
              <div id={groupLabelId} role="presentation" className={styles.groupTitle}>
                {t(labels, GROUP_LABEL[group.group])}
              </div>
              {group.items.map((item, itemIndex) => {
                const mine = offsets[groupIndex] + itemIndex
                const selected = mine === current
                return (
                  <div
                    key={item.id}
                    id={optionId(mine)}
                    role="option"
                    aria-selected={selected}
                    aria-keyshortcuts={singleKey && item.shortcut ? item.shortcut : undefined}
                    className={cx(styles.option, selected && styles.active, item.group === 'secret' && styles.secret)}
                    data-cw-palette-option={item.id}
                    onMouseMove={() => {
                      if (!selected) setActive(mine)
                    }}
                    onClick={() => run(item)}
                  >
                    <span className={styles.optionTitle}>{item.title}</span>
                    {item.hint ? <span className={styles.optionHint}>{item.hint}</span> : null}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {flat.length === 0 ? <p className={styles.empty}>{announcement}</p> : null}
      {index.status === 'loading' ? <p className={styles.note}>{t(labels, 'palette.loading')}</p> : null}
      {index.status === 'error' ? <p className={styles.note}>{t(labels, 'palette.offline')}</p> : null}
      <p id={hintId} className={styles.keys}>
        {t(labels, 'palette.keys')}
      </p>
      <p role="status" className="cw-visually-hidden">
        {announcement}
      </p>
    </div>
  )
}
