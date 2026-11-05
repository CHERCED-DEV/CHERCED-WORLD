'use client'

import { useEffect, useEffectEvent, useId } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Icon } from '@/components/ui/Icon'
import { t } from '@/lib/i18n/translate'
import type { ExperienceLabels } from './labels'
import styles from './Shortcuts.module.scss'
import { SHORTCUT_KEYS, shortcutFor, type ShortcutAction } from './shortcuts-model'

export type ShortcutsDialogProps = {
  labels: ExperienceLabels
  open: boolean
  enabled: boolean
  onToggle: (enabled: boolean) => void
  onClose: () => void
}

type Row = { keys: string[]; action: string }

export function ShortcutsDialog({ labels, open, enabled, onToggle, onClose }: ShortcutsDialogProps) {
  const titleId = useId()
  const toggleId = useId()
  const rows: Row[] = [
    { keys: [t(labels, 'palette.hint'), SHORTCUT_KEYS.palette], action: 'shortcuts.palette' },
    { keys: [SHORTCUT_KEYS.help], action: 'shortcuts.help' },
    { keys: [SHORTCUT_KEYS.theme], action: 'shortcuts.theme' },
    { keys: ['Esc'], action: 'shortcuts.close' },
  ]
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} className={styles.shortcuts}>
      <div className={styles.body} data-cw-shortcuts="">
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {t(labels, 'shortcuts.title')}
          </h2>
          <button type="button" className={styles.close} aria-label={t(labels, 'dialog.close')} onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <dl className={styles.list}>
          {rows.map((row) => (
            <div key={row.action} className={styles.row}>
              <dt className={styles.keys}>
                {row.keys.map((key) => (
                  <kbd key={key} className={styles.kbd}>
                    {key}
                  </kbd>
                ))}
              </dt>
              <dd className={styles.action}>{t(labels, row.action)}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby={toggleId}
          className={styles.toggle}
          data-cw-shortcuts-toggle=""
          onClick={() => onToggle(!enabled)}
        >
          <span id={toggleId}>{t(labels, 'shortcuts.singleKey')}</span>
          <span className={styles.state} aria-hidden="true">
            {t(labels, enabled ? 'shortcuts.on' : 'shortcuts.off')}
          </span>
        </button>
      </div>
    </Dialog>
  )
}

export type GlobalShortcutsOptions = {
  enabled: boolean
  onAction: (action: ShortcutAction) => void
}

function modalOpen(): boolean {
  return document.querySelector('dialog[open]') !== null
}

export function useGlobalShortcuts({ enabled, onAction }: GlobalShortcutsOptions): void {
  const fire = useEffectEvent((action: ShortcutAction) => onAction(action))
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      const action = shortcutFor(event, true)
      if (!action || modalOpen()) return
      event.preventDefault()
      fire(action)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
