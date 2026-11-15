'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from 'react'
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
import { intentOf, simulatorGreeting, simulatorPageReply, simulatorReply } from '@/lib/ai/agent/simulator'
import { createToolRunner, HIGHLIGHT_TOOL, PAGE_TOOL, SEARCH_TOOL, type AgentSearchHit, type AgentSource, type AgentToolCall, type AgentToolEffect } from '@/lib/ai/agent/tools'
import { interviewActa } from '@/lib/ai/agent/interview'
import { labPayload, sendLabSession, type LabEndReason } from '@/lib/ai/lab/client'
import { SIMULATOR_DECISION, SIMULATOR_DIAGRAM, type DesignDecision, type Diagram } from '@/lib/ai/agent/design'
import { acceptLabConsent } from '@/lib/actions/lab'
import { downloadText } from '@/lib/ailab/skill/download'
import type { InterviewTrack } from '@/content/ailab/interview'
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
import { addTurn, appendChunk, closeTurns, lastAgentLine, type Speaker, type Turn } from '@/lib/ai/agent/transcript'
import { ANONYMOUS_VIEWER, isAgentViewer, type AgentViewer } from '@/lib/ai/agent/viewer'
import { highlightSection, readPageContext } from '@/lib/ai/agent/page-context'
import { openMiniCherced } from './open-global'
import { loadSearchIndex } from '@/lib/search/client'
import { AgentAvatar } from './AgentAvatar'
import { InterviewPanel } from './InterviewPanel'
import { MemoTracePanel } from './TracePanel'
import { AVATAR_VIEWBOX, isCrotch, mouthFor } from './avatar-sprite'
import { useVoxelStage } from './voxel-scene'
import styles from './Agent.module.scss'

type Phase = 'checking' | 'idle' | 'consent' | 'connecting' | 'live' | 'ended'

type Activity = 'idle' | 'arriving' | 'listening' | 'thinking' | 'speaking'

const ARRIVAL_MS = 1500

const CHUNK_FLUSH_MS = 90

const STICK_PX = 48

type PendingChunk = { who: Speaker; text: string; at: number }

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
  if (effect?.kind === 'open' || effect?.kind === 'source') return { ...base, result: { kind: 'open', path: effect.path } }
  if (effect?.kind === 'diagram') return { ...base, result: { kind: 'done', detail: `${effect.diagram.nodos.length} nodos` } }
  if (effect?.kind === 'decision') return { ...base, result: { kind: 'done', detail: effect.decision.decision } }
  if (response.ok === false) return { ...base, result: { kind: 'open', path: null } }
  return { ...base, result: { kind: 'error', error: typeof response.error === 'string' ? response.error : 'unknown' } }
}

function replyError(reply: unknown): Notice {
  if (!reply || typeof reply !== 'object') return 'failed'
  const value = reply as Record<string, unknown>
  if (value.error === 'rate_limited') return 'rate_limited'
  if (value.error === 'daily_cap') return 'daily_cap'
  if (value.error === 'trial_used') return 'trial_used'
  if (value.error === 'unavailable') return 'unavailable'
  if (value.mode === 'off') return 'off'
  return 'failed'
}

export default function AgentStage({ lang, persistent = false }: LabDemoProps & { persistent?: boolean }) {
  const copy = agentCopy[lang]
  const router = useRouter()
  const inputId = useId()
  const [mode, setMode] = useState<AgentMode | null>(null)
  const [viewer, setViewer] = useState<AgentViewer>(ANONYMOUS_VIEWER)
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
  const [trial, setTrial] = useState(false)
  const [labConsent, setLabConsent] = useState(false)
  const [saveChecked, setSaveChecked] = useState(false)
  const saveReason = useRef<LabEndReason | null>(null)
  const [interview, setInterview] = useState<InterviewTrack | null>(null)
  const [sources, setSources] = useState<AgentSource[]>([])
  const [diagram, setDiagram] = useState<Diagram | null>(null)
  const [decisions, setDecisions] = useState<DesignDecision[]>([])
  const [interviewStartedAt, setInterviewStartedAt] = useState(0)
  const addSource = useCallback((effect: AgentToolEffect) => {
    if (effect?.kind === 'diagram') setDiagram(effect.diagram)
    if (effect?.kind === 'decision') setDecisions((current) => [...current, effect.decision].slice(-12))
    if (effect?.kind !== 'source') return
    setSources((current) => (current.some((source) => source.path === effect.path) ? current : [...current, { path: effect.path, title: effect.title }]))
  }, [])
  const levelRef = useRef(0)
  const voiceRef = useRef(0)
  const voxels = useVoxelStage()
  const audio = useMemo(() => ({ level: () => levelRef.current, voice: () => voiceRef.current }), [])

  const poke = useCallback((x: number, y: number) => {
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
  }, [])

  const onPoke = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    poke(
      AVATAR_VIEWBOX.x + ((event.clientX - box.left) / box.width) * AVATAR_VIEWBOX.width,
      AVATAR_VIEWBOX.y + ((event.clientY - box.top) / box.height) * AVATAR_VIEWBOX.height,
    )
  }
  const transcriptRef = useRef<HTMLOListElement>(null)
  const stickRef = useRef(true)
  const pendingChunks = useRef<PendingChunk[]>([])
  const chunkTimer = useRef(0)
  const arrivalTimer = useRef(0)

  const nextId = () => ++idRef.current

  const runner = useCallback(() => {
    runnerRef.current ??= createToolRunner(
      {
        lang,
        index: () => loadSearchIndex(lang),
        navigate: (path) => {
          pendingOpen.current = path
        },
        page: {
          read: () => readPageContext(),
          highlight: (id) => highlightSection(id, document, window.matchMedia('(prefers-reduced-motion: reduce)').matches),
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

  const flushChunks = useCallback(() => {
    window.clearTimeout(chunkTimer.current)
    chunkTimer.current = 0
    const chunks = pendingChunks.current
    if (chunks.length === 0) return
    pendingChunks.current = []
    for (const chunk of chunks)
      track((current) => (chunk.who === 'you' ? markHeard(current, chunk.at, chunk.text) : markAnswer(current, chunk.text)))
    setTurns((current) => chunks.reduce((list, chunk) => appendChunk(list, chunk.who, chunk.text, ++idRef.current), current))
  }, [track])

  const queueChunk = useCallback(
    (who: Speaker, text: string) => {
      pendingChunks.current.push({ who, text, at: Date.now() })
      if (!chunkTimer.current) chunkTimer.current = window.setTimeout(flushChunks, CHUNK_FLUSH_MS)
    },
    [flushChunks],
  )

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
    window.clearTimeout(arrivalTimer.current)
    arrivalTimer.current = 0
    window.clearTimeout(chunkTimer.current)
    chunkTimer.current = 0
    pendingChunks.current = []
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
      if (!persistent) teardown()
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
  }, [persistent, router, teardown])

  useEffect(() => {
    let alive = true
    fetch(AGENT_SESSION_ENDPOINT, { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: unknown) => {
        if (!alive) return
        setMode(isAgentStatus(data) ? data.mode : 'off')
        if (isAgentStatus(data) && isAgentViewer(data.viewer)) setViewer(data.viewer)
        if (isAgentStatus(data)) setLabConsent(Boolean(data.labConsent))
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

  const canSave = viewer.kind === 'account' || viewer.kind === 'author'

  useEffect(() => {
    if (phase !== 'ended' || !saveReason.current) return
    const reason = saveReason.current
    saveReason.current = null
    if (!canSave || !labConsent || !mode || mode === 'off') return
    const payload = labPayload({
      lang,
      mode: mode === 'local' ? 'local' : 'live',
      interview,
      startedAt: interviewStartedAt || Date.now(),
      endedAt: Date.now(),
      endReason: reason,
      turns,
      trace,
    })
    if (payload) sendLabSession(payload)
  }, [canSave, interview, interviewStartedAt, labConsent, lang, mode, phase, trace, turns])

  useEffect(() => {
    const list = transcriptRef.current
    if (list && stickRef.current) list.scrollTop = list.scrollHeight
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
      const voice = Math.min(1, Math.max(level, micLevel.current) * 5)
      levelRef.current = level
      voiceRef.current = voice
      if (figure) figure.dataset.mouth = mouthFor(level)
      stage?.style.setProperty('--agent-level', voice.toFixed(3))
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
      levelRef.current = 0
      voiceRef.current = 0
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
    setSources([])
    setDiagram(null)
    setDecisions([])
    setInterviewStartedAt(Date.now())
    setEffect(null)
    setPhase('live')
    setActivity('arriving')
    stickRef.current = true
    window.clearTimeout(arrivalTimer.current)
    arrivalTimer.current = window.setTimeout(() => {
      arrivalTimer.current = 0
      setActivity('listening')
      const at = Date.now()
      const first = markAsked(createTrace('local', 'simulator', 'browser', at), at, 'greeting', 'greeting')
      beginTrace(first)
      say(simulatorGreeting(lang, viewer), pendingTurn(first))
    }, ARRIVAL_MS)
  }, [beginTrace, lang, say, viewer])

  const simulate = useCallback(
    async (question: string, turn?: number) => {
      setActivity('thinking')
      if (intentOf(question) === 'page') {
        await runTool({ id: 'local', name: PAGE_TOOL, args: {} }, turn)
        const page = readPageContext()
        const first = page.sections[0]
        if (first) await runTool({ id: 'local', name: HIGHLIGHT_TOOL, args: { id: first.id } }, turn)
        setEffect(null)
        say(simulatorPageReply(lang, page), turn)
        return
      }
      const index = await loadSearchIndex(lang)
      let hits: AgentSearchHit[] = []
      if (intentOf(question) === 'search') {
        const { effect: found } = await runTool({ id: 'local', name: SEARCH_TOOL, args: { consulta: question } }, turn)
        setEffect(found)
        hits = found?.kind === 'search' ? found.hits : []
      } else setEffect(null)
      const reply = simulatorReply(lang, question, hits, index.facts, viewer)
      const top = hits[0]
      if (interview && top) addSource({ kind: 'source', path: top.ruta, title: top.titulo })
      if (interview === 'design') {
        setDiagram(SIMULATOR_DIAGRAM)
        setDecisions([SIMULATOR_DECISION])
      }
      if (reply.open && !interview) pendingOpen.current = reply.open
      say(reply.text, turn)
    },
    [addSource, interview, lang, runTool, say, viewer],
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
    setSources([])
    setDiagram(null)
    setDecisions([])
    setInterviewStartedAt(Date.now())
    stickRef.current = true
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
        body: JSON.stringify({ lang, interview }),
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
    setTrial(Boolean(grant.trial))
    beginTrace(createTrace('live', grant.model, AGENT_VOICE, Date.now()))
    const session: LiveSession = openLiveSession({
      token: grant.token,
      model: grant.model,
      events: {
        onOpen: () => {
          setPhase('live')
          setActivity('arriving')
          const opened = Date.now()
          void openMic(session).finally(() => {
            arrivalTimer.current = window.setTimeout(
              () => {
                arrivalTimer.current = 0
                if (sessionRef.current !== session) return
                setActivity((current) => (current === 'arriving' ? 'listening' : current))
                track((current) => markAsked(current, Date.now(), 'greeting', 'greeting'))
                session.sendText(copy.greet)
              },
              Math.max(0, ARRIVAL_MS - (Date.now() - opened)),
            )
          })
        },
        onAudio: (pcm) => {
          audioSamples.current += pcm.length
          track((current) => markAudio(current, Date.now()))
          if (!mutedRef.current) playerRef.current?.enqueue(pcm)
        },
        onInputTranscript: (text) => queueChunk('you', text),
        onOutputTranscript: (text) => queueChunk('agent', text),
        onVoiceActivity: (activity) => {
          if (activity === 'end') track((current) => markAsked(current, Date.now(), 'voice', 'vad'))
        },
        onUsage: (usage) => track((current) => markUsage(current, usage)),
        onInterrupted: () => {
          flushChunks()
          track(markInterrupted)
          playerRef.current?.flush()
          setTurns(closeTurns)
          setActivity('listening')
        },
        onTurnComplete: () => {
          flushChunks()
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
            addSource(result.effect)
            responses.push(result.response)
          }
          return responses
        },
        onClose: (reason, detail) => {
          if (sessionRef.current !== session) return
          saveReason.current = reason === 'expired' ? 'expired' : reason === 'error' ? 'error' : 'hangup'
          flushChunks()
          sessionRef.current = null
          track((current) => closeTurn(current, Date.now()))
          setTurns(closeTurns)
          teardown()
          setPhase('ended')
          setActivity('idle')
          setNotice(closeNotice(reason, detail))
        },
      },
    })
    sessionRef.current = session
  }, [addSource, beginTrace, copy.greet, flushChunks, flushNavigation, interview, lang, openMic, queueChunk, runTool, startSimulator, teardown, track])

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
    saveReason.current ??= 'hangup'
    flushChunks()
    pendingOpen.current = null
    track((current) => closeTurn(current, Date.now()))
    teardown()
    setPhase('ended')
    setActivity('idle')
    setTurns(closeTurns)
  }

  const takeAlong = () => {
    if (phase === 'live' || phase === 'connecting') hangUp()
    openMiniCherced()
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
    ask(text)
  }

  const ask = (text: string) => {
    flushChunks()
    stickRef.current = true
    setTurns((current) => addTurn(current, 'you', text, nextId()))
    if (speakingRef.current || simSpeaking.current) track(markInterrupted)
    track((current) => markAsked(current, Date.now(), 'text', 'text', text))
    if (mode === 'live' && sessionRef.current) {
      playerRef.current?.flush()
      sessionRef.current.sendText(text)
      setActivity('thinking')
    } else if (mode === 'local') void simulate(text, pendingTurn(traceRef.current))
  }

  const finishInterview = () => {
    if (!interview) return
    flushChunks()
    const acta = interviewActa({
      lang,
      track: interview,
      startedAt: interviewStartedAt || Date.now(),
      endedAt: Date.now(),
      turns,
      sources,
      origin: window.location.origin,
      diagram,
      decisions,
    })
    downloadText(`${copy.interview.file}-${new Date().toISOString().slice(0, 10)}.md`, acta, 'text/markdown')
    hangUp()
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
      data-scene={voxels.shown ? '3d' : undefined}
      aria-label={copy.stageLabel}
      data-cw-agent-stage=""
    >
      <div className={styles.screen}>
        <div className={styles.sky} aria-hidden="true" />
        <div className={styles.floor} aria-hidden="true" />
        {voxels.Stage ? (
          <voxels.Stage
            state={visual === 'arriving' ? 'idle' : visual}
            active={phase !== 'ended' && mode !== 'off'}
            live={live}
            shocked={shocked}
            dodge={dodge}
            audio={audio}
            onPoke={poke}
            onReady={voxels.ready}
            onFail={voxels.fail}
          />
        ) : null}
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

      {!live && phase !== 'consent' && phase !== 'connecting' && phase !== 'checking' && mode !== 'off' ? (
        <InterviewPanel
          lang={lang}
          copy={copy.interview}
          track={interview}
          onTrack={setInterview}
          live={false}
          startedAt={0}
          asked={[]}
          sources={[]}
          onAsk={() => {}}
          onFinish={() => {}}
        />
      ) : null}

      {phase === 'consent' ? (
        <div className={styles.consent} role="group" aria-labelledby={`${inputId}-consent`} data-cw-agent-consent="">
          <p className={styles.consentTitle} id={`${inputId}-consent`}>
            {copy.consentTitle}
          </p>
          <p>{copy.consentBody}</p>
          {canSave && !labConsent ? (
            <label className={styles.saveConsent} data-cw-agent-save-consent="">
              <input type="checkbox" checked={saveChecked} onChange={(event) => setSaveChecked(event.target.checked)} />
              <span>{copy.save.consent}</span>
            </label>
          ) : null}
          <div className={styles.row}>
            <Button
              variant="solid"
              disabled={canSave && !labConsent && !saveChecked}
              onClick={async () => {
                focusAfter.current = true
                if (canSave && !labConsent) {
                  const result = await acceptLabConsent()
                  if (result.ok) setLabConsent(true)
                }
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

      {live && interview ? (
        <InterviewPanel
          lang={lang}
          copy={copy.interview}
          track={interview}
          onTrack={setInterview}
          live
          startedAt={interviewStartedAt}
          asked={turns.filter((turn) => turn.who === 'you').map((turn) => turn.text)}
          sources={sources}
          onAsk={ask}
          onFinish={finishInterview}
          diagram={diagram}
          decisions={decisions}
        />
      ) : null}

      {turns.length ? (
        <ol
          ref={transcriptRef}
          className={styles.transcript}
          aria-label={copy.transcript}
          aria-live="polite"
          onScroll={(event) => {
            const list = event.currentTarget
            stickRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < STICK_PX
          }}
          data-cw-agent-transcript=""
        >
          {turns.map((turn) => (
            <li key={turn.id} className={styles.turn} data-who={turn.who}>
              <span className={styles.who}>{turn.who === 'you' ? copy.you : copy.name}</span>
              <span>{turn.text}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {trace && (live || phase === 'ended') ? <MemoTracePanel trace={trace} copy={copy.trace} lang={lang} /> : null}

      {trial && live ? (
        <p className={styles.note} data-cw-agent-trial="">
          {copy.trial.note}
        </p>
      ) : null}
      {(trial && phase === 'ended') || notice === 'trial_used' ? (
        <p className={styles.note} data-cw-agent-trial-end="">
          {notice === 'trial_used' ? null : `${copy.trial.ended} `}
          <Link href={`/${lang}/account?next=${encodeURIComponent(`/${lang}/ai-lab`)}`}>{copy.trial.signIn}</Link>
        </p>
      ) : null}
      {mode === 'local' ? <p className={styles.note}>{copy.simulatorNote}</p> : null}
      <p className={styles.note}>
        <Link href={`/${lang}/ai-lab/evals`} data-cw-agent-evals="">
          {copy.evals}
        </Link>
        {' · '}
        <Link href={`/${lang}/ai-lab/codigo`} data-cw-agent-code="">
          {copy.code}
        </Link>
        {persistent ? null : (
          <>
            {' · '}
            <button type="button" className={styles.inlineLink} onClick={takeAlong} data-cw-agent-take="">
              {copy.take}
            </button>
          </>
        )}
      </p>
    </section>
  )
}
