'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '@/components/ui/cx'
import type { Locale } from '@/lib/i18n'
import styles from './Brain.module.scss'
import { BRAIN_VIEW, BRAIN_CORE, blockBar, decodeFrame, lobeFromHash, lobePoint, neuronGeometry, type BrainData } from './brain'
import { BrainTerminal, type BrainTerminalLabels } from './BrainTerminal'
import { LobeMeta, LobePrinciples } from './LobeParts'
import { monogram } from './monogram'
import { startRain } from './rain'
import type { TerminalTable } from './terminalInput'

export type BrainLabels = {
  lobes: string
  sources: string
  sourcesWord: string
  appliedWord: string
  projectsWord: string
  principles: string
  words: string
  feeds: string
  core: string
  path: string
  levels: Record<string, string>
  platzi: { href: string; label: string; newTab: string }
  terminal: BrainTerminalLabels
}

export type BrainMapProps = {
  data: BrainData
  labels: BrainLabels
  lang: Locale
  terminal: TerminalTable
  children?: ReactNode
}

type Selection = { kind: 'lobe' | 'source'; id: string }

const DECODE_FRAMES = 14
const DECODE_MS = 32

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function DecodedTitle({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (reducedMotion()) {
      node.textContent = text
      return
    }
    let frame = 0
    const timer = window.setInterval(() => {
      frame += 1
      node.textContent = decodeFrame(text, frame, DECODE_FRAMES)
      if (frame >= DECODE_FRAMES) window.clearInterval(timer)
    }, DECODE_MS)
    return () => {
      window.clearInterval(timer)
      node.textContent = text
    }
  }, [text])

  return (
    <>
      <span key={text} ref={ref} aria-hidden="true" data-cw-decode="">
        {text}
      </span>
      <span className="cw-visually-hidden">{text}</span>
    </>
  )
}

export function BrainMap({ data, labels, lang, terminal, children }: BrainMapProps) {
  const first = data.lobes[0]
  const [selection, setSelection] = useState<Selection>({ kind: 'lobe', id: first?.id ?? '' })
  const lobeRefs = useRef<Array<HTMLButtonElement | null>>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const words = data.lobes.flatMap((lobe) => lobe.skills.map((skill) => skill.name))
  const rainWords = useRef(words)
  const lobeIds = data.lobes.map((item) => item.id)
  const lobeKey = lobeIds.join(' ')

  const [warm, setWarm] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return startRain(canvas, rainWords.current)
  }, [])

  useEffect(() => {
    const start = () => setWarm(true)
    if (document.readyState === 'complete') {
      const timer = window.setTimeout(start, 1200)
      return () => window.clearTimeout(timer)
    }
    const onLoad = () => window.setTimeout(start, 600)
    window.addEventListener('load', onLoad, { once: true })
    return () => window.removeEventListener('load', onLoad)
  }, [])

  useEffect(() => {
    const ids = lobeKey.split(' ')
    const apply = () => {
      const id = lobeFromHash(window.location.hash, ids)
      if (!id) return
      setSelection({ kind: 'lobe', id })
      mapRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
      const active = document.activeElement
      if (!active || active === document.body) lobeRefs.current[ids.indexOf(id)]?.focus({ preventScroll: true })
    }
    apply()
    const navigation = (window as Window & { navigation?: EventTarget }).navigation
    window.addEventListener('hashchange', apply)
    window.addEventListener('popstate', apply)
    navigation?.addEventListener('currententrychange', apply)
    return () => {
      window.removeEventListener('hashchange', apply)
      window.removeEventListener('popstate', apply)
      navigation?.removeEventListener('currententrychange', apply)
    }
  }, [lobeKey])

  if (!first) return <>{children}</>

  const lobe =selection.kind === 'lobe' ? (data.lobes.find((item) => item.id === selection.id) ?? first) : null
  const source = selection.kind === 'source' ? (data.sources.find((item) => item.id === selection.id) ?? null) : null
  const litSources = new Set(lobe ? lobe.sources : source ? [source.id] : [])
  const litLobes = new Set(lobe ? [lobe.id] : data.lobes.filter((item) => source && item.sources.includes(source.id)).map((item) => item.id))
  const sourceLabel = (id: string) => data.sources.find((item) => item.id === id)?.label ?? id
  const wordLobes = data.lobes.filter((item) => item.words)
  const status = lobe
    ? `${lobe.name}: ${lobe.skills.map((skill) => `${skill.name} ${labels.levels[skill.id] ?? `${skill.level}%`}`).join(', ')}`
    : source
      ? `${source.label}: ${source.title}`
      : ''

  const onLobeKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    const edge = event.key === 'Home' ? 0 : event.key === 'End' ? data.lobes.length - 1 : null
    if (step === 0 && edge === null) return
    event.preventDefault()
    const next = edge ?? (index + step + data.lobes.length) % data.lobes.length
    const target = data.lobes[next]
    if (!target) return
    setSelection({ kind: 'lobe', id: target.id })
    lobeRefs.current[next]?.focus()
  }

  return (
    <>
      <div className={cx(styles.stage, 'cw-js-only')} data-cw-brain="">
        <canvas ref={canvasRef} className={styles.rain} aria-hidden="true" data-cw-rain="" />
        <div className={styles.iconWarmer} aria-hidden="true">
          {warm
            ? [...new Set(data.lobes.flatMap((item) => item.skills.flatMap((skill) => (skill.icon ? [skill.icon] : []))))].map((icon) => (
                <Image key={icon} src={icon} alt="" width={22} height={22} loading="eager" unoptimized={icon.endsWith('.svg')} />
              ))
            : null}
        </div>
        <div className={styles.layout}>
          <div className={styles.mapColumn}>
            <div ref={mapRef} className={styles.map} data-cw-glass="subtle" data-cw-brain-map="">
              <svg className={styles.svg} viewBox={`0 0 ${BRAIN_VIEW.width} ${BRAIN_VIEW.height}`} aria-hidden="true" focusable="false">
                <circle className={styles.ring} cx={BRAIN_CORE.x} cy={BRAIN_CORE.y} r="92" />
                {data.lobes.map((item, index) => {
                  const geometry = neuronGeometry(
                    index,
                    item.skills.map((skill) => skill.level),
                    data.lobes.length,
                  )
                  const on = litLobes.has(item.id)
                  return (
                    <g key={item.id} data-cw-synapses={item.id} data-on={on ? '' : undefined}>
                      <path className={cx(styles.syn, on && styles.synOn)} d={geometry.synapse} />
                      {geometry.neurons.map((neuron, n) => (
                        <g key={item.skills[n]?.id ?? n}>
                          <path className={cx(styles.syn, on && styles.synOn)} d={neuron.line} />
                          <circle className={cx(styles.neuron, on && styles.neuronOn)} cx={neuron.x} cy={neuron.y} r={neuron.r} />
                        </g>
                      ))}
                    </g>
                  )
                })}
              </svg>
              <div className={styles.core} aria-hidden="true">
                {labels.core}
              </div>
              <div className={styles.lobes} role="group" aria-label={labels.lobes}>
                {data.lobes.map((item, index) => {
                  const point = lobePoint(index, data.lobes.length)
                  return (
                    <button
                      key={item.id}
                      ref={(node) => {
                        lobeRefs.current[index] = node
                      }}
                      type="button"
                      className={styles.lobe}
                      aria-pressed={lobe?.id === item.id}
                      data-lit={litLobes.has(item.id) ? '' : undefined}
                      data-cw-lobe={item.id}
                      data-cw-glass="subtle"
                      style={{ '--cw-x': `${(point.x / BRAIN_VIEW.width) * 100}%`, '--cw-y': `${(point.y / BRAIN_VIEW.height) * 100}%` } as CSSProperties}
                      onClick={() => setSelection({ kind: 'lobe', id: item.id })}
                      onKeyDown={(event) => onLobeKey(event, index)}
                    >
                      {item.name}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className={styles.sources} role="group" aria-label={labels.sources}>
              {data.sources.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.source}
                  aria-pressed={source?.id === item.id}
                  data-lit={litSources.has(item.id) ? '' : undefined}
                  data-cw-source={item.id}
                  data-cw-glass="subtle"
                  onClick={() => setSelection({ kind: 'source', id: item.id })}
                >
                  {item.label}
                </button>
              ))}
              <a className={cx(styles.source, styles.sourceLink)} href={labels.platzi.href} target="_blank" rel="noopener noreferrer" data-cw-glass="subtle" data-cw-platzi="">
                {labels.platzi.label}
                <span aria-hidden="true"> ↗</span>
                <span className="cw-visually-hidden">{labels.platzi.newTab}</span>
              </a>
            </div>
          </div>
          <aside className={styles.terminal} data-cw-glass="strong" data-cw-terminal="">
            <div className={styles.termBar} aria-hidden="true">
              <span className={styles.dots}>
                <i />
                <i />
                <i />
              </span>
              <span>{labels.path}</span>
            </div>
            <p className="cw-visually-hidden" aria-live="polite" data-cw-terminal-status="">
              {status}
            </p>
            <div className={styles.termBody} data-cw-terminal-body={lobe?.id ?? source?.id}>
              <p className={styles.termCmd} aria-hidden="true">
                <span className={styles.prompt} aria-hidden="true">
                  ${' '}
                </span>
                cat {lobe ? `${lobe.id}.lobe` : `${source?.id}.src`}
                <span className={styles.cursor} aria-hidden="true" />
              </p>
              <h3 className={styles.termTitle}>
                <DecodedTitle text={lobe ? lobe.name : (source?.label ?? '')} />
              </h3>
              {lobe ? (
                <>
                  <ul className={styles.termRows} data-cw-term-rows="" data-long={lobe.skills.length > 7 ? '' : undefined} tabIndex={lobe.skills.length > 7 ? 0 : undefined} aria-label={lobe.skills.length > 7 ? lobe.name : undefined}>
                    {lobe.skills.map((skill) => {
                      const bar = blockBar(skill.level)
                      return (
                        <li key={skill.id} className={styles.termRow} data-cw-brain-skill={skill.id}>
                          {skill.icon ? (
                            <Image src={skill.icon} alt="" width={22} height={22} loading="eager" decoding="sync" unoptimized={skill.icon.endsWith('.svg')} className={styles.termIcon} />
                          ) : (
                            <span className={`${styles.termIcon} ${styles.termMonogram}`} data-cw-monogram={monogram(skill.name)} aria-hidden="true" />
                          )}
                          <span className={styles.termName}>{skill.name}</span>
                          <span className={styles.termLevel}>
                            {skill.used ? (
                              <span className={styles.usedChip} data-cw-used="">
                                {skill.used}
                              </span>
                            ) : null}
                            {labels.levels[skill.id] ?? `${skill.level}%`}
                          </span>
                          <span className={styles.termBar} aria-hidden="true">
                            <span className={styles.barOn}>{bar.on}</span>
                            <span className={styles.barOff}>{bar.off}</span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <LobePrinciples lobe={lobe} label={labels.principles} idPrefix="panel" />
                  {lobe.learning ? (
                    <p className={styles.termLearning} data-cw-learning="">
                      {lobe.learning}
                    </p>
                  ) : null}
                  <LobeMeta lobe={lobe} lang={lang} labels={labels} sourceLabel={sourceLabel} />
                </>
              ) : source ? (
                <>
                  <div className={styles.termSource}>
                    <p className={styles.termName}>{source.title}</p>
                    {source.detail ? <p>{source.detail}</p> : null}
                    {source.period ? <p className={styles.termLevel}>{source.period}</p> : null}
                  </div>
                  {data.lobes.some((item) => item.sources.includes(source.id)) ? (
                    <p className={styles.termMeta}>
                      <span className={styles.metaLine} data-cw-meta="feeds">
                        <strong>{labels.feeds}:</strong>{' '}
                        {data.lobes
                          .filter((item) => item.sources.includes(source.id))
                          .map((item) => item.name)
                          .join(' · ')}
                      </span>
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
            <BrainTerminal table={terminal} lobeIds={lobeIds} labels={labels.terminal} onLobe={(id) => setSelection({ kind: 'lobe', id })} />
          </aside>
        </div>
      </div>
      {children}
      {wordLobes.length > 0 ? (
        <details className={styles.words} data-cw-glass="standard" data-cw-words="" data-empty={lobe?.words ? undefined : ''}>
          <summary className={styles.wordsSummary}>{labels.words}</summary>
          {wordLobes.map((item) => (
            <section
              key={item.id}
              className={styles.wordsLobe}
              data-cw-words-lobe={item.id}
              data-active={lobe?.id === item.id ? '' : undefined}
              aria-labelledby={`words-${item.id}`}
            >
              <h3 id={`words-${item.id}`} className={styles.wordsTitle}>
                {item.name}
              </h3>
              <p className={styles.wordsText}>{item.words}</p>
            </section>
          ))}
        </details>
      ) : null}
    </>
  )
}
