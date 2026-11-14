'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { inPrivatePanel } from '@/components/shell/nav'
import type { Locale } from '@/lib/i18n/config'
import { centerOf, fitsView, guideTarget, type Box, type GuideTarget, type Interaction, type Point, type Size } from './logic'

export const AI_LAB_LINK = 'footer#footer [data-cw-footer-ai-lab]'

const DOCK_MENU = '[data-cw-dock-bar] [data-cw-menu-button]'

const DOCK_ITEMS = '[data-cw-dock-bar] > *'

const OWN = '[data-cw-fun], [data-cw-no-tocar]'

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

const DRAFTS =
  'main textarea, main input:not([type]), main input[type="text"], main input[type="email"], main input[type="search"], main input[type="url"], main input[type="tel"], main input[type="number"]'

export type FoundTarget = { target: GuideTarget; spot: Point }

function boxOf(element: Element | null): Box | null {
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}

export function readInteraction(event: PointerEvent | KeyboardEvent): Interaction {
  const target = event.target instanceof Element ? event.target : null
  const own = Boolean(target?.closest(OWN))
  if (event.type !== 'keydown') return { kind: 'pointer', trusted: event.isTrusted, own }
  const key = event as KeyboardEvent
  return { kind: 'key', trusted: event.isTrusted, own, key: key.key, repeat: key.repeat, typing: Boolean(target?.closest(EDITABLE)) }
}

export function pageBusy(pathname: string | null): boolean {
  if (inPrivatePanel(pathname)) return true
  const active = document.activeElement
  if (active instanceof Element && active.closest(EDITABLE)) return true
  if (document.querySelector('dialog[open]')) return true
  try {
    if (document.querySelector(':popover-open')) return true
  } catch {}
  for (const field of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(DRAFTS)) {
    if (!field.disabled && !field.readOnly && field.value.trim() !== '') return true
  }
  return false
}

export function findTarget(view: Size): FoundTarget | null {
  const link = boxOf(document.querySelector(AI_LAB_LINK))
  const menu = boxOf(document.querySelector(DOCK_MENU))
  const items = Array.from(document.querySelectorAll(DOCK_ITEMS), boxOf).filter((box): box is Box => fitsView(box, view))
  const dock = fitsView(menu, view) ? menu : (items.at(-1) ?? null)
  const target = guideTarget(link, dock, view)
  return target ? { target, spot: centerOf(target.box) } : null
}

export function useGuideRoute(lang: Locale): { pathname: string | null; goToLab: () => void } {
  const router = useRouter()
  const pathname = usePathname()
  const goToLab = useCallback(() => router.push(`/${lang}/ai-lab`), [router, lang])
  return { pathname, goToLab }
}
