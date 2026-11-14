'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import {
  FUN_BYE_MS,
  FUN_CALM_AFTER_MS,
  FUN_GUIDE_AFTER,
  FUN_GUIDE_ARRIVE_MS,
  FUN_GUIDE_CHEER_MS,
  FUN_GUIDE_GIVE_UP_MS,
  FUN_GUIDE_GRACE_MS,
  FUN_GUIDE_HUSH_MS,
  FUN_GUIDE_JUMP_MS,
  FUN_GUIDE_TAP_MS,
  FUN_POKE_MS,
  FUN_POKE_RADIUS,
  FUN_POWER_AT_MS,
  FUN_POWER_MS,
  FUN_RUN_SPEED,
} from '@/content/fun'
import { useMediaQuery } from '@/lib/fx/viewport'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translate'
import { BuddySprite } from './BuddySprite'
import { funDictionary } from './dictionary'
import { findTarget, pageBusy, readInteraction, useGuideRoute } from './guide'
import {
  activity,
  approach,
  begLine,
  besideBox,
  bubbleAlign,
  canAnnounce,
  clampToView,
  closestPoint,
  countsAsInteraction,
  facingOf,
  followTarget,
  GUIDE_START,
  inAiLab,
  levelFor,
  nearestBox,
  nextGuide,
  nextPhase,
  paceFor,
  pickGuideLine,
  pickLine,
  recordWake,
  runToward,
  settled,
  standNear,
  type Box,
  type Facing,
  type FunEvent,
  type FunPhase,
  type Guide,
  type GuideEvent,
  type Point,
  type Size,
} from './logic'
import { SPRITE_SCALE, SPRITE_VIEWBOX } from './sprite'
import styles from './Buddy.module.scss'

export type BuddyProps = {
  lang: Locale
  origin: Point
  wakes: number
  bindPress: (handler: (() => void) | null) => void
  onCalmable: () => void
  onGone: () => void
}

type Line = { id: number; text: string }

type Tap = { id: number; x: number; y: number }

type Transient = 'poke' | 'beg' | 'cheer'

type Trip = { startedAt: number; spot: Point | null; tapped: boolean }

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

const SIZE: Size = { width: SPRITE_VIEWBOX.width * SPRITE_SCALE, height: SPRITE_VIEWBOX.height * SPRITE_SCALE }

const BOUNDS = { top: 84, margin: 4 }

const POKEABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"]'

const IGNORED = '[data-cw-fun], [data-cw-no-tocar], [aria-hidden="true"], [inert]'

const TAP_MS = 700

const MAX_TAPS = 4

export function wakeUp(): number {
  let storage: Storage | null = null
  try {
    storage = window.localStorage
  } catch {}
  return recordWake(storage)
}

function viewport(): Size {
  return { width: window.innerWidth, height: window.innerHeight }
}

function pokeable(): Box[] {
  const view = viewport()
  const boxes: Box[] = []
  for (const element of document.querySelectorAll(POKEABLE)) {
    if (element.closest(IGNORED)) continue
    const rect = element.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0 || rect.bottom < 0 || rect.right < 0 || rect.top > view.height || rect.left > view.width) continue
    boxes.push({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })
  }
  return boxes
}

export function Buddy({ lang, origin, wakes, bindPress, onCalmable, onGone }: BuddyProps) {
  const dict = useMemo(() => funDictionary(lang), [lang])
  const level = levelFor(wakes)
  const reduced = useMediaQuery(REDUCED_MOTION)
  const { pathname, goToLab } = useGuideRoute(lang)

  const [phase, setPhase] = useState<FunPhase>('awake')
  const [line, setLine] = useState<Line | null>(null)
  const [live, setLive] = useState('')
  const [transient, setTransient] = useState<Transient | null>(null)
  const [powering, setPowering] = useState(false)
  const [powered, setPowered] = useState(false)
  const [taps, setTaps] = useState<Tap[]>([])

  const layerRef = useRef<HTMLDivElement>(null)
  const actorRef = useRef<HTMLDivElement>(null)
  const guide = useRef<Guide>(GUIDE_START)
  const trip = useRef<Trip | null>(null)
  const kick = useRef<(() => void) | null>(null)
  const tapRef = useRef<(() => void) | null>(null)
  const stepRef = useRef<(event: GuideEvent) => void>(() => {})
  const pathRef = useRef(pathname)
  const hushUntil = useRef(0)
  const phaseRef = useRef<FunPhase>('awake')
  const startAt = useRef(0)
  const lastAnnounce = useRef<number | null>(null)
  const previousLine = useRef<number | null>(null)
  const begs = useRef(0)
  const sequence = useRef(0)
  const transientSeq = useRef(0)
  const timers = useRef(new Set<number>())
  const callbacks = useRef({ onCalmable, onGone })
  const start = useMemo(() => ({ x: origin.x - SIZE.width / 2, y: origin.y - SIZE.height - 12 }), [origin])
  const position = useRef<Point>(start)
  const target = useRef<Point>(start)
  const facing = useRef<Facing>('right')
  const rate = useRef(paceFor(level, false).rate)

  const act = activity(phase, reduced)
  const pace = paceFor(level, powered)

  useEffect(() => {
    callbacks.current = { onCalmable, onGone }
  }, [onCalmable, onGone])

  useEffect(() => {
    rate.current = pace.rate
  }, [pace.rate])

  useEffect(() => {
    startAt.current = Date.now()
    const pending = timers.current
    return () => {
      for (const id of pending) window.clearTimeout(id)
      pending.clear()
    }
  }, [])

  const later = useCallback((run: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      run()
    }, ms)
    timers.current.add(id)
  }, [])

  const say = useCallback(
    (text: string, force: boolean) => {
      sequence.current += 1
      setLine({ id: sequence.current, text })
      const now = Date.now()
      if (force || canAnnounce(now, lastAnnounce.current)) {
        lastAnnounce.current = now
        setLive(text)
      }
    },
    [setLine, setLive],
  )

  const flash = useCallback(
    (pose: Transient, ms: number) => {
      transientSeq.current += 1
      const mine = transientSeq.current
      setTransient(pose)
      later(() => {
        if (transientSeq.current === mine) setTransient(null)
      }, ms)
    },
    [later, setTransient],
  )

  const addTap = useCallback(
    (spot: Point) => {
      sequence.current += 1
      const tap = { id: sequence.current, x: spot.x, y: spot.y }
      setTaps((list) => [...list.slice(1 - MAX_TAPS), tap])
      later(() => setTaps((list) => list.filter((item) => item.id !== tap.id)), TAP_MS)
    },
    [later, setTaps],
  )

  const endTrip = useCallback(() => {
    trip.current = null
    const actor = actorRef.current
    if (!actor) return
    delete actor.dataset.at
    actor.style.removeProperty('--fun-at-x')
    actor.style.removeProperty('--fun-at-y')
  }, [])

  const tapLab = useCallback(() => {
    const current = trip.current
    const actor = actorRef.current
    if (!current || current.tapped || !actor) return
    current.tapped = true
    const spot = current.spot ?? findTarget(viewport())?.spot ?? null
    if (spot) {
      const rect = actor.getBoundingClientRect()
      facing.current = facingOf({ x: rect.left + rect.width / 2, y: spot.y }, spot, facing.current)
      actor.dataset.facing = facing.current
      addTap(spot)
    }
    flash('poke', FUN_POKE_MS)
    const wait = Math.max(FUN_GUIDE_TAP_MS, FUN_GUIDE_GRACE_MS - (Date.now() - current.startedAt))
    later(() => {
      if (trip.current !== current) return
      goToLab()
      later(() => {
        if (trip.current === current) endTrip()
      }, FUN_GUIDE_ARRIVE_MS)
    }, wait)
  }, [addTap, flash, later, goToLab, endTrip])

  const startTrip = useCallback(() => {
    const view = viewport()
    const found = findTarget(view)
    const current: Trip = { startedAt: Date.now(), spot: found?.spot ?? null, tapped: false }
    trip.current = current
    say(t(dict, 'fun.guide.go'), true)
    later(() => {
      if (trip.current === current) tapRef.current?.()
    }, FUN_GUIDE_GIVE_UP_MS)
    if (!reduced) {
      kick.current?.()
      return
    }
    const actor = actorRef.current
    if (actor && found) {
      const goal = clampToView(standNear(found.target, SIZE, view, BOUNDS), SIZE, view, BOUNDS)
      actor.style.setProperty('--fun-at-x', `${goal.x.toFixed(1)}px`)
      actor.style.setProperty('--fun-at-y', `${goal.y.toFixed(1)}px`)
      actor.dataset.at = ''
    }
    later(() => {
      if (trip.current === current) tapRef.current?.()
    }, FUN_GUIDE_JUMP_MS)
  }, [dict, reduced, say, later])

  const celebrate = useCallback(
    (arrived: boolean) => {
      endTrip()
      hushUntil.current = Date.now() + FUN_GUIDE_HUSH_MS
      flash('cheer', FUN_GUIDE_CHEER_MS)
      say(arrived ? t(dict, `fun.guide.line.${pickGuideLine(Math.random)}`) : t(dict, 'fun.guide.here'), true)
    },
    [dict, endTrip, flash, say],
  )

  const stepGuide = useCallback(
    (event: GuideEvent) => {
      const outcome = nextGuide(guide.current, event)
      guide.current = outcome.guide
      const layer = layerRef.current
      if (layer) layer.dataset.guide = outcome.guide.status
      if (outcome.action === 'run') startTrip()
      else if (outcome.action === 'celebrate') celebrate(event.type === 'arrived')
      else if (event.type === 'stop' && trip.current) endTrip()
    },
    [startTrip, celebrate, endTrip],
  )

  useEffect(() => {
    stepRef.current = stepGuide
    tapRef.current = tapLab
  }, [stepGuide, tapLab])

  useEffect(() => {
    const layer = layerRef.current
    if (layer) layer.dataset.guide = guide.current.status
  }, [])

  useEffect(() => {
    pathRef.current = pathname
    if (guide.current.status === 'running' && inAiLab(pathname)) stepRef.current({ type: 'arrived' })
  }, [pathname])

  useEffect(() => {
    const onInput = (event: PointerEvent | KeyboardEvent) => {
      if (!countsAsInteraction(readInteraction(event))) return
      const path = pathRef.current
      const inLab = inAiLab(path)
      const last = guide.current.status === 'counting' && guide.current.count + 1 >= FUN_GUIDE_AFTER
      const blocked = last && !inLab && (pageBusy(path) || findTarget(viewport()) === null)
      stepRef.current({ type: 'interaction', phase: phaseRef.current, inLab, blocked })
    }
    window.addEventListener('pointerdown', onInput, { capture: true, passive: true })
    window.addEventListener('keydown', onInput, { capture: true })
    return () => {
      window.removeEventListener('pointerdown', onInput, { capture: true })
      window.removeEventListener('keydown', onInput, { capture: true })
    }
  }, [])

  const dispatch = useCallback(
    (event: FunEvent) => {
      const elapsed = Date.now() - startAt.current
      const outcome = nextPhase(phaseRef.current, event)
      if (outcome.phase !== phaseRef.current) {
        phaseRef.current = outcome.phase
        setPhase(outcome.phase)
      }
      if (outcome.phase !== 'awake') stepRef.current({ type: 'stop' })
      if (outcome.reply === 'sulk') say(t(dict, 'fun.sulk'), true)
      else if (outcome.reply === 'free') say(t(dict, 'fun.free'), true)
      else if (outcome.reply === 'beg') {
        const beg = begLine(begs.current, elapsed)
        begs.current += 1
        say(beg.key === 'line' ? t(dict, `fun.line.${beg.line}`) : t(dict, 'fun.beg', { seconds: beg.seconds }), true)
        flash('beg', 1_400)
      } else if (outcome.reply === 'bye') {
        say(t(dict, 'fun.bye'), true)
        later(() => callbacks.current.onGone(), FUN_BYE_MS)
      }
    },
    [dict, say, flash, later, setPhase],
  )

  useEffect(() => {
    bindPress(() => dispatch({ type: 'press', elapsedMs: Date.now() - startAt.current }))
    return () => bindPress(null)
  }, [bindPress, dispatch])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch({ type: 'escape' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  useEffect(() => {
    later(() => say(t(dict, 'fun.warned'), true), 120)
    if (wakes >= 2) later(() => say(t(dict, 'fun.back'), false), 3_200)
    later(() => callbacks.current.onCalmable(), FUN_CALM_AFTER_MS)
    later(() => {
      if (phaseRef.current !== 'awake') return
      setPowering(true)
      say(t(dict, 'fun.power'), false)
      later(() => {
        setPowering(false)
        setPowered(true)
      }, FUN_POWER_MS)
    }, FUN_POWER_AT_MS)
  }, [dict, wakes, say, later])

  useEffect(() => {
    if (!act.lines) return
    const id = window.setInterval(() => {
      if (trip.current || Date.now() < hushUntil.current) return
      const next = pickLine({ level, elapsedMs: Date.now() - startAt.current, previous: previousLine.current, random: Math.random })
      previousLine.current = next
      say(t(dict, `fun.line.${next}`, { level }), false)
    }, pace.lineMs)
    return () => window.clearInterval(id)
  }, [act.lines, pace.lineMs, level, dict, say])

  useEffect(() => {
    if (!act.pokes) return
    const id = window.setInterval(() => {
      const actor = actorRef.current
      if (!actor || trip.current) return
      const here = position.current
      const hand = { x: here.x + (facing.current === 'right' ? SIZE.width * 0.85 : SIZE.width * 0.15), y: here.y + SIZE.height * 0.6 }
      const boxes = pokeable()
      const index = nearestBox(hand, boxes, FUN_POKE_RADIUS)
      if (index === null) return
      const spot = closestPoint(hand, boxes[index]!)
      facing.current = facingOf({ x: here.x + SIZE.width / 2, y: hand.y }, spot, facing.current)
      actor.dataset.facing = facing.current
      flash('poke', FUN_POKE_MS)
      addTap(spot)
    }, pace.pokeMs)
    return () => window.clearInterval(id)
  }, [act.pokes, pace.pokeMs, flash, addTap])

  useEffect(() => {
    if (!act.chase) return
    const actor = actorRef.current
    if (!actor) return
    let frame = 0
    let last = 0

    const tick = (now: number) => {
      const dt = last ? now - last : 16
      last = now
      const view = viewport()
      const current = trip.current
      const running = current !== null && !current.tapped
      if (running) {
        const found = findTarget(view)
        if (found) {
          current.spot = found.spot
          target.current = standNear(found.target, SIZE, view, BOUNDS)
        }
      }
      const goal = clampToView(target.current, SIZE, view, BOUNDS)
      const before = position.current
      const step = running ? runToward(before, goal, dt, FUN_RUN_SPEED) : approach(before, goal, dt, rate.current)
      const next = clampToView(step, SIZE, view, BOUNDS)
      const turned = facingOf(before, next, facing.current)
      if (turned !== facing.current) {
        facing.current = turned
        actor.dataset.facing = turned
      }
      const speed = (Math.hypot(next.x - before.x, next.y - before.y) / Math.max(dt, 1)) * 1000
      if (speed > 40) actor.dataset.walking = ''
      else delete actor.dataset.walking
      position.current = next
      actor.style.transform = `translate3d(${next.x.toFixed(1)}px, ${next.y.toFixed(1)}px, 0)`
      actor.dataset.bubble = bubbleAlign(next.x, SIZE, view)
      if (settled(next, goal)) {
        frame = 0
        last = 0
        delete actor.dataset.walking
        if (running) tapRef.current?.()
        return
      }
      frame = window.requestAnimationFrame(tick)
    }

    const run = () => {
      if (frame) return
      last = 0
      frame = window.requestAnimationFrame(tick)
    }

    const onPointer = (event: PointerEvent) => {
      if (trip.current) return
      target.current = followTarget({ x: event.clientX, y: event.clientY }, SIZE, event.pointerType === 'touch')
      run()
    }

    const onFocus = (event: FocusEvent) => {
      if (trip.current) return
      const element = event.target
      if (!(element instanceof Element) || element.closest('[data-cw-fun]') || !element.matches(':focus-visible')) return
      const rect = element.getBoundingClientRect()
      target.current = besideBox({ left: rect.left, top: rect.top, width: rect.width, height: rect.height }, SIZE, viewport())
      run()
    }

    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('pointerdown', onPointer, { passive: true })
    document.addEventListener('focusin', onFocus)
    kick.current = run
    run()
    return () => {
      kick.current = null
      window.cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('focusin', onFocus)
      delete actor.dataset.walking
    }
  }, [act.chase])

  const pose = phase === 'sulking' ? 'sulk' : powering ? 'power' : (transient ?? 'idle')
  const layerStyle = { '--fun-bye': `${FUN_BYE_MS}ms` } as CSSProperties

  return createPortal(
    <div
      ref={layerRef}
      className={styles.layer}
      style={layerStyle}
      data-cw-fun=""
      data-phase={phase}
      data-reduced={reduced ? '' : undefined}
      data-animate={act.animate ? '' : undefined}
    >
      <div
        ref={actorRef}
        className={styles.actor}
        style={{ width: SIZE.width, height: SIZE.height, transform: `translate3d(${start.x}px, ${start.y}px, 0)` }}
        data-cw-fun-actor=""
        data-pose={pose}
      >
        {line ? (
          <p key={line.id} className={styles.bubble} aria-hidden="true" data-cw-fun-line="">
            {line.text}
          </p>
        ) : null}
        <div className={styles.figure} data-powered={powered ? '' : undefined}>
          <BuddySprite />
        </div>
      </div>
      {taps.map((tap) => (
        <span key={tap.id} className={styles.tap} style={{ left: tap.x, top: tap.y }} aria-hidden="true" data-cw-fun-tap="">
          {t(dict, 'fun.poke')}
        </span>
      ))}
      <p className="cw-visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-cw-fun-live="">
        {live}
      </p>
      <button
        type="button"
        className={styles.calm}
        aria-pressed={phase === 'sulking'}
        aria-keyshortcuts="Escape"
        data-cw-fun-calm=""
        onClick={() => dispatch({ type: 'toggle' })}
      >
        {t(dict, 'fun.calm')}
      </button>
    </div>,
    document.body,
  )
}
