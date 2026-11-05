'use client'

import {
  useEffect,
  useEffectEvent,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { SHEET_DRAG_VAR, attachSheetDrag } from '@/lib/fx/sheet'
import { useSwipe, type SwipeDirection } from '@/lib/fx/swipe'
import { useKeyboardInset } from '@/lib/fx/viewport'
import styles from './BottomSheet.module.scss'
import { cx } from './cx'
import { Icon } from './Icon'

export const SHEET_CLOSE_FALLBACK_MS = 420

export type BottomSheetNavLabels = { prev: string; next: string }

export type BottomSheetProps = {
  open: boolean
  onClose: () => void
  labelledBy: string
  closeLabel: string
  children: ReactNode
  title?: ReactNode
  describedBy?: string
  onSwipe?: (direction: SwipeDirection) => void
  navLabels?: BottomSheetNavLabels
  counter?: ReactNode
  initialFocus?: RefObject<HTMLElement | null>
  className?: string
  bodyClassName?: string
}

function focusTarget(dialog: HTMLDialogElement, labelledBy: string, initial?: RefObject<HTMLElement | null>): HTMLElement {
  const preferred = initial?.current
  if (preferred && dialog.contains(preferred)) return preferred
  const heading = dialog.querySelector<HTMLElement>(`[id="${CSS.escape(labelledBy)}"]`)
  if (heading) {
    if (heading.tabIndex < 0 && !heading.hasAttribute('tabindex')) heading.tabIndex = -1
    return heading
  }
  return dialog
}

export function BottomSheet({
  open,
  onClose,
  labelledBy,
  closeLabel,
  children,
  title,
  describedBy,
  onSwipe,
  navLabels,
  counter,
  initialFocus,
  className,
  bodyClassName,
}: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const closingRef = useRef(false)
  const openRef = useRef(open)
  const keyboard = useKeyboardInset()

  const requestClose = useEffectEvent(() => {
    onClose()
    requestAnimationFrame(() => {
      if (openRef.current) ref.current?.style.setProperty(SHEET_DRAG_VAR, '0px')
    })
  })
  const focusInitial = useEffectEvent((dialog: HTMLDialogElement) => {
    focusTarget(dialog, labelledBy, initialFocus).focus({ preventScroll: true })
  })

  useEffect(() => {
    openRef.current = open
    const dialog = ref.current
    if (!dialog) return
    let timer = 0
    const finish = () => {
      window.clearTimeout(timer)
      dialog.removeEventListener('transitionend', onEnd)
      if (openRef.current || !dialog.open) return
      closingRef.current = true
      dialog.close()
      closingRef.current = false
      dialog.removeAttribute('data-state')
      const trigger = triggerRef.current
      triggerRef.current = null
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
    const onEnd = (event: TransitionEvent) => {
      if (event.target === dialog && (event.propertyName === 'transform' || event.propertyName === 'opacity')) finish()
    }

    if (open) {
      dialog.removeAttribute('data-state')
      if (!dialog.open) {
        const active = document.activeElement
        triggerRef.current = active instanceof HTMLElement && active !== document.body ? active : null
        dialog.style.setProperty(SHEET_DRAG_VAR, '0px')
        dialog.showModal()
        focusInitial(dialog)
      }
      return
    }

    if (!dialog.open) return
    dialog.setAttribute('data-state', 'closing')
    dialog.addEventListener('transitionend', onEnd)
    timer = window.setTimeout(finish, SHEET_CLOSE_FALLBACK_MS)
    return () => {
      window.clearTimeout(timer)
      dialog.removeEventListener('transitionend', onEnd)
    }
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const onCancel = (event: Event) => {
      event.preventDefault()
      requestClose()
    }
    const onNativeClose = () => {
      if (closingRef.current) return
      dialog.removeAttribute('data-state')
      if (openRef.current) requestClose()
    }
    dialog.addEventListener('cancel', onCancel)
    dialog.addEventListener('close', onNativeClose)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      dialog.removeEventListener('close', onNativeClose)
    }
  }, [])

  useEffect(() => {
    const top = topRef.current
    const dialog = ref.current
    if (!top || !dialog) return
    return attachSheetDrag(top, dialog, () => requestClose())
  }, [])

  useSwipe(bodyRef, {
    enabled: Boolean(onSwipe),
    onPrev: () => onSwipe?.('prev'),
    onNext: () => onSwipe?.('next'),
  })

  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    const inside =
      event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
    if (!inside) requestClose()
  }

  const style = keyboard > 0 ? ({ '--cw-keyboard-inset': `${keyboard}px` } as CSSProperties) : undefined

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-modal="true"
      data-cw-sheet=""
      data-cw-glass="strong"
      data-cw-blur=""
      className={cx(styles.sheet, className)}
      style={style}
      onClick={closeOnBackdrop}
    >
      <div ref={topRef} className={styles.top} data-cw-sheet-drag="">
        <span className={styles.grip} aria-hidden="true" />
        <div className={styles.bar}>
          {title ? (
            <h2 id={labelledBy} className={styles.title} tabIndex={-1}>
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button type="button" className={styles.close} aria-label={closeLabel} data-cw-sheet-close="" onClick={() => requestClose()}>
            <Icon name="close" />
          </button>
        </div>
      </div>
      <div ref={bodyRef} className={cx(styles.body, bodyClassName)} data-cw-sheet-body="">
        {children}
      </div>
      {onSwipe && navLabels ? (
        <div className={styles.nav} data-cw-sheet-nav="">
          <button type="button" className={styles.navButton} data-cw-sheet-prev="" onClick={() => onSwipe('prev')}>
            <Icon name="back" size={18} />
            <span>{navLabels.prev}</span>
          </button>
          {counter ? (
            <p className={styles.counter} aria-live="polite">
              {counter}
            </p>
          ) : null}
          <button type="button" className={styles.navButton} data-cw-sheet-next="" onClick={() => onSwipe('next')}>
            <span>{navLabels.next}</span>
            <Icon name="back" size={18} className={styles.flip} />
          </button>
        </div>
      ) : null}
    </dialog>
  )
}
