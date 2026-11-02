'use client'

import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import styles from './Toast.module.scss'

export type ToastKind = 'success' | 'error'

type ToastItem = { id: number; kind: ToastKind; message: string; title?: string }

export type ToastApi = {
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  dismiss: (id: number) => void
}

const DURATION: Record<ToastKind, number> = { success: 5000, error: 8000 }

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ closeLabel, children }: { closeLabel: string; children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((item) => item.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string, title?: string) => {
      nextId.current += 1
      const id = nextId.current
      setItems((list) => [...list.slice(-2), { id, kind, message, title }])
      window.setTimeout(() => dismiss(id), DURATION[kind])
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, title) => push('success', message, title),
      error: (message, title) => push('error', message, title),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext value={api}>
      {children}
      <div className={styles.region} aria-live="polite" aria-relevant="additions">
        {items.map((item) => (
          <div
            key={item.id}
            role={item.kind === 'error' ? 'alert' : 'status'}
            data-cw-glass="strong"
            className={cx(styles.toast, styles[item.kind])}
          >
            <Icon name={item.kind === 'error' ? 'alert' : 'check'} className={styles.icon} />
            <div className={styles.text}>
              {item.title ? <p className={styles.title}>{item.title}</p> : null}
              <p>{item.message}</p>
            </div>
            <button type="button" className={styles.close} onClick={() => dismiss(item.id)} aria-label={closeLabel}>
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}

export function useToast(): ToastApi {
  const api = use(ToastContext)
  if (!api) throw new Error('useToast() debe usarse dentro de <ToastProvider>')
  return api
}
