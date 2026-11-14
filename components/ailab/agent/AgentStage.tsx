'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { pixelFont } from '@/styles/fonts'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { agentCopy, type AgentCopy } from '@/content/ailab/agent'
import { AGENT_SESSION_ENDPOINT, AGENT_VOICE, isAgentGrant, isAgentStatus, type AgentMode } from '@/lib/ai/agent/config'
import { openLiveSession, type LiveSession } from '@/lib/ai/agent/live'
import { startMic, type MicHandle } from '@/lib/ai/agent/mic'
import { OUTPUT_RATE } from '@/lib/ai/agent/pcm'
import { createPlayer, type AudioPlayer } from '@/lib/ai/agent/player'
import { intentOf, simulatorGreeting, simulatorReply } from '@/lib/ai/agent/simulator'
import { createToolRunner, SEARCH_TOOL, type AgentSearchHit, type AgentToolCall, type AgentToolEffect } from '@/lib/ai/agent/tools'
import {
  addTool,
  closeTurn,
  createTrace,
  markAnswer,
  markAsked,
  markAudio,
  markHeard,
  markInterrupted,
  markUsage,
  pendingTurn,
  type Trace,
  type TraceTool,
} from '@/lib/ai/agent/trace'
import { addTurn, appendChunk, closeTurns, lastAgentLine, type Turn } from '@/lib/ai/agent/transcript'
import { loadSearchIndex } from '@/lib/search/client'
import { AgentAvatar } from './AgentAvatar'
import { TracePanel } from './TracePanel'
import { AVATAR_VIEWBOX, isCrotch, mouthFor } from './avatar-sprite'
import styles from './Agent.module.scss'

type Phase = 'checking' | 'idle' | 'consent' | 'connecting' | 'live' | 'ended'

type Activity = 'idle' | 'listening' | 'thinking' | 'speaking'

type Notice = keyof AgentCopy['errors'] | 'expired' | null

const METER_BARS = 12

const NAVIGATE_WAIT_MS = 8000

const BUBBLE_MAX = 180

const DODGE_MS = 520

const SHOCK_MS = 2200

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match)
}

function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function bubbleText(text: string): string {
  return text.length > BUBBLE_MAX ? `…${text.slice(-BUBBLE_MAX)}` : text
}

const UNAVAILABLE = /credit|billing|quota|exhaust|resource/i

function closeNotice(reason: 'ended' | 'expired' | 'error', detail?: string): Notice {
  if (reason === 'ended') return null
  if (detail && UNAVAILABLE.test(detail)) return 'unavailable'
  return reason === 'expired' ? 'expired' : 'connection'
}

function traceTool(call: AgentToolCall, effect: AgentToolEffect, response: Record<string, unknown>, ms: number): TraceTool {
  const base = { name: call.name, args: call.args, ms: Math.round(ms) }
  if (effect?.kind === 'search') {
    return { ...base, result: { kind: 'search', hits: effect.hits.map((hit) => ({ title: hit.titulo, url: hit.ruta, score: hit.score })) } }
  }
  if (effect?.kind === 'open') return { ...base, result: { kind: 'open', path: effect.path } }
  if (response.ok === false) return { ...base, result: { kind: 'open', path: null } }
  return { ...base, result: { kind: 'error', error: typeof response.error === 'string' ? response.error : 'unknown' } }
}

function replyError(reply: unknown): Notice {
  if (!reply || typeof reply !== 'object') return 'failed'
  const value = reply as Record<string, unknown>
  if (value.error === 'rate_limited') return 'rate_limited'
  if (value.error === 'daily_cap') return 'daily_cap'
  if (value.error === 'unavailable') return 'unavailable'
  if (value.mode === 'off') return 'off'
  return 'failed'
}

export default function AgentStage({ lang }: LabDemoProps) {
  const copy = agentCopy[lang]
  const router = useRouter()
  const inputId = useId()
  const [mode, setMode] = useState<AgentMode | null>(null)
  const [phase, setPhase] = useState<Phase>('checking')
  const [activity, setActivity] = useState<Activity>('idle')
  const [turns, setTurns] = useState<Turn[]>([])
  const [notice, setNotice] = useState<Notice>(null)
  const [muted, setMuted] = useState(false)
  const [micOpen, setMicOpen] = useState(false)
  const [micBlocked, setMicBlocked] = useState(false)
  const [effect, setEffect] = useState<AgentToolEffect>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [draft, setDraft] = useState('')
  const [trace, setTrace] = useState<Trace | null>(null)
  const traceRef = useRef<Trace | null>(null)
  const audioSamples = useRef(0)
  const focusAfter = useRef(false)

  const idRef = useRef(0)
  const sessionRef = useRef<LiveSession | null>(null)
  const micRef = useRef<MicHandle | null>(null)
  const playerRef = useRef<AudioPlayer | null>(null)
  const figureRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLElement>(null)
  const pendingOpen = useRef<string | null>(null)
  const mutedRef = useRef(false)
  const micLevel = useRef(0)
  const speakingRef = useRef(false)
  const simSpeaking = useRef(false)
  const runnerRef = useRef<ReturnType<typeof createToolRunner> | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const dodgeTimer = useRef(0)
  const lastDodge = useRef<'left' | 'right'>('right')
  const [dodge, setDodge] = useState<{ side: 'left' | 'right'; id: number } | null>(null)

  const [shocked, setShocked] = useState(false)

  const onPoke = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = AVATAR_VIEWBOX.x + ((event.clientX - box.left) / box.width) * AVATAR_VIEWBOX.width
    const y = AVATAR_VIEWBOX.y + ((event.clientY - box.top) / box.height) * AVATAR_VIEWBOX.height
    window.clearTimeout(dodgeTimer.current)
    if (isCrotch(x, y)) {
      setDodge(null)
      setShocked(true)
      dodgeTimer.current = window.setTimeout(() => setShocked(false), SHOCK_MS)
      return
    }
    setShocked(false)
    const side = lastDodge.current === 'left' ? 'right' : 'left'
    lastDodge.current = Math.random() < 0.7 ? side : lastDodge.current
    setDodge({ side: lastDodge.current, id: Date.now() })
    dodgeTimer.current = window.setTimeout(() => setDodge(null), DODGE_MS)
  }
  const transcriptRef = useRef<HTMLOListElement>(null)

  const nextId = () => ++idRef.current

  const runner = useCallback(() => {
    runnerRef.current ??= createToolRunner(
      {
        lang,
        index: () => loadSearchIndex(lang),
        navigate: (path) => {
          pendingOpen.current = path
        },
      },
      window.location.origin,
    )
    return runnerRef.current
  }, [lang])

  const track = useCallback((step: (current: Trace) => Trace) => {
    const current = traceRef.current
    if (!current) return
    const next = step(current)
    if (next === current) return
    traceRef.current = next
    setTrace(next)
  }, [])

  const beginTrace = useCallback((value: Trace) => {
    traceRef.current = value
    audioSamples.current = 0
    setTrace(value)
  }, [])

  const runTool = useCallback(
    async (call: AgentToolCall, turn?: number) => {
      const started = performance.now()
      const result = await runner()(call)
      const ms = performance.now() - started
      track((current) => addTool(current, traceTool(call, result.effect, result.response.response, ms), turn))
      return result
    },
    [runner, track],
  )

  const teardown = useCallback(() => {
    micRef.current?.stop()
    micRef.current = null
    const session = sessionRef.current
    sessionRef.current = null
    session?.close()
    playerRef.current?.close()
    playerRef.current = null
    simSpeaking.current = false
    speakingRef.current = false
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    setMicOpen(false)
    setExpiresAt(null)
  }, [])

  const flushNavigation = useCallback(() => {
    const path = pendingOpen.current
    if (!path) return
    pendingOpen.current = null
    const started = Date.now()
    const go = () => {
      teardown()
      router.push(path)
    }
    const wait = () => {
      const player = playerRef.current
      if (!player || !player.playing() || simSpeaking.current || Date.now() - started > NAVIGATE_WAIT_MS) {
        if (simSpeaking.current && Date.now() - started <= NAVIGATE_WAIT_MS) window.setTimeout(wait, 200)
        else go()
        return
      }
      window.setTimeout(wait, 200)
    }
    wait()
  }, [router, teardown])

  useEffect(() => {
    let alive = true
    fetch(AGENT_SESSION_ENDPOINT, { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: unknown) => {
        if (!alive) return
        setMode(isAgentStatus(data) ? data.mode : 'off')
        setPhase('idle')
      })
      .catch(() => {
        if (!alive) return
        setMode('off')
        setPhase('idle')
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => () => teardown(), [teardown])

  useEffect(() => {
    const list = transcriptRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [turns])

  useEffect(() => {
    if (expiresAt === null) return
    const tick = () => setNow(Date.now())
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [expiresAt])

  useEffect(() => {
    if (phase !== 'live') return
    const figure = figureRef.current
    const stage = stageRef.current
    let frame = 0
    const loop = () => {
      const player = playerRef.current
      const level = simSpeaking.current ? 0.03 + Math.abs(Math.sin(performance.now() / 85)) * 0.16 : (player?.level() ?? 0)
      if (figure) figure.dataset.mouth = mouthFor(level)
      stage?.style.setProperty('--agent-level', Math.min(1, Math.max(level, micLevel.current) * 5).toFixed(3))
      const speaking = simSpeaking.current || Boolean(player?.playing())
      if (speaking !== speakingRef.current) {
        speakingRef.current = speaking
        setActivity((current) => (speaking ? 'speaking' : current === 'speaking' ? 'listening' : current))
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      if (figure) figure.dataset.mouth = 'closed'
      stage?.style.setProperty('--agent-level', '0')
    }
  }, [phase])

  const say = useCallback(
    (text: string, turn?: number) => {
      setTurns((current) => addTurn(current, 'agent', text, nextId()))
      track((current) => markAnswer(current, text, turn))
      const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
      if (!synth || mutedRef.current) {
        track((current) => closeTurn(current, Date.now(), 0, turn))
        setActivity('listening')
        flushNavigation()
        return
      }
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang === 'es' ? 'es-ES' : 'en-US'
      utteranceRef.current = utterance
      let finished = false
      let spokeAt = 0
      const finish = () => {
        if (finished) return
        finished = true
        const at = Date.now()
        track((current) => closeTurn(current, at, spokeAt ? at - spokeAt : 0, turn))
        window.clearTimeout(fallback)
        if (utteranceRef.current === utterance) utteranceRef.current = null
        simSpeaking.current = false
        setActivity((current) => (current === 'speaking' ? 'listening' : current))
        flushNavigation()
      }
      const fallback = window.setTimeout(finish, 2500 + text.length * 90)
      utterance.onstart = () => {
        simSpeaking.current = true
        spokeAt = Date.now()
        track((current) => markAudio(current, spokeAt, turn))
      }
      utterance.onend = finish
      utterance.onerror = finish
      synth.cancel()
      synth.speak(utterance)
    },
    [flushNavigation, lang, track],
  )

  const startSimulator = useCallback(() => {
    setNotice(null)
    setTurns([])
    setEffect(null)
    setPhase('live')
    setActivity('listening')
    const at = Date.now()
    const first = markAsked(createTrace('local', 'simulator', 'browser', at), at, 'greeting', 'greeting')
    beginTrace(first)
    say(simulatorGreeting(lang), pendingTurn(first))
  }, [beginTrace, lang, say])

  const simulate = useCallback(
    async (question: string, turn?: number) => {
      setActivity('thinking')
      const index = await loadSearchIndex(lang)
      let hits: AgentSearchHit[] = []
      if (intentOf(question) === 'search') {
        const { effect: found } = await runTool({ id: 'local', name: SEARCH_TOOL, args: { consulta: question } }, turn)
        setEffect(found)
        hits = found?.kind === 'search' ? found.hits : []
      } else setEffect(null)
      const reply = simulatorReply(lang, question, hits, index.facts)
      if (reply.open) pendingOpen.current = reply.open
      say(reply.text, turn)
    },
    [lang, runTool, say],
  )

  const openMic = useCallback(async (session: LiveSession) => {
    try {
      micRef.current = await startMic({
        onChunk: (pcm) => session.sendAudio(pcm),
        onLevel: (level) => {
          micLevel.current = level
        },
      })
      setMicOpen(true)
      setMicBlocked(false)
    } catch {
      setMicBlocked(true)
    }
  }, [])

  const startLive = useCallback(async () => {
    setNotice(null)
    setMicBlocked(false)
    setTurns([])
    setEffect(null)
    setPhase('connecting')
    setActivity('idle')
    const player = createPlayer()
    playerRef.current = player
    await player.resume().catch(() => undefined)

    let grant: unknown
    try {
      const response = await fetch(AGENT_SESSION_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lang }),
      })
      grant = await response.json()
    } catch {
      grant = { error: 'failed' }
    }
    if (!isAgentGrant(grant)) {
      teardown()
      if (grant && typeof grant === 'object' && (grant as { mode?: unknown }).mode === 'local') {
        setMode('local')
        startSimulator()
        return
      }
      setNotice(replyError(grant))
      setPhase('idle')
      return
    }

    setExpiresAt(Date.parse(grant.expiresAt))
    beginTrace(createTrace('live', grant.model, AGENT_VOICE, Date.now()))
    const session: LiveSession = openLiveSession({
      token: grant.token,
      model: grant.model,
      events: {
        onOpen: () => {
          setPhase('live')
          setActivity('listening')
          track((current) => markAsked(current, Date.now(), 'greeting', 'greeting'))
          session.sendText(copy.greet)
          void openMic(session)
        },
        onAudio: (pcm) => {
          audioSamples.current += pcm.length
          track((current) => markAudio(current, Date.now()))
          if (!mutedRef.current) playerRef.current?.enqueue(pcm)
        },
        onInputTranscript: (text) => {
          track((current) => markHeard(current, Date.now(), text))
          setTurns((current) => appendChunk(current, 'you', text, nextId()))
        },
        onOutputTranscript: (text) => {
          track((current) => markAnswer(current, text))
          setTurns((current) => appendChunk(current, 'agent', text, nextId()))
        },
        onVoiceActivity: (activity) => {
          if (activity === 'end') track((current) => markAsked(current, Date.now(), 'voice', 'vad'))
        },
        onUsage: (usage) => track((current) => markUsage(current, usage)),
        onInterrupted: () => {
          track(markInterrupted)
          playerRef.current?.flush()
          setActivity('listening')
        },
        onTurnComplete: () => {
          const audioMs = (audioSamples.current / OUTPUT_RATE) * 1000
          audioSamples.current = 0
          track((current) => closeTurn(current, Date.now(), audioMs))
          setTurns(closeTurns)
          setActivity((current) => (current === 'thinking' ? 'listening' : current))
          flushNavigation()
        },
        onToolCall: async (calls) => {
          setActivity('thinking')
          const responses = []
          for (const call of calls) {
            const result = await runTool(call)
            if (result.effect) setEffect(result.effect)
            responses.push(result.response)
          }
          return responses
        },
        onClose: (reason, detail) => {
          if (sessionRef.current !== session) return
          sessionRef.current = null
          track((current) => closeTurn(current, Date.now()))
          teardown()
          setPhase('ended')
          setActivity('idle')
          setNotice(closeNotice(reason, detail))
        },
      },
    })
    sessionRef.current = session
  }, [beginTrace, copy.greet, flushNavigation, lang, openMic, runTool, startSimulator, teardown, track])

  useEffect(() => {
    if (!focusAfter.current) return
    focusAfter.current = false
    const target = phase === 'consent' ? '[data-cw-agent-consent] button' : '[data-cw-agent-start], [data-cw-agent-hangup]'
    stageRef.current?.querySelector<HTMLButtonElement>(target)?.focus()
  }, [phase])

  const onStart = () => {
    if (mode === 'local') startSimulator()
    else if (mode === 'live') {
      focusAfter.current = true
      setPhase('consent')
    }
  }

  const hangUp = () => {
    pendingOpen.current = null
    track((current) => closeTurn(current, Date.now()))
    teardown()
    setPhase('ended')
    setActivity('idle')
    setTurns(closeTurns)
  }

  const toggleMic = () => {
    const session = sessionRef.current
    if (!session) return
    if (micRef.current) {
      micRef.current.stop()
      micRef.current = null
      micLevel.current = 0
      session.endAudio()
      setMicOpen(false)
    } else void openMic(session)
  }

  const toggleMute = () => {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    if (next) {
      playerRef.current?.flush()
      window.speechSynthesis?.cancel()
    }
  }

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')
    setTurns((current) => addTurn(current, 'you', text, nextId()))
    if (speakingRef.current || simSpeaking.current) track(markInterrupted)
    track((current) => markAsked(current, Date.now(), 'text', 'text', text))
    if (mode === 'live' && sessionRef.current) {
      playerRef.current?.flush()
      sessionRef.current.sendText(text)
      setActivity('thinking')
    } else if (mode === 'local') void simulate(text, pendingTurn(traceRef.current))
  }

  const live = phase === 'live'
  const visual = mode === 'off' ? 'off' : live ? activity : phase === 'connecting' ? 'thinking' : 'idle'
  const status = (() => {
    if (phase === 'checking') return copy.states.checking
    if (notice === 'expired') return copy.states.expired
    if (notice) return copy.errors[notice]
    if (phase === 'connecting') return copy.states.connecting
    if (live) return mode === 'local' && activity === 'listening' ? copy.states.simulator : copy.states[activity === 'idle' ? 'listening' : activity]
    if (phase === 'ended') return copy.states.ended
    return mode === 'off' ? copy.errors.off : copy.states.idle
  })()
  const bubble = live ? bubbleText(lastAgentLine(turns)) : ''
  const timeLeft = expiresAt !== null && now > 0 ? fill(copy.timeLeft, { time: clock(expiresAt - now) }) : null
  const effectText =
    effect?.kind === 'search' && effect.query
      ? fill(copy.searching, { query: effect.query })
      : effect?.kind === 'open'
        ? fill(copy.opening, { path: effect.path })
        : null

  return (
    <section
      ref={stageRef}
      className={cx(styles.stage, pixelFont.variable)}
      data-state={visual}
      data-mode={mode ?? 'checking'}
      aria-label={copy.stageLabel}
      data-cw-agent-stage=""
    >
      <div className={styles.screen}>
        <div className={styles.sky} aria-hidden="true" />
        <div className={styles.floor} aria-hidden="true" />
        <div className={styles.hud}>
          <span className={styles.nameplate}>{copy.name}</span>
          {timeLeft ? <span className={styles.timer}>{timeLeft}</span> : null}
        </div>
        <div className={styles.actor}>
          {shocked ? (
            <p className={cx(styles.bubble, styles.shockBubble)} aria-hidden="true" data-cw-agent-shock="">
              {copy.poke}
            </p>
          ) : bubble ? (
            <p className={styles.bubble} aria-hidden="true" data-cw-agent-bubble="">
              {bubble}
            </p>
          ) : null}
          <div
            key={dodge?.id ?? 'still'}
            className={styles.dodger}
            data-dodge={dodge?.side}
            data-shocked={shocked ? '' : undefined}
            onPointerDown={onPoke}
            aria-hidden="true"
            data-cw-agent-dodger=""
          >
            <AgentAvatar figureRef={figureRef} />
          </div>
        </div>
        <div className={styles.meter} aria-hidden="true">
          {Array.from({ length: METER_BARS }, (_, index) => (
            <span key={index} style={{ '--bar': index } as CSSProperties} />
          ))}
        </div>
      </div>

      <p className={styles.status} role="status" data-cw-agent-status="">
        {status}
      </p>
      {micBlocked && live ? (
        <p className={styles.effect} data-cw-agent-mic-blocked="">
          {copy.errors.mic}
        </p>
      ) : null}
      {effectText && live && activity !== 'listening' ? (
        <p className={styles.effect} data-cw-agent-effect="">
          {effectText}
        </p>
      ) : null}

      {phase === 'consent' ? (
        <div className={styles.consent} role="group" aria-labelledby={`${inputId}-consent`} data-cw-agent-consent="">
          <p className={styles.consentTitle} id={`${inputId}-consent`}>
            {copy.consentTitle}
          </p>
          <p>{copy.consentBody}</p>
          <div className={styles.row}>
            <Button
              variant="solid"
              onClick={() => {
                focusAfter.current = true
                void startLive()
              }}
            >
              {copy.consentAccept}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                focusAfter.current = true
                setPhase('idle')
              }}
            >
              {copy.consentCancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.row}>
          {live || phase === 'connecting' ? (
            <Button variant="solid" onClick={hangUp} data-cw-agent-hangup="">
              {copy.hangUp}
            </Button>
          ) : (
            <Button variant="solid" onClick={onStart} disabled={mode === 'off' || phase === 'checking'} data-cw-agent-start="">
              {copy.start}
            </Button>
          )}
          {live && mode === 'live' ? (
            <Button variant="glass" onClick={toggleMic} aria-pressed={micOpen} data-cw-agent-mic="">
              {micOpen ? copy.micOn : copy.micOff}
            </Button>
          ) : null}
          {live ? (
            <Button variant="ghost" onClick={toggleMute} aria-pressed={muted} data-cw-agent-mute="">
              {muted ? copy.unmute : copy.mute}
            </Button>
          ) : null}
        </div>
      )}

      {live ? (
        <form className={styles.compose} onSubmit={send} data-cw-agent-form="">
          <label className={styles.label} htmlFor={inputId}>
            {copy.textLabel}
          </label>
          <div className={styles.row}>
            <input
              id={inputId}
              className={styles.input}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={copy.textPlaceholder}
              maxLength={300}
              autoComplete="off"
            />
            <Button type="submit" variant="glass" disabled={!draft.trim()}>
              {copy.send}
            </Button>
          </div>
        </form>
      ) : null}

      {turns.length ? (
        <ol ref={transcriptRef} className={styles.transcript} aria-label={copy.transcript} aria-live="polite" data-cw-agent-transcript="">
          {turns.map((turn) => (
            <li key={turn.id} className={styles.turn} data-who={turn.who}>
              <span className={styles.who}>{turn.who === 'you' ? copy.you : copy.name}</span>
              <span>{turn.text}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {trace && (live || phase === 'ended') ? <TracePanel trace={trace} copy={copy.trace} lang={lang} /> : null}

      {mode === 'local' ? <p className={styles.note}>{copy.simulatorNote}</p> : null}
    </section>
  )
}
