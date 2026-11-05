'use client'

import { useLayoutEffect } from 'react'
import { decideWink, finishWink } from './wink'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function finished(element: HTMLElement): boolean {
  if (typeof element.getAnimations !== 'function') return false
  const animations = element.getAnimations()
  return animations.length > 0 && animations.every((animation) => animation.playState === 'finished')
}

export function WinkPlayer({ scope }: { scope: string }) {
  useLayoutEffect(() => {
    const root = document.documentElement
    const state = decideWink({
      root,
      storage: () => window.sessionStorage,
      reducedMotion: () => window.matchMedia(REDUCED_MOTION).matches,
    })
    if (state !== 'play') return
    const host = document.querySelector<HTMLElement>(scope)
    const last = host?.querySelector<HTMLElement>('[data-cw-wink-last]') ?? null
    if (!host || !last || finished(last)) {
      finishWink(root)
      return
    }
    const onEnd = (event: AnimationEvent) => {
      if (event.target === last) finishWink(root)
    }
    host.addEventListener('animationend', onEnd)
    return () => {
      host.removeEventListener('animationend', onEnd)
      window.setTimeout(() => {
        if (!host.isConnected) finishWink(root)
      }, 0)
    }
  }, [scope])

  return null
}
