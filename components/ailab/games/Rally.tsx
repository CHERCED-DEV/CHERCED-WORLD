'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { labStore, onLabCleared } from '@/lib/ailab/core/store'
import { useLabWorker } from '@/lib/ailab/core/use-lab-worker'
import { LabWorkerError } from '@/lib/ailab/core/worker'
import type { LabExperimentId } from '@/content/types'
import { CLONE_MIN_SAMPLES, CLONE_RECORD_RALLIES, demoFromRecorder, recordedSamples, resetRecorder } from '@/lib/ailab/games/clone'
import { Match, type RallyOutcome } from '@/lib/ailab/games/match'
import {
  NET_SIZES,
  adamFromArrays,
  adamToArrays,
  createAdam,
  createNet,
  netFromArrays,
  netToArrays,
  seededRandom,
  type Adam,
  type Net,
} from '@/lib/ailab/games/net'
import { GAME_KEYS, GAME_STATE_VERSION, MAX_CURVE, fromStored, toStored, type GameMode, type GameSnapshot } from '@/lib/ailab/games/persist'
import type { Episode } from '@/lib/ailab/games/rival'
import type { GameJob, GameJobProgress, GameJobResult } from '@/lib/ailab/games/train'
import { useMediaQuery } from '@/lib/fx/viewport'
import { BrainPanel, type BrainHandle } from './BrainPanel'
import { GameController, type ControllerEvent } from './controller'
import { cloneLabels, rivalLabels, type CloneLabels, type RallyLabels, type RivalLabels } from './labels'
import { LearningCurve } from './LearningCurve'
import type { Orientation } from './render'
import styles from './Rally.module.scss'

type Stage = 'record' | 'training' | 'clone'

type Score = { player: number; rival: number }

const PORTRAIT_BELOW = 560

const SUMMARY_WINDOW = 5

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function percent(value: number): number {
  return Math.round(value * 100)
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length
}

function freshSeed(): number {
  return (Math.random() * 2 ** 31) | 0
}

function buffersOf(episodes: readonly Episode[]): ArrayBuffer[] {
  return episodes.flatMap((episode) => [episode.inputs.buffer, episode.actions.buffer, episode.rewards.buffer] as ArrayBuffer[])
}

type RallyProps = {
  mode: GameMode
  experiment: LabExperimentId
  labels: RivalLabels | CloneLabels
}

function isClone(labels: RallyLabels, mode: GameMode): labels is CloneLabels {
  return mode === 'clone'
}

function revealCourt(court: HTMLElement | null, reduced: boolean) {
  if (!court) return
  const box = court.getBoundingClientRect()
  if (box.top >= 0 && box.bottom <= window.innerHeight) return
  court.scrollIntoView({ block: 'center', behavior: reduced ? 'instant' : 'smooth' })
}

export function Rally({ mode, experiment, labels }: RallyProps) {
  const ids = useId()
  const helpId = `${ids}-help`
  const surfaceRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const brainRef = useRef<BrainHandle>(null)
  const controllerRef = useRef<GameController | null>(null)
  const matchRef = useRef<Match | null>(null)
  const netRef = useRef<Net | null>(null)
  const adamRef = useRef<Adam | null>(null)
  const pendingRef = useRef<Episode[]>([])
  const sinceTrainRef = useRef(0)
  const trainEveryRef = useRef(1)
  const busyRef = useRef(false)
  const evictedRef = useRef(false)
  const warnedRef = useRef({ storage: false, slow: false })
  const generationRef = useRef(0)
  const curveRef = useRef<number[]>([])
  const trainedRef = useRef(0)
  const recordedRef = useRef(0)
  const stageRef = useRef<Stage>('record')
  const watchRef = useRef(false)
  const similarityRef = useRef<number | null>(null)
  const orientationRef = useRef<Orientation>('landscape')
  const handlerRef = useRef<(event: ControllerEvent) => void>(() => {})
  const trainRef = useRef<() => void>(() => {})
  const startedRef = useRef(false)
  const pauseNoticeRef = useRef(false)

  const reduced = useMediaQuery(REDUCED_MOTION)
  const [snapshot, setSnapshot] = useState<GameSnapshot | null | undefined>(undefined)
  const [orientation, setOrientation] = useState<Orientation>('landscape')
  const [paused, setPaused] = useState(true)
  const [started, setStarted] = useState(false)
  const [serving, setServing] = useState(false)
  const [score, setScore] = useState<Score>({ player: 0, rival: 0 })
  const [game, setGame] = useState(1)
  const [rally, setRally] = useState(0)
  const [watch, setWatch] = useState(false)
  const [curve, setCurve] = useState<number[]>([])
  const [trained, setTrained] = useState(0)
  const [weights, setWeights] = useState<Float32Array[] | null>(null)
  const [status, setStatus] = useState('')
  const [live, setLive] = useState('')
  const [training, setTraining] = useState(false)
  const [evicted, setEvicted] = useState(false)
  const [stage, setStage] = useState<Stage>('record')
  const [similarity, setSimilarity] = useState<number | null>(null)
  const [recorded, setRecorded] = useState(0)

  const worker = useLabWorker<GameJob, GameJobResult, GameJobProgress>(
    () => new Worker(new URL('../../../lib/ailab/games/rival.worker.ts', import.meta.url), { type: 'module' }),
    {
      experiment,
      onEvict: () => {
        evictedRef.current = true
        setEvicted(true)
        setStatus(labels.shared.evicted)
      },
    },
  )

  const enterStage = useCallback((next: Stage) => {
    stageRef.current = next
    setStage(next)
  }, [])

  const publishCurve = useCallback((next: number[]) => {
    curveRef.current = next.slice(-MAX_CURVE)
    setCurve(curveRef.current)
  }, [])

  const persist = useCallback(async () => {
    const net = netRef.current
    if (!net) return
    const saved = await labStore.set(
      GAME_KEYS[mode],
      toStored(mode, { net, adam: adamRef.current, curve: curveRef.current, rallies: trainedRef.current, similarity: similarityRef.current }),
    )
    if (!saved && !warnedRef.current.storage) {
      warnedRef.current.storage = true
      setStatus(labels.shared.storage)
    }
  }, [labels, mode])

  const prepare = useCallback(
    (from: GameSnapshot | null) => {
      const seed = freshSeed()
      if (mode === 'rival') {
        const net = from?.net ?? createNet(NET_SIZES, seededRandom(seed))
        netRef.current = net
        adamRef.current = from?.adam ?? createAdam(net)
        trainedRef.current = from?.rallies ?? 0
        matchRef.current = new Match({ seed, net, rivalDriver: 'net', playerDriver: 'human', learn: true })
        enterStage('clone')
        setStatus(from ? (labels as RivalLabels).restored(trainedRef.current) : labels.fresh)
      } else if (from) {
        netRef.current = from.net
        adamRef.current = null
        similarityRef.current = from.similarity
        trainedRef.current = from.rallies
        matchRef.current = new Match({ seed, net: from.net, rivalDriver: 'net', playerDriver: 'human' })
        enterStage('clone')
        setStatus((labels as CloneLabels).restored(percent(from.similarity ?? 0)))
      } else {
        netRef.current = null
        adamRef.current = null
        similarityRef.current = null
        trainedRef.current = 0
        matchRef.current = new Match({ seed, rivalDriver: 'coach', playerDriver: 'human', record: true })
        enterStage('record')
        setStatus(labels.fresh)
      }
      recordedRef.current = 0
      pendingRef.current = []
      sinceTrainRef.current = 0
      busyRef.current = false
      setTraining(false)
      setRecorded(0)
      setSimilarity(similarityRef.current)
      setTrained(trainedRef.current)
      setWeights(netRef.current ? netToArrays(netRef.current) : null)
      publishCurve(from?.curve ?? [])
      setScore({ player: 0, rival: 0 })
      setGame(1)
      setRally(0)
      watchRef.current = false
      setWatch(false)
    },
    [enterStage, labels, mode, publishCurve],
  )

  useEffect(() => {
    let cancelled = false
    void labStore.get(GAME_KEYS[mode], { version: GAME_STATE_VERSION }).then((stored) => {
      if (cancelled) return
      const restored = fromStored(stored, mode)
      prepare(restored)
      setSnapshot(restored)
    })
    return () => {
      cancelled = true
    }
  }, [mode, prepare])

  const train = useCallback(() => {
    const net = netRef.current
    if (!net || busyRef.current || evictedRef.current || sinceTrainRef.current < trainEveryRef.current) return
    const episodes = pendingRef.current.splice(0)
    const rallies = sinceTrainRef.current
    sinceTrainRef.current = 0
    if (episodes.length === 0) return
    busyRef.current = true
    setTraining(true)
    const generation = generationRef.current
    const job: GameJob = { kind: 'reinforce', weights: netToArrays(net), optimizer: adamRef.current ? adamToArrays(adamRef.current) : null, episodes }
    worker()
      .call(job, { transfer: buffersOf(episodes) })
      .then((result) => {
        if (generation !== generationRef.current) return
        const next = netFromArrays(result.weights)
        if (!next) return
        netRef.current = next
        adamRef.current = adamFromArrays(result.optimizer, next) ?? createAdam(next)
        matchRef.current?.setNet(next)
        trainedRef.current += rallies
        setTrained(trainedRef.current)
        setWeights(result.weights)
        void persist()
      })
      .catch((error: unknown) => {
        if (error instanceof LabWorkerError && error.reason === 'evicted') return
      })
      .finally(() => {
        if (generation !== generationRef.current) return
        busyRef.current = false
        setTraining(false)
        if (sinceTrainRef.current >= trainEveryRef.current) queueMicrotask(() => trainRef.current())
      })
  }, [persist, worker])

  useEffect(() => {
    trainRef.current = train
  }, [train])

  const imitate = useCallback(() => {
    const match = matchRef.current
    const cloneText = labels as CloneLabels
    if (!match || busyRef.current) return
    match.record = false
    const demo = demoFromRecorder(match.recorder)
    enterStage('training')
    setStatus(cloneText.training(demo.actions.length))
    publishCurve([])
    busyRef.current = true
    setTraining(true)
    const generation = generationRef.current
    const keep = { inputs: demo.inputs.slice(), actions: demo.actions.slice() }
    worker()
      .call(
        { kind: 'imitate', seed: freshSeed(), demo },
        {
          transfer: [demo.inputs.buffer as ArrayBuffer, demo.actions.buffer as ArrayBuffer],
          onProgress: (progress) => {
            if (generation === generationRef.current) publishCurve([...curveRef.current, progress.similarity])
          },
        },
      )
      .then((result) => {
        if (generation !== generationRef.current) return
        const net = netFromArrays(result.weights)
        if (!net) return
        resetRecorder(match.recorder)
        netRef.current = net
        similarityRef.current = result.similarity ?? 0
        trainedRef.current = recordedRef.current
        match.setNet(net)
        match.rivalDriver = 'net'
        publishCurve(result.curve)
        setWeights(result.weights)
        setSimilarity(similarityRef.current)
        enterStage('clone')
        const ready = cloneText.ready(percent(similarityRef.current))
        setStatus(ready)
        setLive(ready)
        void persist()
      })
      .catch(() => {
        if (generation !== generationRef.current) return
        match.recorder.inputs = Array.from(keep.inputs)
        match.recorder.actions = Array.from(keep.actions)
        enterStage('record')
      })
      .finally(() => {
        if (generation !== generationRef.current) return
        busyRef.current = false
        setTraining(false)
      })
  }, [enterStage, labels, persist, publishCurve, worker])

  const onRally = useCallback(
    (outcome: RallyOutcome) => {
      const match = matchRef.current
      if (!match) return
      if (mode === 'rival') {
        if (outcome.rate !== null) publishCurve([...curveRef.current, outcome.rate])
        pendingRef.current.push(...outcome.episodes)
        sinceTrainRef.current += 1
        train()
        return
      }
      if (stageRef.current !== 'record') return
      recordedRef.current += 1
      setRecorded(recordedRef.current)
      const cloneText = labels as CloneLabels
      const next = recordedRef.current + 1
      if (recordedRef.current >= CLONE_RECORD_RALLIES && recordedSamples(match.recorder) >= CLONE_MIN_SAMPLES) imitate()
      else setStatus(cloneText.record(next, Math.max(CLONE_RECORD_RALLIES, next)))
    },
    [imitate, labels, mode, publishCurve, train],
  )

  useEffect(() => {
    handlerRef.current = (event) => {
      const match = matchRef.current
      if (!match) return
      switch (event.type) {
        case 'phase':
          setServing(event.serving)
          if (event.phase === 'serve') {
            setScore({ ...match.state.score })
            setGame(match.state.game)
          }
          break
        case 'serve':
          setRally(match.state.rally)
          if (stageRef.current === 'record' && recordedRef.current === 0 && mode === 'clone') {
            setStatus((labels as CloneLabels).record(1, CLONE_RECORD_RALLIES))
          }
          break
        case 'pause':
          brainRef.current?.freeze(event.paused)
          setPaused(event.paused)
          if (!event.paused) {
            startedRef.current = true
            setStarted(true)
          }
          if (event.paused && !startedRef.current) break
          if (event.paused) {
            pauseNoticeRef.current = true
            setStatus(event.reasons.includes('hidden') ? labels.shared.hidden : labels.paused)
          } else if (watchRef.current) {
            pauseNoticeRef.current = false
            setStatus(labels.watching)
          } else if (pauseNoticeRef.current) {
            pauseNoticeRef.current = false
            setStatus('')
          }
          break
        case 'point': {
          const values = { you: event.score.player, rival: event.score.rival }
          setScore(event.score)
          if (event.game) {
            const message = event.game === 'player' ? labels.won.you(values, event.nextGame) : labels.won.rival(values, event.nextGame)
            setLive(message)
          } else if (!watchRef.current) {
            setLive(event.winner === 'player' ? labels.point.you(values) : labels.point.rival(values))
          }
          break
        }
        case 'rally':
          onRally(event.outcome)
          break
        case 'adapt':
          trainEveryRef.current = event.adaptation.trainEvery
          if (event.adaptation.level > 0 && !warnedRef.current.slow) {
            warnedRef.current.slow = true
            setStatus(labels.slow)
          }
          break
      }
    }
  })

  useEffect(() => {
    if (snapshot === undefined) return
    const canvas = canvasRef.current
    const surface = surfaceRef.current
    const root = rootRef.current
    const match = matchRef.current
    if (!canvas || !surface || !root || !match) return
    const controller = new GameController({
      canvas,
      surface,
      match,
      reducedMotion: window.matchMedia(REDUCED_MOTION).matches,
      onEvent: (event) => handlerRef.current(event),
      onBrain: (trace, action) => brainRef.current?.update(trace, action),
    })
    controllerRef.current = controller
    controller.pause('user')
    const fit = () => {
      const next: Orientation = root.clientWidth < PORTRAIT_BELOW ? 'portrait' : 'landscape'
      if (next !== orientationRef.current) {
        orientationRef.current = next
        setOrientation(next)
      }
      if (canvas.clientWidth > 0 && canvas.clientHeight > 0) controller.resize(canvas.clientWidth, canvas.clientHeight, orientationRef.current)
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit)
    observer?.observe(root)
    observer?.observe(canvas)
    const first = observer ? null : requestAnimationFrame(fit)
    return () => {
      observer?.disconnect()
      if (first !== null) cancelAnimationFrame(first)
      controller.destroy()
      controllerRef.current = null
    }
  }, [snapshot])

  useEffect(() => {
    controllerRef.current?.setReducedMotion(reduced)
  }, [reduced])

  const forget = useCallback(
    (cleared: boolean) => {
      generationRef.current += 1
      if (!cleared) void labStore.delete(GAME_KEYS[mode])
      prepare(null)
      const match = matchRef.current
      if (match) controllerRef.current?.setMatch(match)
      startedRef.current = false
      pauseNoticeRef.current = false
      setStarted(false)
      controllerRef.current?.setWatching(false)
      controllerRef.current?.pause('user')
      if (!cleared) setStatus(labels.resetDone)
    },
    [labels, mode, prepare],
  )

  useEffect(() => onLabCleared(() => forget(true)), [forget])

  const ready = snapshot !== undefined

  useEffect(() => {
    if (!ready) return
    let frame = 0
    let last = ''
    let steady = 0
    let frames = 0
    const settle = () => {
      const court = surfaceRef.current
      if (!court) return
      const box = court.getBoundingClientRect()
      const key = `${Math.round(box.top)}:${Math.round(box.height)}`
      steady = key === last ? steady + 1 : 0
      last = key
      frames += 1
      if (steady >= 4 || frames > 120) {
        revealCourt(court, window.matchMedia(REDUCED_MOTION).matches)
        return
      }
      frame = requestAnimationFrame(settle)
    }
    frame = requestAnimationFrame(settle)
    return () => cancelAnimationFrame(frame)
  }, [ready])

  const focusCourt = () => {
    surfaceRef.current?.focus({ preventScroll: true })
    revealCourt(surfaceRef.current, reduced)
  }

  const primary = () => {
    const controller = controllerRef.current
    if (!controller) return
    if (controller.paused) {
      controller.resume('user')
      focusCourt()
    } else {
      controller.pause('user')
    }
  }

  const serve = () => {
    controllerRef.current?.serve()
    focusCourt()
  }

  const toggleWatch = () => {
    const next = !watchRef.current
    watchRef.current = next
    setWatch(next)
    controllerRef.current?.setWatching(next)
    if (next) {
      controllerRef.current?.resume('user')
      setStatus(labels.watching)
    }
  }

  const keepLearning = () => {
    evictedRef.current = false
    setEvicted(false)
    if (mode === 'rival') {
      sinceTrainRef.current = Math.max(sinceTrainRef.current, trainEveryRef.current)
      train()
    } else if (stageRef.current === 'record' && recordedRef.current >= CLONE_RECORD_RALLIES) {
      imitate()
    }
  }

  const rerecord = () => {
    generationRef.current += 1
    const match = matchRef.current
    if (!match) return
    resetRecorder(match.recorder)
    match.record = true
    match.rivalDriver = 'coach'
    match.setNet(null)
    netRef.current = null
    similarityRef.current = null
    recordedRef.current = 0
    busyRef.current = false
    setTraining(false)
    setRecorded(0)
    setSimilarity(null)
    setWeights(null)
    publishCurve([])
    if (watchRef.current) toggleWatch()
    enterStage('record')
    setStatus(labels.fresh)
  }

  const clone = isClone(labels, mode) ? labels : null
  const rival = mode === 'rival' ? (labels as RivalLabels) : null
  const rivalName = clone && stage !== 'clone' ? clone.sparring : labels.rival
  const values = { you: score.player, rival: score.rival }
  const canWatch = mode === 'rival' || stage === 'clone'
  const brainLabels = useMemo(
    () => ({ ...labels.brain, actions: orientation === 'portrait' ? labels.brain.actionsAcross : labels.brain.actions }),
    [labels, orientation],
  )

  let overlay: string | null = null
  if (snapshot !== undefined) {
    if (paused) overlay = started ? labels.overlay.paused : labels.overlay.start
    else if (serving && !watch) overlay = labels.overlay.serve
  }

  let summary: string | null = null
  if (rival && curve.length === 1) {
    summary = rival.firstRally(percent(curve[0]!))
  } else if (rival && curve.length > 1) {
    const window = Math.min(SUMMARY_WINDOW, curve.length)
    summary = rival.summary(percent(mean(curve.slice(0, Math.min(3, curve.length)))), percent(mean(curve.slice(-window))), window, Math.max(trained, curve.length))
  } else if (clone && curve.length > 1) {
    summary = clone.summary(percent(curve[0]!), percent(curve.at(-1)!), curve.length - 1)
  }

  return (
    <div
      ref={rootRef}
      className={styles.game}
      data-cw-rally={mode}
      data-orientation={orientation}
      data-stage={mode === 'clone' ? stage : undefined}
      data-trained={trained}
      data-recorded={mode === 'clone' ? recorded : undefined}
      data-watch={watch ? '' : undefined}
      data-training={training ? '' : undefined}
      data-ready={snapshot === undefined ? undefined : ''}
    >
      <div className={styles.play}>
        <div className={styles.hud}>
          <p className={styles.score} data-cw-rally-score="">
            <span className="cw-visually-hidden">{labels.scoreLabel(values)}</span>
            <span className={styles.scoreView} aria-hidden="true">
              <span className={styles.side}>{labels.you}</span>
              <span className={styles.points} data-side="player">
                {score.player}
              </span>
              <span className={styles.dash}>—</span>
              <span className={styles.points} data-side="rival">
                {score.rival}
              </span>
              <span className={cx(styles.side, styles.sideRival)}>{rivalName}</span>
            </span>
          </p>
          <p className={styles.meta}>{labels.meta(game, Math.max(rally, 1))}</p>
        </div>

        <div
          ref={surfaceRef}
          className={styles.court}
          role="application"
          tabIndex={0}
          aria-label={labels.game}
          aria-describedby={helpId}
          data-cw-rally-court=""
          data-state="paused"
        >
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
          {overlay ? (
            <p className={styles.overlay} aria-hidden="true" data-cw-rally-overlay="">
              {overlay}
            </p>
          ) : null}
        </div>

        <p id={helpId} className={styles.help}>
          {labels.help}
        </p>

        <div className={styles.controls}>
          <Button variant="solid" className={styles.control} onClick={primary} data-cw-rally-toggle="">
            {paused ? (started ? labels.resume : labels.play) : labels.pause}
          </Button>
          <Button className={styles.control} onClick={serve} disabled={!serving || watch} data-cw-rally-serve="">
            {labels.serve}
          </Button>
          {canWatch ? (
            <Button className={styles.control} onClick={toggleWatch} aria-pressed={watch} data-cw-rally-watch="">
              {labels.watch}
            </Button>
          ) : null}
          {clone && stage === 'clone' ? (
            <Button className={styles.control} onClick={rerecord} data-cw-rally-rerecord="">
              {clone.rerecord}
            </Button>
          ) : null}
          {evicted ? (
            <Button className={styles.control} onClick={keepLearning} data-cw-rally-keep="">
              {labels.keepLearning}
            </Button>
          ) : null}
          <Button variant="ghost" className={styles.control} onClick={() => forget(false)} data-cw-rally-reset="">
            {labels.reset}
          </Button>
        </div>

        <p className={styles.status} role="status" data-cw-rally-status="">
          {status}
        </p>
        <p className="cw-visually-hidden" aria-live="polite" aria-atomic="true" data-cw-rally-live="">
          {live}
        </p>
      </div>

      <div className={styles.panel}>
        <BrainPanel ref={brainRef} sizes={NET_SIZES} weights={weights} labels={brainLabels} still={reduced} />
        {clone && similarity !== null ? (
          <div className={styles.likeness} data-cw-rally-similarity={percent(similarity)}>
            <p className={styles.likenessValue}>
              {clone.similarity}: <strong>{percent(similarity)} %</strong>
            </p>
            <p className={styles.caption}>{clone.similarityHelp(percent(similarity))}</p>
          </div>
        ) : null}
        <LearningCurve points={curve} labels={{ ...labels.curve, summary }} />
        {rival && training ? (
          <p className={styles.caption} data-cw-rally-learning="">
            {rival.learning}
          </p>
        ) : rival && trained > 0 ? (
          <p className={styles.caption}>{rival.learned(trained)}</p>
        ) : null}
      </div>
    </div>
  )
}

export function RallyDemo({ experiment, t }: LabDemoProps) {
  const labels = useMemo(() => rivalLabels(t), [t])
  return <Rally mode="rival" experiment={experiment} labels={labels} />
}

export function CloneDemo({ experiment, t }: LabDemoProps) {
  const labels = useMemo(() => cloneLabels(t), [t])
  return <Rally mode="clone" experiment={experiment} labels={labels} />
}
