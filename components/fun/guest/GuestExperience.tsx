'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AgentAvatar } from '@/components/ailab/agent/AgentAvatar'
import { askMiniCherced, HEARD_EVENT, POKE_EVENT } from '@/components/ailab/agent/open-global'
import type { GuestExperience as Experience } from '@/lib/ai/agent/guest'
import { GUEST_OFF_COOKIE } from '@/lib/ai/agent/guest-cookie'
import type { GuestAnimation } from '@/lib/ai/agent/guest-animations'
import { speak, speechEnv, type SpeechSession } from '@/lib/ailab/voice/tts'
import type { Locale } from '@/lib/i18n/config'
import { eggFor, foundStars, pageOf, STARS_KEY, WELCOME_KEY } from './logic'
import { GuestArt, HEART, Pixels } from './pixels'
import styles from './Guest.module.scss'

const COPY = {
  es: {
    menu: 'Tu rincón',
    star: 'Una estrella escondida',
    close: 'Cerrar',
    prepared: 'Lo que Camilo preparó para ti',
    preparedNote: 'Aquí está todo lo que preparó: la bienvenida, las sorpresas, las estrellas y el mensaje final. Si quieres que retire algo, escríbelo aquí y le llega a su buzón.',
    welcome: 'Bienvenida',
    eggs: 'Sorpresas y lo que las activa',
    touch: 'tocar a Mini Cherced donde no se debe',
    stars: 'Estrellas',
    finale: 'Mensaje final',
    withdrawLabel: '¿Qué quieres que retire?',
    withdraw: 'Quiero que retires algo',
    sent: 'Listo: le llegó a Camilo.',
    sendError: 'No se pudo enviar. Prueba otra vez.',
    exit: 'Salir del modo',
    exitNote: 'Ves el sitio normal sin cerrar tu sesión, y se borran las estrellas encontradas.',
    back: 'Volver a tu modo',
    replay: 'Ver la bienvenida otra vez',
    reset: 'Repetir la misión',
    listen: 'Escuchar',
    mute: 'Silenciar',
    found: 'Encontraste una estrella',
    progress: (found: number, total: number) => `${found} de ${total} estrellas`,
  },
  en: {
    menu: 'Your corner',
    star: 'A hidden star',
    close: 'Close',
    prepared: 'What Camilo prepared for you',
    preparedNote: 'Here is everything he prepared: the welcome, the surprises, the stars and the final message. If you want something removed, write it here and it reaches his inbox.',
    welcome: 'Welcome',
    eggs: 'Surprises and what triggers them',
    touch: 'poking Mini Cherced where you shouldn’t',
    stars: 'Stars',
    finale: 'Final message',
    withdrawLabel: 'What do you want removed?',
    withdraw: 'I want something removed',
    sent: 'Done: it reached Camilo.',
    sendError: 'It couldn’t be sent. Try again.',
    exit: 'Leave the mode',
    exitNote: 'You see the regular site without signing out, and the stars you found are cleared.',
    back: 'Back to your mode',
    replay: 'See the welcome again',
    reset: 'Play the quest again',
    listen: 'Listen',
    mute: 'Mute',
    found: 'You found a star',
    progress: (found: number, total: number) => `${found} of ${total} stars`,
  },
} as const

type Scene =
  | { kind: 'welcome' }
  | { kind: 'star'; id: string }
  | { kind: 'finale' }
  | { kind: 'menu' }

type Egg = { line: string; animation: GuestAnimation; label?: string; at: number }

const LINE_MS = 2600

const FINALE_MS = 4200

function reduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function readFound(): string[] {
  try {
    return foundStars(window.localStorage.getItem(STARS_KEY))
  } catch {
    return []
  }
}

function welcomeSeen(): boolean {
  try {
    return window.sessionStorage.getItem(WELCOME_KEY) === '1'
  } catch {
    return false
  }
}

function writeFound(ids: string[]) {
  try {
    if (ids.length) window.localStorage.setItem(STARS_KEY, JSON.stringify(ids))
    else window.localStorage.removeItem(STARS_KEY)
  } catch {}
}

function useReveal(total: number, step: number, running: boolean): number {
  const [shown, setShown] = useState(() => (reduced() ? total : 1))
  useEffect(() => {
    if (!running || shown >= total) return
    const timer = window.setTimeout(() => setShown((value) => value + 1), step)
    return () => window.clearTimeout(timer)
  }, [running, shown, step, total])
  return shown
}

function Dialog({ title, onClose, children, dark }: { title: string; onClose: () => void; children: ReactNode; dark?: boolean }) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      before?.focus?.()
    }
  }, [onClose])
  return createPortal(
    <div className={styles.backdrop} data-dark={dark ? '' : undefined}>
      <div ref={ref} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} data-cw-guest-dialog="">
        <h2 id={titleId} className="cw-visually-hidden">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function Lines({ lines, step, label }: { lines: readonly string[]; step: number; label: string }) {
  const shown = useReveal(lines.length, step, true)
  return (
    <div className={styles.lines} aria-live="polite" aria-label={label}>
      {lines.slice(0, shown).map((line, index) => (
        <p key={index} className={styles.line}>
          {line}
        </p>
      ))}
    </div>
  )
}

export function GuestExperience({ lang, experience }: { lang: Locale; experience: Experience }) {
  const copy = COPY[lang]
  const pathname = usePathname()
  const [scene, setScene] = useState<Scene | null>(() => (welcomeSeen() ? null : { kind: 'welcome' }))
  const [found, setFound] = useState<string[]>(() => readFound())
  const [egg, setEgg] = useState<Egg | null>(null)
  const [height, setHeight] = useState(0)
  const [voice, setVoice] = useState(true)
  const [sent, setSent] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [withdraw, setWithdraw] = useState('')
  const cooldown = useRef(new Map<string, number>())
  const speech = useRef<SpeechSession | null>(null)
  const total = experience.stars.length

  useEffect(() => {
    try {
      window.sessionStorage.setItem(WELCOME_KEY, '1')
    } catch {}
  }, [])

  useEffect(() => {
    const measure = () => setHeight(document.documentElement.scrollHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [pathname])

  const fire = useCallback(
    (key: string, next: Omit<Egg, 'at'>) => {
      const now = Date.now()
      if (now - (cooldown.current.get(key) ?? 0) < 20_000) return
      cooldown.current.set(key, now)
      setEgg({ ...next, at: now })
    },
    [],
  )

  useEffect(() => {
    const onHeard = (event: Event) => {
      const text = (event as CustomEvent<{ text?: unknown }>).detail?.text
      if (typeof text !== 'string') return
      const hit = eggFor(experience.eggs, text)
      if (hit) fire(hit.id, { line: hit.line, animation: hit.animation, label: hit.label })
    }
    const onPoke = () => {
      const hit = experience.eggs.find((item) => item.touch)
      if (hit) fire(hit.id, { line: hit.line, animation: hit.animation, label: hit.label })
    }
    window.addEventListener(HEARD_EVENT, onHeard)
    window.addEventListener(POKE_EVENT, onPoke)
    return () => {
      window.removeEventListener(HEARD_EVENT, onHeard)
      window.removeEventListener(POKE_EVENT, onPoke)
    }
  }, [experience.eggs, fire])

  useEffect(() => {
    if (!egg) return
    const timer = window.setTimeout(() => setEgg(null), 9000)
    return () => window.clearTimeout(timer)
  }, [egg])

  const stopSpeech = () => {
    speech.current?.stop()
    speech.current = null
  }

  useEffect(() => {
    if (scene?.kind !== 'finale' || !voice) return
    const env = speechEnv()
    if (!env) return
    speech.current = speak(experience.finale.lines.join('\n\n'), { lang: 'es', env, rate: 0.95 })
    return () => stopSpeech()
  }, [experience.finale.lines, scene, voice])

  const closeScene = useCallback(() => {
    stopSpeech()
    setScene((current) => {
      if (current?.kind === 'star' && readFound().length >= total && total > 0) return { kind: 'finale' }
      return null
    })
  }, [total])

  const takeStar = (id: string) => {
    const next = [...new Set([...readFound(), id])]
    writeFound(next)
    setFound(next)
    setScene({ kind: 'star', id })
  }

  const exitMode = () => {
    writeFound([])
    document.cookie = `${GUEST_OFF_COOKIE}=1; path=/; samesite=lax`
    window.location.reload()
  }

  const sendWithdraw = async () => {
    if (withdraw.trim().length < 3) return
    setSent('sending')
    try {
      const response = await fetch('/api/guest/withdraw', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: withdraw }) })
      setSent(response.ok ? 'sent' : 'error')
      if (response.ok) setWithdraw('')
    } catch {
      setSent('error')
    }
  }

  const page = pageOf(pathname)
  const here = experience.stars.filter((star) => star.page === page && !found.includes(star.id))
  const star = scene?.kind === 'star' ? experience.stars.find((item) => item.id === scene.id) : undefined

  return (
    <>
      {here.length && height
        ? createPortal(
            <div className={styles.starLayer} style={{ height }} data-cw-guest-stars="">
              {here.map((item) => (
                <button key={item.id} type="button" className={styles.star} style={{ left: `${item.x}%`, top: `${item.y}%` }} aria-label={copy.star} onClick={() => takeStar(item.id)} data-cw-guest-star="">
                  <svg viewBox="0 0 7 7" width="28" height="28" shapeRendering="crispEdges" aria-hidden="true">
                    <path d="M3 0h1v2h3v1h-1v1h1v3h-1v-1h-1v-1h-1v1h-1v1h-1v1h-1v-3h1v-1h-1v-1h3z" fill="#ffd23f" />
                  </svg>
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}

      <button type="button" className={styles.chip} onClick={() => setScene({ kind: 'menu' })} aria-label={`${copy.menu}: ${copy.progress(found.length, total)}`} data-cw-guest-chip="">
        <Pixels sprite={HEART} size={2} /> {found.length}/{total}
      </button>

      {egg ? (
        <div className={styles.egg} role="status" aria-live="polite" data-cw-guest-egg="">
          <GuestArt animation={egg.animation} label={egg.label} />
          <p className={styles.line}>{egg.line}</p>
          <button type="button" className={styles.close} onClick={() => setEgg(null)} aria-label={copy.close}>
            ×
          </button>
        </div>
      ) : null}

      {scene?.kind === 'welcome' ? (
        <Dialog title={copy.welcome} onClose={closeScene}>
          <div className={styles.stage}>
            <AgentAvatar />
            <GuestArt animation="hearts" />
          </div>
          <Lines lines={experience.welcome.lines} step={LINE_MS} label={copy.welcome} />
          <div className={styles.options}>
            {experience.welcome.options.map((option) => (
              <button
                key={option}
                type="button"
                className={styles.option}
                onClick={() => {
                  setScene(null)
                  askMiniCherced(option)
                }}
                data-cw-guest-option=""
              >
                {option}
              </button>
            ))}
            <button type="button" className={styles.ghost} onClick={closeScene}>
              {copy.close}
            </button>
          </div>
        </Dialog>
      ) : null}

      {star ? (
        <Dialog title={star.title} onClose={closeScene}>
          <p className={styles.kicker}>
            {copy.found} · {star.title}
          </p>
          <GuestArt animation={star.animation} />
          <p className={styles.line}>{star.line}</p>
          <div className={styles.options}>
            <button type="button" className={styles.option} onClick={closeScene} data-cw-guest-star-close="">
              {copy.close}
            </button>
          </div>
        </Dialog>
      ) : null}

      {scene?.kind === 'finale' ? (
        <Dialog title={copy.finale} onClose={closeScene} dark>
          <GuestArt animation="finale" />
          <Lines lines={experience.finale.lines} step={FINALE_MS} label={copy.finale} />
          <div className={styles.options}>
            <button type="button" className={styles.ghost} onClick={() => setVoice((value) => !value)} aria-pressed={voice}>
              {voice ? copy.mute : copy.listen}
            </button>
            <button type="button" className={styles.option} onClick={closeScene}>
              {copy.close}
            </button>
          </div>
        </Dialog>
      ) : null}

      {scene?.kind === 'menu' ? (
        <Dialog title={copy.prepared} onClose={closeScene}>
          <div className={styles.menu} data-cw-guest-menu="">
            <h3>{copy.prepared}</h3>
            <p className={styles.note}>{copy.preparedNote}</p>
            <p className={styles.kicker}>{copy.progress(found.length, total)}</p>
            <details>
              <summary>{copy.welcome}</summary>
              {experience.welcome.lines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </details>
            <details>
              <summary>{copy.eggs}</summary>
              <ul>
                {experience.eggs.map((item) => (
                  <li key={item.id}>
                    <strong>{item.touch ? copy.touch : item.words.map((word) => `«${word}»`).join(', ')}</strong>: {item.line}
                  </li>
                ))}
              </ul>
            </details>
            <details>
              <summary>{copy.stars}</summary>
              <ul>
                {experience.stars.map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong>: {item.line}
                  </li>
                ))}
              </ul>
            </details>
            <details>
              <summary>{copy.finale}</summary>
              {experience.finale.lines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </details>
            <label className={styles.field}>
              {copy.withdrawLabel}
              <textarea rows={3} maxLength={1000} value={withdraw} onChange={(event) => setWithdraw(event.target.value)} />
            </label>
            <div className={styles.options}>
              <button type="button" className={styles.option} disabled={sent === 'sending' || withdraw.trim().length < 3} onClick={() => void sendWithdraw()} data-cw-guest-withdraw="">
                {copy.withdraw}
              </button>
            </div>
            {sent === 'sent' ? <p role="status">{copy.sent}</p> : sent === 'error' ? <p role="alert">{copy.sendError}</p> : null}
            <div className={styles.options}>
              <button type="button" className={styles.ghost} onClick={() => setScene({ kind: 'welcome' })}>
                {copy.replay}
              </button>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => {
                  writeFound([])
                  setFound([])
                }}
              >
                {copy.reset}
              </button>
              <button type="button" className={styles.ghost} onClick={exitMode} aria-describedby="guest-exit-note" data-cw-guest-exit="">
                {copy.exit}
              </button>
              <button type="button" className={styles.option} onClick={closeScene}>
                {copy.close}
              </button>
            </div>
            <p id="guest-exit-note" className={styles.note}>
              {copy.exitNote}
            </p>
          </div>
        </Dialog>
      ) : null}
    </>
  )
}

export function GuestBack({ lang }: { lang: Locale }) {
  return (
    <button
      type="button"
      className={styles.chip}
      onClick={() => {
        document.cookie = `${GUEST_OFF_COOKIE}=; path=/; max-age=0; samesite=lax`
        window.location.reload()
      }}
      data-cw-guest-back=""
    >
      <Pixels sprite={HEART} size={2} /> {COPY[lang].back}
    </button>
  )
}

export default GuestExperience
