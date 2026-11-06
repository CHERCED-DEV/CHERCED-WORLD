'use client'

import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { CapsuleEntry } from '@/content/types'
import { cx } from '@/components/ui/cx'
import { useToast } from '@/components/ui/Toast'
import { browserPreferences } from '@/lib/capabilities/preferences'
import { emit, on } from '@/lib/events'
import { otherLocale, type Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { t } from '@/lib/i18n/translate'
import type { SearchDoc } from '@/lib/search/types'
import styles from './ExperienceClient.module.scss'
import type { ExperienceLabels } from './labels'
import {
  currentTheme,
  readCapsuleFound,
  readSingleKeyShortcuts,
  rememberCapsuleFound,
  rememberSingleKeyShortcuts,
} from './preferences'
import { ShortcutsDialog, useGlobalShortcuts } from './Shortcuts'
import { paletteKeyshortcuts, SHORTCUT_KEYS, type ShortcutAction } from './shortcuts-model'

const loadPalette = () => import('./CommandPalette')
const loadPaletteModel = () => import('./palette-model')
const loadAssistant = () => import('./Assistant')

const CommandPalette = dynamic(() => loadPalette().then((mod) => mod.CommandPalette), { ssr: false })
const Assistant = dynamic(() => loadAssistant().then((mod) => mod.Assistant), { ssr: false })
const Capsule = dynamic(() => import('./Capsule').then((mod) => mod.Capsule), { ssr: false })

const PRELOAD_DEADLINE_MS = 2000

function whenIdle(task: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(task, { timeout: PRELOAD_DEADLINE_MS })
    return () => window.cancelIdleCallback(handle)
  }
  const handle = window.setTimeout(task, 1)
  return () => window.clearTimeout(handle)
}

function announceShortcuts(enabled: boolean): void {
  for (const trigger of document.querySelectorAll('[data-cw-palette-trigger]')) {
    trigger.setAttribute('aria-keyshortcuts', paletteKeyshortcuts(enabled))
  }
  for (const toggle of document.querySelectorAll('[data-cw-theme-toggle]')) {
    if (enabled) toggle.setAttribute('aria-keyshortcuts', SHORTCUT_KEYS.theme)
    else toggle.removeAttribute('aria-keyshortcuts')
  }
}

type Panel = 'palette' | 'assistant' | 'capsule' | 'shortcuts'

export type AssistantStatus = 'idle' | 'ready' | 'unavailable'

export type ExperienceClientProps = {
  lang: Locale
  labels: ExperienceLabels
  pages: SearchDoc[]
  email: string | null
  cv: string | null
  areas: string[]
  capsule: CapsuleEntry[]
}

export function ExperienceClient({ lang, labels, pages, email, cv, areas, capsule }: ExperienceClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const pathRef = useRef(pathname)
  const [open, setOpen] = useState<Panel | null>(null)
  const [sessions, setSessions] = useState<Record<Panel, number>>({ palette: 0, assistant: 0, capsule: 0, shortcuts: 0 })
  const [status, setStatus] = useState<AssistantStatus>('idle')
  const [discovered, setDiscovered] = useState(false)
  const [ready, setReady] = useState(false)
  const [singleKey, setSingleKey] = useState(() => typeof window === 'undefined' || readSingleKeyShortcuts())
  const statusId = useId()

  useEffect(() => {
    pathRef.current = pathname
  }, [pathname])

  const show = useCallback((panel: Panel) => {
    setSessions((current) => ({ ...current, [panel]: current[panel] + 1 }))
    setOpen(panel)
  }, [])

  const closer = useCallback((panel: Panel) => () => setOpen((current) => (current === panel ? null : current)), [])

  useEffect(() => on('cw:open-palette', () => show('palette')), [show])
  useEffect(() => on('cw:open-assistant', () => show('assistant')), [show])

  useEffect(() => announceShortcuts(singleKey), [singleKey])

  const toggleSingleKey = useCallback((enabled: boolean) => {
    rememberSingleKeyShortcuts(enabled)
    setSingleKey(enabled)
  }, [])

  const onShortcut = useCallback(
    (action: ShortcutAction) => {
      if (action === 'palette') emit('cw:open-palette')
      else if (action === 'help') show('shortcuts')
      else emit('cw:theme-change', currentTheme() === 'dark' ? 'light' : 'dark')
    },
    [show],
  )

  useGlobalShortcuts({ enabled: singleKey, onAction: onShortcut })

  useEffect(() => {
    let alive = true
    const cancel = whenIdle(() => {
      Promise.allSettled([loadPalette(), loadAssistant()]).then(() => {
        if (alive) setReady(true)
      })
    })
    return () => {
      alive = false
      cancel()
    }
  }, [])

  const areaKey = areas.join(' ')

  useEffect(() => {
    let alive = true
    let disconnect: (() => void) | null = null
    const cancel = whenIdle(() => {
      import('@/lib/agent/webmcp')
        .then(({ connectWebMcp }) =>
          connectWebMcp({
            lang,
            areas: areaKey.split(' ').filter(Boolean),
            origin: window.location.origin,
            preferences: browserPreferences({
              lang,
              pathname: () => pathRef.current ?? `/${lang}`,
              navigate: (href) => router.push(href),
            }),
          }),
        )
        .then(
          (dispose) => {
            if (alive) disconnect = dispose
            else dispose()
          },
          () => {},
        )
    })
    return () => {
      alive = false
      cancel()
      disconnect?.()
    }
  }, [lang, areaKey, router])

  const toast = useToast()

  useEffect(() => {
    let alive = true
    let unregister: (() => void) | null = null
    const preferences = () =>
      browserPreferences({ lang, pathname: () => pathRef.current ?? `/${lang}`, navigate: (href) => router.push(href) })
    const cancel = whenIdle(() => {
      loadPaletteModel().then(
        (model) => {
          if (!alive) return
          unregister = model.registerPaletteRunner({
            items: () =>
              model
                .toPaletteDocs(
                  pages,
                  model.buildCommands(labels, {
                    theme: currentTheme(),
                    email,
                    cv,
                    now: localizedPath(lang, '/now'),
                    aiLab: localizedPath(lang, '/ai-lab'),
                    capsuleFound: readCapsuleFound(),
                    extensions: model.paletteExtensions(),
                  }),
                  model.paletteExtensions(),
                )
                .map((doc) => doc.item),
            run: (item) =>
              model.executePaletteCommand(item.command, {
                close: () => setOpen((current) => (current === 'palette' ? null : current)),
                navigate: (href) => router.push(href),
                setTheme: (to) => preferences().setTheme(to),
                switchLang: () => preferences().setLanguage(otherLocale(lang)),
                open: (href) => window.open(href, '_blank', 'noopener,noreferrer'),
                shortcuts: () => show('shortcuts'),
                assistant: () => show('assistant'),
                copyEmail: () => {
                  if (!email) return
                  navigator.clipboard.writeText(email).then(
                    () => toast.success(t(labels, 'palette.copied')),
                    () => toast.error(t(labels, 'palette.copyFailed', { email })),
                  )
                },
                capsule: () => {
                  rememberCapsuleFound()
                  setDiscovered(true)
                  show('capsule')
                },
              }),
          })
        },
        () => {},
      )
    })
    return () => {
      alive = false
      cancel()
      unregister?.()
    }
  }, [lang, labels, pages, email, cv, router, show, toast])

  const unavailable = status === 'unavailable'

  return (
    <>
      <button
        type="button"
        className={cx(styles.fab, 'cw-js-only')}
        aria-haspopup="dialog"
        aria-describedby={unavailable ? statusId : undefined}
        data-cw-glass="standard"
        data-cw-assistant-button=""
        data-cw-ready={ready ? '' : undefined}
        data-status={status}
        onClick={() => emit('cw:open-assistant')}
      >
        <svg className={styles.icon} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M4 5h16v10H9l-5 4V5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M8 9h8M8 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className={styles.label}>{t(labels, 'assistant.open')}</span>
        {unavailable ? (
          <span id={statusId} className={styles.status}>
            {t(labels, 'assistant.unavailableShort')}
          </span>
        ) : null}
      </button>

      {sessions.palette > 0 ? (
        <CommandPalette
          lang={lang}
          labels={labels}
          pages={pages}
          email={email}
          cv={cv}
          singleKey={singleKey}
          open={open === 'palette'}
          session={sessions.palette}
          onClose={closer('palette')}
          onOpenAssistant={() => show('assistant')}
          onOpenCapsule={() => {
            setDiscovered(true)
            show('capsule')
          }}
          onOpenShortcuts={() => show('shortcuts')}
        />
      ) : null}

      {sessions.assistant > 0 ? (
        <Assistant
          lang={lang}
          labels={labels}
          open={open === 'assistant'}
          status={status}
          onStatus={setStatus}
          onClose={closer('assistant')}
        />
      ) : null}

      {sessions.capsule > 0 ? (
        <Capsule
          lang={lang}
          labels={labels}
          entries={capsule}
          open={open === 'capsule'}
          discovered={discovered}
          onClose={closer('capsule')}
        />
      ) : null}

      {sessions.shortcuts > 0 ? (
        <ShortcutsDialog
          labels={labels}
          open={open === 'shortcuts'}
          enabled={singleKey}
          onToggle={toggleSingleKey}
          onClose={closer('shortcuts')}
        />
      ) : null}
    </>
  )
}
