'use client'

import Image from 'next/image'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { useGeminiListen, useListenVoice } from '@/components/blog/post/use-gemini-listen'
import { ChoiceChips } from '@/components/ui/ChoiceChips'
import { geminiSpeechEnv, geminiVoiceLike, type GeminiSpeechEnv } from '@/lib/ai/listen/client'
import { LISTEN_VOICE_LABELS, LISTEN_VOICES, type ListenVoice } from '@/lib/ai/listen/voices'
import { extractPost, isOnlineVoice, LANG_TAGS, pickVoice, speak, SPEECH_RATES, voicesFor, type PostReading, type ReadableNode } from '@/lib/ailab/voice/tts'
import { LocalNote, fill } from './parts'
import { SpeechControls, VoiceSelect, isActive, rateLabel, stopOnEscape } from './speech-parts'
import { useSpeechSession, useSpeechVoices } from './use-speech'
import styles from './Voice.module.scss'

export const SAMPLE_CODE = `const reader = readPost(body, 'es')
reader.subscribe(({ state, heading }) => console.log(state, heading))
reader.pause()
reader.resume()
reader.stop()`

const DIVIDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="24" viewBox="0 0 640 24"><path d="M0 12c40-14 80 14 120 0s80 14 120 0 80 14 120 0 80 14 120 0 80 14 120 0 80 14 40 0" fill="none" stroke="#7f8c8d" stroke-opacity=".55" stroke-width="2"/></svg>',
  )

const READING = 'data-cw-v3-reading'

type Engine = 'gemini' | 'browser'

type Choice = { voiceURI?: string | null; rate?: number; engine?: Engine; geminiVoice?: ListenVoice }

function isElement(node: unknown): node is Element {
  return typeof Element !== 'undefined' && node instanceof Element
}

export function PostReader({ lang, t }: LabDemoProps) {
  const { env, supported, voices, loading } = useSpeechVoices()
  const { snapshot, start, pause, resume, stop } = useSpeechSession()
  const [chosen, setChosen] = useState<string | null>(null)
  const [rate, setRate] = useState(1)
  const gemini = useGeminiListen(true) === true
  const [picked, setPicked] = useState<Engine | null>(null)
  const [geminiVoice, setGeminiVoice] = useListenVoice()
  const geminiEnv = useRef<GeminiSpeechEnv | null>(null)
  const engine: Engine = picked ?? (gemini ? 'gemini' : 'browser')
  const [reading, setReading] = useState<PostReading<ReadableNode> | null>(null)
  const post = useRef<HTMLElement>(null)
  const marked = useRef<Element | null>(null)
  const id = useId()

  const options = useMemo(() => voicesFor(voices, lang), [voices, lang])
  const voice = useMemo(() => pickVoice(voices, lang, chosen), [voices, lang, chosen])
  const online = engine === 'browser' && isOnlineVoice(voice)
  const active = isActive(snapshot)
  const title = t('ailab.v3.sample.title')

  const plan = () => {
    if (!post.current) return null
    const next = extractPost<ReadableNode>(post.current, { lang })
    setReading(next)
    return next
  }

  useEffect(() => {
    const node = active ? snapshot.chunk?.node : null
    if (marked.current && marked.current !== node) marked.current.removeAttribute(READING)
    marked.current = null
    if (isElement(node) && post.current?.contains(node)) {
      node.setAttribute(READING, '')
      marked.current = node
    }
  }, [active, snapshot.chunk])

  useEffect(() => () => geminiEnv.current?.dispose(), [])

  const run = (choice: Choice = {}, from = 0) => {
    const useEngine = choice.engine ?? engine
    const useRate = choice.rate ?? rate
    const useBrowserVoice = choice.voiceURI === undefined ? voice : pickVoice(voices, lang, choice.voiceURI)
    if (useEngine === 'browser' && !useBrowserVoice) return
    const next = plan()
    if (!next) return
    geminiEnv.current?.dispose()
    geminiEnv.current = null
    if (useEngine === 'gemini') {
      const id = choice.geminiVoice ?? geminiVoice
      const speechEnv = geminiSpeechEnv({ source: 'v3', lang, voice: id, fallback: supported ? env : null, texts: next.chunks.map((chunk) => chunk.text) })
      geminiEnv.current = speechEnv
      speechEnv.unlock()
      start(() => speak(next.chunks, { lang, voice: geminiVoiceLike(id, LANG_TAGS[lang]), rate: useRate, env: speechEnv, from }))
      return
    }
    start(() => speak(next.chunks, { lang, voice: useBrowserVoice, rate: useRate, env, from }))
  }

  const play = () => run()

  const change = (choice: Choice) => {
    if (choice.voiceURI !== undefined) setChosen(choice.voiceURI)
    if (choice.rate !== undefined) setRate(choice.rate)
    if (choice.engine !== undefined) setPicked(choice.engine)
    if (choice.geminiVoice !== undefined) setGeminiVoice(choice.geminiVoice)
    if (active) run(choice, Math.max(0, snapshot.index))
  }

  const canPlay = engine === 'gemini' || voice !== null

  const heading = snapshot.heading ?? title

  const statusText = (): string => {
    if (snapshot.state === 'playing') return fill(t('ailab.v3.status.reading'), { heading })
    if (snapshot.state === 'paused') return fill(t('ailab.v3.status.paused'), { heading })
    if (snapshot.ended === 'finished') return t('ailab.v3.status.finished')
    if (snapshot.ended === 'cancelled') return t('ailab.v3.status.stopped')
    if (snapshot.ended === 'error') return fill(t('ailab.v3.status.error'), { error: snapshot.error ?? '' })
    return ''
  }

  const kindLabel = {
    heading: t('ailab.v3.kind.heading'),
    text: t('ailab.v3.kind.text'),
    image: t('ailab.v3.kind.image'),
  }

  return (
    <div className={styles.demo} data-cw-voice="V3" onKeyDown={stopOnEscape(snapshot, stop)}>
      <LocalNote>{t(engine === 'gemini' ? 'ailab.v3.gemini.note' : 'ailab.v3.local')}</LocalNote>

      {!supported && !gemini ? (
        <p className={styles.problem} role="alert" data-cw-speech-unsupported="">
          {t('ailab.v3.unsupported')}
        </p>
      ) : (
        <>
          {gemini && supported ? (
            <ChoiceChips
              kind="v3-engine"
              legend={t('ailab.v3.engine.label')}
              options={[
                { value: 'gemini', label: t('ailab.v3.engine.gemini') },
                { value: 'browser', label: t('ailab.v3.engine.browser') },
              ]}
              value={engine}
              onChange={(value) => change({ engine: value })}
            />
          ) : null}
          {engine === 'gemini' ? (
            <ChoiceChips
              kind="v3-gemini-voice"
              legend={t('ailab.v3.gemini.voice')}
              options={LISTEN_VOICES.map((id) => ({ value: id, label: LISTEN_VOICE_LABELS[lang][id] }))}
              value={geminiVoice}
              onChange={(value) => change({ geminiVoice: value })}
            />
          ) : loading ? (
            <p className={styles.hint} role="status" data-cw-speech-voices="loading">
              {t('ailab.v3.voices.loading')}
            </p>
          ) : options.length === 0 ? (
            <p className={styles.problem} role="status" data-cw-speech-voices="none">
              {t('ailab.v3.voices.none')}
            </p>
          ) : (
            <div className={styles.form}>
              <VoiceSelect
                label={t('ailab.v3.voice.label')}
                voices={options}
                value={voice?.voiceURI ?? ''}
                onChange={(value) => change({ voiceURI: value })}
                onlineMark={t('ailab.v3.voice.online')}
              />
            </div>
          )}
          {engine === 'gemini' || options.length > 0 ? (
            <ChoiceChips
              kind="v3-rate"
              legend={t('ailab.v3.rate.label')}
              options={SPEECH_RATES.map((value) => ({ value: String(value), label: rateLabel(value, lang) }))}
              value={String(rate)}
              onChange={(value) => change({ rate: Number(value) })}
            />
          ) : null}

          {online && voice ? (
            <p id={`${id}-online`} className={styles.notice} role="status" data-cw-speech-online="">
              {fill(t('ailab.v3.online.warning'), { voice: voice.name })}
            </p>
          ) : null}

          <SpeechControls
            snapshot={snapshot}
            labels={{
              group: t('ailab.v3.controls'),
              play: t('ailab.v3.play'),
              pause: t('ailab.v3.pause'),
              resume: t('ailab.v3.resume'),
              stop: t('ailab.v3.stop'),
            }}
            onPlay={play}
            onPause={pause}
            onResume={resume}
            onStop={stop}
            canPlay={canPlay}
            describedBy={online ? `${id}-online` : undefined}
          />

          <div className={styles.status} data-cw-speech-status={snapshot.state === 'stopped' ? (snapshot.ended ?? 'idle') : snapshot.state}>
            <p role="status" aria-live="polite" aria-atomic="true">
              {statusText()}
            </p>
          </div>
        </>
      )}

      <article ref={post} className={styles.post} lang={lang} aria-labelledby={`${id}-post-title`} data-cw-v3-post="">
        <h5 id={`${id}-post-title`} className={styles.postTitle}>
          {title}
        </h5>
        <p>{t('ailab.v3.sample.intro')}</p>
        <Image src={DIVIDER} alt="" width={640} height={24} unoptimized className={styles.postDivider} data-cw-v3-decorative="" />
        <h6 className={styles.postHeading}>{t('ailab.v3.sample.h1')}</h6>
        <p>{t('ailab.v3.sample.p1')}</p>
        <ul className={styles.postList}>
          <li>{t('ailab.v3.sample.li1')}</li>
          <li>{t('ailab.v3.sample.li2')}</li>
        </ul>
        <p>{t('ailab.v3.sample.codeIntro')}</p>
        <div className={styles.postCode} data-cw-code="typescript">
          <pre tabIndex={0}>
            <code>{SAMPLE_CODE}</code>
          </pre>
        </div>
        <figure className={styles.postFigure}>
          <div className={styles.postDiagram} role="img" aria-label={t('ailab.v3.sample.figureAlt')} data-cw-v3-figure="">
            <span className={styles.postStep}>{t('ailab.v3.sample.figure.post')}</span>
            <span className={styles.postArrow}>→</span>
            <span className={styles.postStep}>{t('ailab.v3.sample.figure.voice')}</span>
            <span className={styles.postArrow}>→</span>
            <span className={styles.postStep}>{t('ailab.v3.sample.figure.speaker')}</span>
          </div>
          <figcaption className={styles.hint}>{t('ailab.v3.sample.figureCaption')}</figcaption>
        </figure>
        <h6 className={styles.postHeading}>{t('ailab.v3.sample.h2')}</h6>
        <p>{t('ailab.v3.sample.p2')}</p>
      </article>

      <details
        className={styles.commands}
        onToggle={(event) => {
          if (event.currentTarget.open) plan()
        }}
        data-cw-v3-plan=""
      >
        <summary className={styles.commandsSummary}>{t('ailab.v3.plan.title')}</summary>
        {reading ? (
          <>
            <p className={styles.hint} data-cw-v3-skipped="">
              {fill(t('ailab.v3.plan.summary'), { chunks: reading.chunks.length, code: reading.skipped.code, images: reading.skipped.decorative })}
            </p>
            <ol className={styles.planList}>
              {reading.chunks.map((chunk, index) => (
                <li key={index} data-cw-v3-chunk={chunk.kind} aria-current={active && snapshot.index === index ? 'step' : undefined}>
                  <span className={styles.planKind}>{kindLabel[chunk.kind]}</span> {chunk.text}
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </details>
    </div>
  )
}

export default PostReader
