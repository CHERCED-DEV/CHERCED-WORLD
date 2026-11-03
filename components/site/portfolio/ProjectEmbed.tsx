'use client'

import Image from 'next/image'
import { useCallback, useEffect, useId, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { cx } from '@/components/ui/cx'
import { Icon } from '@/components/ui/Icon'
import { fillTemplate } from './carousel'
import {
  canAutoLoad,
  EMBED_SANDBOX,
  EMBED_TIMEOUT_MS,
  embedAddress,
  embedFrameMounted,
  ENGAGE_KEYS,
  nextEmbedStatus,
  type EmbedEvent,
  type EmbedStatus,
} from './embed'
import styles from './ProjectEmbed.module.scss'
import { PortfolioIcon } from './PortfolioIcon'

export type EmbedLabels = {
  heading: string
  intro: string
  load: string
  open: string
  loading: string
  ready: string
  reload: string
  openLive: string
  expand: string
  collapse: string
  view: string
  desktop: string
  mobile: string
  frame: string
  slowTitle: string
  slowBody: string
  retry: string
  close: string
  noScript: string
}

export type ProjectEmbedProps = {
  id?: string
  url: string
  title: string
  poster: { src: string; alt: string; width: number; height: number }
  labels: EmbedLabels
}

type Device = 'desktop' | 'mobile'
type Surface = 'inline' | 'sheet'

type LoaderState = { status: EmbedStatus; key: number }

function loaderReducer(state: LoaderState, event: EmbedEvent): LoaderState {
  const status = nextEmbedStatus(state.status, event)
  const remount = event === 'reload' || (event === 'request' && state.status === 'slow')
  if (status === state.status && !remount) return state
  return { status, key: remount ? state.key + 1 : state.key }
}

const WIDE_QUERY = '(min-width: 768px)'

const noSubscription = () => () => {}

function fullscreenSupported(): boolean {
  return document.fullscreenEnabled === true && typeof document.documentElement.requestFullscreen === 'function'
}

function useEmbedLoader() {
  const [state, dispatch] = useReducer(loaderReducer, { status: 'idle', key: 0 })
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    window.clearTimeout(timer.current)
    if (state.status !== 'loading') return
    timer.current = window.setTimeout(() => dispatch('timeout'), EMBED_TIMEOUT_MS)
    return () => window.clearTimeout(timer.current)
  }, [state.status, state.key])

  return { ...state, dispatch }
}

function useEngagement(): boolean {
  const [engaged, setEngaged] = useState(false)
  useEffect(() => {
    if (engaged) return
    const engage = () => setEngaged(true)
    const onKey = (event: KeyboardEvent) => {
      if (ENGAGE_KEYS.has(event.key)) engage()
    }
    window.addEventListener('wheel', engage, { passive: true, once: true })
    window.addEventListener('touchmove', engage, { passive: true, once: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', engage)
      window.removeEventListener('touchmove', engage)
      window.removeEventListener('keydown', onKey)
    }
  }, [engaged])
  return engaged
}

export function ProjectEmbed({ id, url, title, poster, labels }: ProjectEmbedProps) {
  const uid = useId().replace(/:/g, '')
  const headingId = `${uid}-heading`
  const sheetTitleId = `${uid}-sheet`
  const address = embedAddress(url)
  const frameTitle = fillTemplate(labels.frame, { title })
  const loadingText = fillTemplate(labels.loading, { host: address.host })
  const { status, key, dispatch } = useEmbedLoader()
  const [surface, setSurface] = useState<Surface>('inline')
  const [device, setDevice] = useState<Device>('desktop')
  const [fullscreen, setFullscreen] = useState(false)
  const canFullscreen = useSyncExternalStore(noSubscription, fullscreenSupported, () => false)
  const engaged = useEngagement()
  const frameRef = useRef<HTMLElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const mounted = embedFrameMounted(status)

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current && frameRef.current !== null)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    if (!section || status !== 'idle' || surface !== 'inline' || !engaged) return
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const allowed = canAutoLoad({
      wide: window.matchMedia(WIDE_QUERY).matches,
      saveData: connection?.saveData === true,
      framed: window.self !== window.top,
      engaged,
    })
    if (!allowed) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          dispatch('request')
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(frameRef.current ?? section)
    return () => observer.disconnect()
  }, [dispatch, engaged, status, surface])

  useEffect(() => {
    if (!id) return
    const onHash = () => {
      if (window.location.hash === `#${id}` && window.matchMedia(WIDE_QUERY).matches) {
        setSurface('inline')
        dispatch('request')
      }
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [dispatch, id])

  const loadInline = () => {
    setSurface('inline')
    dispatch('request')
  }

  const openSheet = () => {
    if (surface === 'inline' && mounted) dispatch('reset')
    setSurface('sheet')
    dispatch('request')
  }

  const closeSheet = useCallback(() => {
    setSurface('inline')
    dispatch('reset')
  }, [dispatch])

  const toggleFullscreen = async () => {
    const frame = frameRef.current
    if (!frame) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await frame.requestFullscreen()
    } catch {
      setFullscreen(false)
    }
  }

  const statusText = status === 'loading' ? loadingText : status === 'ready' ? labels.ready : status === 'slow' ? labels.slowTitle : ''

  const iframe = (
    <iframe
      key={key}
      src={url}
      title={frameTitle}
      sandbox={EMBED_SANDBOX}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      className={styles.iframe}
      onLoad={() => dispatch('load')}
      data-cw-embed-frame=""
    />
  )

  const openLink = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.action}
      aria-label={labels.openLive}
      title={labels.openLive}
      data-cw-embed-open=""
    >
      <Icon name="external" size={17} />
    </a>
  )

  const reloadButton = (
    <button
      type="button"
      className={styles.action}
      aria-label={labels.reload}
      title={labels.reload}
      onClick={() => dispatch('reload')}
      data-cw-embed-reload=""
    >
      <PortfolioIcon name="reload" />
    </button>
  )

  const slowNotice = (
    <div className={styles.slow} data-cw-embed-slow="">
      <Image
        src={poster.src}
        alt={poster.alt}
        width={poster.width}
        height={poster.height}
        sizes="(min-width: 768px) 360px, 70vw"
        className={styles.slowImage}
      />
      <div className={styles.slowText}>
        <p className={styles.slowTitle}>{labels.slowTitle}</p>
        <p className={styles.slowBody}>{labels.slowBody}</p>
        <div className={styles.slowActions}>
          <button type="button" className={styles.primary} onClick={() => dispatch('request')} data-cw-embed-retry="">
            <PortfolioIcon name="reload" />
            {labels.retry}
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className={styles.secondary} data-cw-embed-external="">
            {labels.openLive}
          </a>
        </div>
      </div>
    </div>
  )

  const loadingVeil: ReactNode =
    status === 'loading' ? (
      <div className={styles.veil} aria-hidden="true">
        <span className={styles.pulse} />
        <span className={styles.veilText}>{loadingText}</span>
      </div>
    ) : null

  return (
    <section
      ref={sectionRef}
      id={id}
      className={styles.embed}
      aria-labelledby={headingId}
      data-cw-embed=""
      data-state={surface === 'inline' ? status : 'idle'}
    >
      <header className={styles.head}>
        <h2 id={headingId} className={styles.heading}>
          <PortfolioIcon name="live" className={styles.headingIcon} />
          {labels.heading}
        </h2>
        <p className={styles.intro}>{labels.intro}</p>
      </header>

      <figure ref={frameRef} className={styles.frame} data-device={device} data-fullscreen={fullscreen ? '' : undefined} data-cw-glass="strong">
        <div className={styles.toolbar}>
          <span className={styles.dots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <p className={styles.address} data-cw-embed-address="">
            <PortfolioIcon name="lock" size={14} className={styles.lock} />
            <span className={styles.host}>{address.host}</span>
            {address.path ? <span className={styles.path}>{address.path}</span> : null}
          </p>
          <div className={styles.actions}>
            <div className={cx('cw-js-only', styles.devices)} role="group" aria-label={labels.view}>
              <button
                type="button"
                className={styles.action}
                aria-pressed={device === 'desktop'}
                aria-label={labels.desktop}
                title={labels.desktop}
                onClick={() => setDevice('desktop')}
                data-cw-embed-device="desktop"
              >
                <PortfolioIcon name="desktop" />
              </button>
              <button
                type="button"
                className={styles.action}
                aria-pressed={device === 'mobile'}
                aria-label={labels.mobile}
                title={labels.mobile}
                onClick={() => setDevice('mobile')}
                data-cw-embed-device="mobile"
              >
                <PortfolioIcon name="phone" />
              </button>
            </div>
            {surface === 'inline' && mounted ? reloadButton : null}
            {canFullscreen ? (
              <button
                type="button"
                className={cx(styles.action, styles.wideOnly)}
                aria-label={fullscreen ? labels.collapse : labels.expand}
                title={fullscreen ? labels.collapse : labels.expand}
                onClick={toggleFullscreen}
                data-cw-embed-fullscreen=""
              >
                <PortfolioIcon name={fullscreen ? 'collapse' : 'expand'} />
              </button>
            ) : null}
            {openLink}
          </div>
        </div>

        <div className={styles.viewport}>
          {surface === 'inline' && mounted ? (
            <>
              {iframe}
              {loadingVeil}
            </>
          ) : surface === 'inline' && status === 'slow' ? (
            slowNotice
          ) : (
            <div className={styles.poster}>
              <Image src={poster.src} alt="" width={poster.width} height={poster.height} sizes="40vw" className={styles.backdrop} />
              <div className={styles.posterBody}>
                <p className={styles.posterHost} aria-hidden="true">
                  {address.host}
                </p>
                <button type="button" className={cx('cw-js-only', styles.primary, styles.wideOnly)} onClick={loadInline} data-cw-embed-load="">
                  <PortfolioIcon name="live" />
                  {labels.load}
                </button>
                <button
                  type="button"
                  className={cx('cw-js-only', styles.primary, styles.narrowOnly)}
                  onClick={openSheet}
                  data-cw-embed-sheet-open=""
                >
                  <PortfolioIcon name="expand" />
                  {labels.open}
                </button>
                <p className={styles.noScript}>
                  {labels.noScript}{' '}
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {labels.openLive}
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </figure>

      <p className="cw-visually-hidden" role="status" aria-live="polite" data-cw-embed-status="">
        {surface === 'inline' ? statusText : ''}
      </p>

      <Dialog open={surface === 'sheet'} onClose={closeSheet} labelledBy={sheetTitleId} className={styles.sheet}>
        <div className={styles.sheetBar}>
          <p id={sheetTitleId} className={styles.sheetTitle}>
            <span>{title}</span>
            <span className={styles.sheetHost}>{address.host}</span>
          </p>
          <div className={styles.actions}>
            {mounted ? reloadButton : null}
            {openLink}
            <button
              type="button"
              className={styles.action}
              aria-label={labels.close}
              title={labels.close}
              onClick={closeSheet}
              data-cw-embed-sheet-close=""
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
        <div className={styles.sheetViewport}>
          {surface === 'sheet' && mounted ? (
            <>
              {iframe}
              {loadingVeil}
            </>
          ) : null}
          {surface === 'sheet' && status === 'slow' ? slowNotice : null}
        </div>
        <p className="cw-visually-hidden" role="status" aria-live="polite">
          {surface === 'sheet' ? statusText : ''}
        </p>
      </Dialog>
    </section>
  )
}
