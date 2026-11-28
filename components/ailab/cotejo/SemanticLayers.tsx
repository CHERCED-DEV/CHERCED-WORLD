'use client'

import type { CotejoReport, Lang } from 'cotejo-core'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { COTEJO_DEFECTS } from '@/content/ailab/cotejo/truth'
import type { LabDownload, LabExperimentId } from '@/content/types'
import { formatBytes } from '@/lib/ailab/core/format'
import { hasConsent, onConsentChange, requestDownload, toDownloadRequest } from '@/lib/ailab/core/consent'
import { semanticDevice, type CotejoClient } from '@/lib/ailab/cotejo/client'
import { candidateRecall } from '@/lib/ailab/cotejo/metrics'
import type { CandidateView, RankedView, SemanticDevice, SemanticModelKind, SemanticView } from '@/lib/ailab/cotejo/protocol'
import { NLI_MODELS, SEMANTIC_RESOURCES } from '@/lib/ailab/cotejo/semantic'
import type { Locale } from '@/lib/i18n/config'
import { cotejoMs, cotejoNumber, cotejoPercent, cotejoText } from './copy'
import styles from './CotejoStage.module.scss'

export type LayerPhase = 'off' | 'asking' | 'declined' | 'loading' | 'running' | 'ready' | 'failed' | 'revoked'

type LayerState = { phase: LayerPhase; loaded: number; total: number }

const OFF: LayerState = { phase: 'off', loaded: 0, total: 0 }

const LIST_LIMIT = 8

const PAIR_CHARS = 120

export type SemanticLayersProps = {
  lang: Locale
  experiment: LabExperimentId
  client: CotejoClient
  downloads: readonly LabDownload[]
  specLang: Lang
  sample: boolean
  disabled: boolean
  onResult: (report: CotejoReport, view: SemanticView | null) => void
}

export function semanticDownloads(downloads: readonly LabDownload[], specLang: Lang): { embeddings: LabDownload | null; nli: LabDownload | null } {
  return {
    embeddings: downloads.find((download) => download.resource === SEMANTIC_RESOURCES.embeddings) ?? null,
    nli: downloads.find((download) => download.resource === SEMANTIC_RESOURCES.nli[specLang]) ?? null,
  }
}

function clip(text: string): string {
  return text.length > PAIR_CHARS ? `${text.slice(0, PAIR_CHARS - 1)}…` : text
}

function Pair({ lang, pair, extra }: { lang: Locale; pair: CandidateView; extra: string }) {
  const text = cotejoText(lang)
  return (
    <li data-cw-cotejo-pair={`${pair.a.line ?? ''}-${pair.b.line ?? ''}`}>
      <strong>{text('cotejo.semantic.pair', { a: pair.a.id ?? `L${pair.a.line ?? '?'}`, b: pair.b.id ?? `L${pair.b.line ?? '?'}` })}</strong>
      {' · '}
      {extra}
      <br />
      <span className={styles.muted}>
        «{clip(pair.a.text)}» / «{clip(pair.b.text)}»
      </span>
    </li>
  )
}

function Ranked({ lang, pairs, metric }: { lang: Locale; pairs: RankedView[]; metric: 'contradiction' | 'entailment' }) {
  const text = cotejoText(lang)
  if (pairs.length === 0) return <p className={styles.muted}>{text('cotejo.semantic.none')}</p>
  return (
    <ol className={styles.pairs}>
      {pairs.slice(0, LIST_LIMIT).map((pair) => (
        <Pair
          key={`${pair.a.line}-${pair.b.line}`}
          lang={lang}
          pair={pair}
          extra={text(`cotejo.semantic.${metric}`, { value: cotejoNumber(pair[metric], lang, 2), cosine: cotejoNumber(pair.cosine, lang, 2) })}
        />
      ))}
    </ol>
  )
}

export function SemanticLayers({ lang, experiment, client, downloads, specLang, sample, disabled, onResult }: SemanticLayersProps) {
  const text = cotejoText(lang)
  const [device] = useState<SemanticDevice>(() => semanticDevice())
  const [embeddings, setEmbeddings] = useState<LayerState>(OFF)
  const [nli, setNli] = useState<LayerState>(OFF)
  const [view, setView] = useState<SemanticView | null>(null)
  const [failed, setFailed] = useState(false)
  const { embeddings: e5, nli: nliDownload } = semanticDownloads(downloads, specLang)
  const active = useRef({ embeddings: false, nli: false })

  useEffect(
    () =>
      onConsentChange(() => {
        const lost = (active.current.embeddings && e5 && !hasConsent(experiment, e5.resource)) || (active.current.nli && nliDownload && !hasConsent(experiment, nliDownload.resource))
        if (!lost) return
        active.current = { embeddings: false, nli: false }
        setView(null)
        setEmbeddings({ ...OFF, phase: 'revoked' })
        setNli(OFF)
        void client
          .unload()
          .then((report) => {
            if (report) onResult(report, null)
          })
          .catch(() => {})
      }),
    [client, e5, experiment, nliDownload, onResult],
  )

  const enable = async (kind: SemanticModelKind, download: LabDownload, set: (state: LayerState) => void): Promise<boolean> => {
    setFailed(false)
    if (!hasConsent(experiment, download.resource)) {
      set({ ...OFF, phase: 'asking' })
      if (!(await requestDownload(toDownloadRequest(experiment, download)))) {
        set({ ...OFF, phase: 'declined' })
        return false
      }
    }
    set({ phase: 'loading', loaded: 0, total: download.bytes })
    try {
      await client.load(kind, device, (loaded, total) => set({ phase: 'loading', loaded, total }))
      active.current[kind] = true
      set({ phase: 'running', loaded: 0, total: 0 })
      return true
    } catch {
      set({ ...OFF, phase: 'failed' })
      return false
    }
  }

  const run = async (withNli: boolean, set: (state: LayerState) => void) => {
    try {
      const result = await client.semantic(withNli)
      setView(result.semantic)
      onResult(result.report, result.semantic)
      set({ ...OFF, phase: 'ready' })
    } catch {
      setFailed(true)
      set({ ...OFF, phase: 'failed' })
    }
  }

  const turnOnEmbeddings = async () => {
    if (!e5) return
    if (await enable('embeddings', e5, setEmbeddings)) await run(false, setEmbeddings)
  }

  const turnOnNli = async () => {
    if (!nliDownload) return
    if (await enable('nli', nliDownload, setNli)) await run(true, setNli)
  }

  const busy = (state: LayerState) => state.phase === 'asking' || state.phase === 'loading' || state.phase === 'running'
  const coverage = view && sample ? candidateRecall(view.pairs, COTEJO_DEFECTS) : null

  const status = (state: LayerState, model: string) => {
    if (state.phase === 'asking') return text('cotejo.semantic.asking')
    if (state.phase === 'declined') return text('cotejo.semantic.declined')
    if (state.phase === 'loading') return text('cotejo.semantic.loading', { model, percent: cotejoPercent(state.loaded, state.total, lang) })
    if (state.phase === 'running') return text('cotejo.semantic.running')
    if (state.phase === 'failed') return text('cotejo.semantic.failed')
    if (state.phase === 'revoked') return text('cotejo.semantic.revoked')
    return null
  }

  return (
    <section className={styles.panel} aria-labelledby="cotejo-semantic-title" data-cw-cotejo-semantic={embeddings.phase}>
      <h4 id="cotejo-semantic-title" className={styles.panelTitle}>
        {text('cotejo.semantic.title')}
      </h4>
      <p className={styles.para}>{text('cotejo.semantic.intro')}</p>
      <p className={styles.muted} data-cw-cotejo-device={device}>
        {text(device === 'webgpu' ? 'cotejo.semantic.webgpu' : 'cotejo.semantic.wasm')}
      </p>
      <div className={styles.layers}>
        <div className={styles.layer} data-cw-cotejo-layer-state={embeddings.phase} data-layer="C2">
          <p className={styles.label}>{text('cotejo.semantic.embeddings.title')}</p>
          <p className={styles.muted}>{text('cotejo.semantic.embeddings.hint', { size: e5 ? formatBytes(e5.bytes, lang) : '—' })}</p>
          <Button
            variant="glass"
            size="sm"
            onClick={() => void turnOnEmbeddings()}
            disabled={disabled || !e5 || busy(embeddings) || embeddings.phase === 'ready'}
            aria-busy={busy(embeddings) || undefined}
            data-cw-cotejo-embeddings=""
          >
            {text(embeddings.phase === 'ready' ? 'cotejo.semantic.on' : 'cotejo.semantic.embeddings')}
          </Button>
          {embeddings.phase === 'loading' ? <progress className={styles.progress} max={embeddings.total || 1} value={embeddings.loaded} aria-label={text('cotejo.semantic.progress')} /> : null}
          <p className={styles.muted} role="status">
            {status(embeddings, 'multilingual-e5-small')}
          </p>
        </div>
        <div className={styles.layer} data-cw-cotejo-layer-state={nli.phase} data-layer="C3">
          <p className={styles.label}>{text('cotejo.semantic.nli.title')}</p>
          <p className={styles.muted}>
            {text('cotejo.semantic.nli.hint', {
              model: NLI_MODELS[specLang].split('/')[1] ?? NLI_MODELS[specLang],
              size: nliDownload ? formatBytes(nliDownload.bytes, lang) : '—',
              lang: text(`cotejo.lang.${specLang}`),
            })}
          </p>
          <Button
            variant="glass"
            size="sm"
            onClick={() => void turnOnNli()}
            disabled={disabled || !nliDownload || embeddings.phase !== 'ready' || busy(nli) || nli.phase === 'ready'}
            aria-busy={busy(nli) || undefined}
            data-cw-cotejo-nli=""
          >
            {text(nli.phase === 'ready' ? 'cotejo.semantic.on' : 'cotejo.semantic.nli')}
          </Button>
          {embeddings.phase !== 'ready' ? <p className={styles.muted}>{text('cotejo.semantic.nli.after')}</p> : null}
          {nli.phase === 'loading' ? <progress className={styles.progress} max={nli.total || 1} value={nli.loaded} aria-label={text('cotejo.semantic.progress')} /> : null}
          <p className={styles.muted} role="status">
            {status(nli, NLI_MODELS[specLang].split('/')[1] ?? '')}
          </p>
        </div>
      </div>
      {failed ? (
        <p className={styles.error} role="alert">
          {text('cotejo.semantic.failed')}
        </p>
      ) : null}
      {view ? (
        <div className={styles.evidence} data-cw-cotejo-semantic-result="">
          <p className={styles.para}>
            {text('cotejo.semantic.candidates', { total: view.total, units: view.units, ms: cotejoMs(view.ms.C2, lang), device: view.device.toUpperCase() })}
          </p>
          {coverage ? <p className={styles.para}>{text('cotejo.semantic.covered', { semantic: coverage.semantic, covered: coverage.covered.length })}</p> : null}
          {view.ranking ? (
            <>
              <p className={styles.note}>
                {text('cotejo.semantic.nliDone', {
                  ms: cotejoMs(view.ms.C3 ?? 0, lang),
                  inferences: view.ranking.stats.inferences,
                  cache: view.ranking.stats.cacheHits,
                })}
              </p>
              <p className={styles.label}>{text('cotejo.semantic.contradictions')}</p>
              <Ranked lang={lang} pairs={view.ranking.contradictions} metric="contradiction" />
              <p className={styles.label}>{text('cotejo.semantic.nearDuplicates')}</p>
              <Ranked lang={lang} pairs={view.ranking.nearDuplicates} metric="entailment" />
            </>
          ) : (
            <>
              <p className={styles.label}>{text('cotejo.semantic.top', { count: Math.min(LIST_LIMIT, view.candidates.length) })}</p>
              {view.candidates.length === 0 ? (
                <p className={styles.muted}>{text('cotejo.semantic.none')}</p>
              ) : (
                <ol className={styles.pairs}>
                  {view.candidates.slice(0, LIST_LIMIT).map((pair) => (
                    <Pair key={`${pair.a.line}-${pair.b.line}`} lang={lang} pair={pair} extra={text('cotejo.semantic.cosine', { value: cotejoNumber(pair.cosine, lang, 2) })} />
                  ))}
                </ol>
              )}
            </>
          )}
        </div>
      ) : null}
    </section>
  )
}
