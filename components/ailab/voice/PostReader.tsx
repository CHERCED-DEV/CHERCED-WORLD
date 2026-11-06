'use client'

import Image from 'next/image'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { extractPost, isOnlineVoice, pickVoice, speak, voicesFor, type PostReading, type ReadableNode } from '@/lib/ailab/voice/tts'
import { LocalNote, fill } from './parts'
import { RateSelect, SpeechControls, VoiceSelect, isActive, stopOnEscape } from './speech-parts'
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

function isElement(node: unknown): node is Element {
  return typeof Element !== 'undefined' && node instanceof Element
}

export function PostReader({ lang, t }: LabDemoProps) {
  const { env, supported, voices, loading } = useSpeechVoices()
  const { snapshot, start, pause, resume, stop } = useSpeechSession()
  const [chosen, setChosen] = useState<string | null>(null)
  const [rate, setRate] = useState(1)
  const [reading, setReading] = useState<PostReading<ReadableNode> | null>(null)
  const post = useRef<HTMLElement>(null)
  const marked = useRef<Element | null>(null)
  const id = useId()

  const options = useMemo(() => voicesFor(voices, lang), [voices, lang])
  const voice = useMemo(() => pickVoice(voices, lang, chosen), [voices, lang, chosen])
  const online = isOnlineVoice(voice)
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

  const play = () => {
    const next = voice ? plan() : null
    if (!next) return
    start(() => speak(next.chunks, { lang, voice, rate, env }))
  }

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
      <LocalNote>{t('ailab.v3.local')}</LocalNote>

      {!supported ? (
        <p className={styles.problem} role="alert" data-cw-speech-unsupported="">
          {t('ailab.v3.unsupported')}
        </p>
      ) : (
        <>
          {loading ? (
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
                onChange={setChosen}
                onlineMark={t('ailab.v3.voice.online')}
                disabled={active}
              />
              <RateSelect label={t('ailab.v3.rate.label')} lang={lang} value={rate} onChange={setRate} disabled={active} />
            </div>
          )}

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
            canPlay={voice !== null}
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
          <svg className={styles.postDiagram} viewBox="0 0 320 64" role="img" aria-label={t('ailab.v3.sample.figureAlt')} data-cw-v3-figure="">
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="4" y="16" width="84" height="32" rx="8" />
              <rect x="118" y="16" width="84" height="32" rx="8" />
              <rect x="232" y="16" width="84" height="32" rx="8" />
              <path d="M92 32h20m-6-5 6 5-6 5M206 32h20m-6-5 6 5-6 5" />
            </g>
            <g fill="currentColor" fontSize="12" textAnchor="middle">
              <text x="46" y="36">{t('ailab.v3.sample.figure.post')}</text>
              <text x="160" y="36">{t('ailab.v3.sample.figure.voice')}</text>
              <text x="274" y="36">{t('ailab.v3.sample.figure.speaker')}</text>
            </g>
          </svg>
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
