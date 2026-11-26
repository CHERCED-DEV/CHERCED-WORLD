'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { CopyButton } from '@/components/blog/CopyButton'
import { Button } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { LATEST_LEGACY_PROTOCOL_VERSION, LATEST_PROTOCOL_VERSION, MCP_HEADERS, META_KEYS, NAMED_METHODS } from '@/lib/mcp/core/constants'
import { fillLabel, MCP_TRY_EVENT, type McpTesterLabels } from './labels'
import styles from './Mcp.module.scss'

type Era = 'modern' | 'legacy'

type Exchange = {
  key: number
  method: string
  headers: Record<string, string>
  body: Record<string, unknown>
  status: number | null
  ms: number
  response: unknown
  error: string | null
}

export type McpTesterTool = { name: string; title: string; example: Record<string, unknown>; fictional: boolean }

type Props = { endpoint: string; tools: McpTesterTool[]; defaultTool: string; labels: McpTesterLabels }

const CLIENT_INFO = { name: 'cherced-world-tester', version: '1.0.0' }

function subscribe(): () => void {
  return () => {}
}

function pretty(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

function requestText(exchange: Exchange, endpoint: string): string {
  const headers = Object.entries(exchange.headers).map(([name, value]) => `${name}: ${value}`)
  return [`POST ${endpoint}`, ...headers, '', pretty(exchange.body)].join('\n')
}

function transcript(exchange: Exchange, endpoint: string, labels: McpTesterLabels): string {
  const head = exchange.status === null ? fillLabel(labels.failed, { reason: exchange.error ?? '' }) : fillLabel(labels.meta, { status: exchange.status, ms: exchange.ms })
  return [`→ ${requestText(exchange, endpoint)}`, '', `← ${head}`, exchange.response === null ? '' : pretty(exchange.response)].join('\n').trim()
}

function exampleText(tools: McpTesterTool[], name: string): string {
  return JSON.stringify(tools.find((tool) => tool.name === name)?.example ?? {}, null, 2)
}

export function McpTester({ endpoint, tools, defaultTool, labels }: Props) {
  const ids = useId()
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const [era, setEra] = useState<Era>('modern')
  const [tool, setTool] = useState(defaultTool)
  const [args, setArgs] = useState(() => exampleText(tools, defaultTool))
  const [argsError, setArgsError] = useState<string | null>(null)
  const [log, setLog] = useState<Exchange[]>([])
  const [busy, setBusy] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const nextId = useRef(1)
  const negotiated = useRef<string>(LATEST_LEGACY_PROTOCOL_VERSION)
  const heading = useRef<HTMLHeadingElement>(null)
  const latest = useRef<HTMLElement>(null)
  const focusLatest = useRef(false)

  async function send(method: string, params: Record<string, unknown> | undefined, notify = false): Promise<Exchange> {
    const key = nextId.current
    nextId.current += 1
    const modern = era === 'modern'
    const meta = { [META_KEYS.protocolVersion]: LATEST_PROTOCOL_VERSION, [META_KEYS.clientInfo]: CLIENT_INFO, [META_KEYS.clientCapabilities]: {} }
    const body: Record<string, unknown> = { jsonrpc: '2.0', ...(notify ? {} : { id: key }), method }
    if (modern) body.params = { ...(params ?? {}), _meta: meta }
    else if (params) body.params = params
    const headers: Record<string, string> = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }
    if (modern) {
      headers[MCP_HEADERS.protocolVersion] = LATEST_PROTOCOL_VERSION
      headers[MCP_HEADERS.method] = method
      if (NAMED_METHODS.has(method) && typeof params?.name === 'string') headers[MCP_HEADERS.name] = params.name
    } else if (method !== 'initialize') {
      headers[MCP_HEADERS.protocolVersion] = negotiated.current
    }
    const started = performance.now()
    try {
      const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store' })
      const text = await response.text()
      let parsed: unknown = null
      try {
        parsed = text ? JSON.parse(text) : null
      } catch {
        parsed = text
      }
      return { key, method, headers, body, status: response.status, ms: Math.round(performance.now() - started), response: parsed, error: null }
    } catch (error) {
      return { key, method, headers, body, status: null, ms: Math.round(performance.now() - started), response: null, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async function run(method: string, params?: Record<string, unknown>, focus = false): Promise<Exchange> {
    setBusy(true)
    setAnnouncement(fillLabel(labels.sending, { method }))
    const exchange = await send(method, params)
    const extra: Exchange[] = []
    if (method === 'initialize' && exchange.status === 200) {
      const result = (exchange.response as { result?: { protocolVersion?: unknown } } | null)?.result
      if (typeof result?.protocolVersion === 'string') negotiated.current = result.protocolVersion
      extra.push(await send('notifications/initialized', undefined, true))
    }
    focusLatest.current = focus
    setLog((current) => [...extra.reverse(), exchange, ...current])
    setAnnouncement(exchange.status === null ? fillLabel(labels.failed, { reason: exchange.error ?? '' }) : fillLabel(labels.done, { method, status: exchange.status, ms: exchange.ms }))
    setBusy(false)
    return exchange
  }

  function callTool(name: string, raw: string, focus = false) {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setArgsError(labels.badJson)
      return
    }
    setArgsError(null)
    void run('tools/call', { name, arguments: parsed as Record<string, unknown> }, focus)
  }

  const tryTool = useRef<(name: string) => void>(() => {})

  useEffect(() => {
    tryTool.current = (name: string) => {
      if (!tools.some((item) => item.name === name)) return
      const example = exampleText(tools, name)
      setTool(name)
      setArgs(example)
      heading.current?.scrollIntoView({ block: 'start' })
      callTool(name, example, true)
    }
  })

  useEffect(() => {
    const listener = (event: Event) => {
      const name = (event as CustomEvent<unknown>).detail
      if (typeof name === 'string') tryTool.current(name)
    }
    window.addEventListener(MCP_TRY_EVENT, listener)
    return () => window.removeEventListener(MCP_TRY_EVENT, listener)
  }, [])

  useEffect(() => {
    if (!focusLatest.current) return
    focusLatest.current = false
    latest.current?.focus()
  }, [log])

  const selected = tools.find((item) => item.name === tool)
  const first = era === 'modern' ? 'server/discover' : 'initialize'

  return (
    <GlassSurface as="section" className={styles.panel} aria-labelledby="mcp-tester-title" data-cw-mcp-tester="">
      <h2 id="mcp-tester-title" ref={heading} className={styles.h2}>
        {labels.title}
      </h2>
      <p className={styles.muted}>{labels.lead}</p>
      <p className={`${styles.notice} ${styles.noJs}`} data-cw-mcp-noscript="">
        {labels.noscript}
      </p>
      <div className={`${styles.tester} cw-js-only`} data-cw-mcp-ready={hydrated ? '' : undefined}>
        <fieldset className={styles.fieldset}>
          <legend>{labels.version}</legend>
          {(['modern', 'legacy'] as const).map((value) => (
            <label key={value} className={styles.radio}>
              <input type="radio" name={`${ids}-era`} value={value} checked={era === value} onChange={() => setEra(value)} data-cw-mcp-era={value} />
              <span>{value === 'modern' ? labels.modern : labels.legacy}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend>{labels.steps}</legend>
          <div className={styles.actions}>
            <Button
              variant="glass"
              size="sm"
              disabled={busy}
              onClick={() =>
                void run(
                  first,
                  era === 'modern' ? {} : { protocolVersion: LATEST_LEGACY_PROTOCOL_VERSION, capabilities: {}, clientInfo: CLIENT_INFO },
                )
              }
              data-cw-mcp-step="1"
            >
              1 · {first}
            </Button>
            <Button variant="glass" size="sm" disabled={busy} onClick={() => void run('tools/list', era === 'modern' ? {} : undefined)} data-cw-mcp-step="2">
              2 · tools/list
            </Button>
          </div>
          <label className={styles.field} htmlFor={`${ids}-tool`}>
            <span>{labels.tool}</span>
            <select
              id={`${ids}-tool`}
              value={tool}
              onChange={(event) => {
                setTool(event.target.value)
                setArgs(exampleText(tools, event.target.value))
                setArgsError(null)
              }}
              data-cw-mcp-tool-select=""
            >
              {tools.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field} htmlFor={`${ids}-args`}>
            <span>{labels.args}</span>
            <textarea
              id={`${ids}-args`}
              value={args}
              rows={Math.min(12, Math.max(3, args.split('\n').length))}
              spellCheck={false}
              aria-invalid={argsError ? true : undefined}
              aria-describedby={argsError ? `${ids}-args-error` : undefined}
              onChange={(event) => setArgs(event.target.value)}
              data-cw-mcp-args=""
            />
          </label>
          {selected?.fictional ? <p className={styles.muted}>{labels.fictional}</p> : null}
          {argsError ? (
            <p id={`${ids}-args-error`} className={styles.error}>
              {argsError}
            </p>
          ) : null}
          <div className={styles.actions}>
            <Button variant="solid" size="sm" disabled={busy} onClick={() => callTool(tool, args)} data-cw-mcp-step="3">
              3 · {labels.call}
            </Button>
            <Button variant="ghost" size="sm" disabled={busy || log.length === 0} onClick={() => setLog([])} data-cw-mcp-clear="">
              {labels.clear}
            </Button>
          </div>
        </fieldset>
        <p role="status" className="cw-visually-hidden" data-cw-mcp-announce="">
          {announcement}
        </p>
        <h3 className={styles.h3}>{labels.log}</h3>
        {log.length === 0 ? (
          <p className={styles.muted} data-cw-mcp-empty="">
            {labels.empty}
          </p>
        ) : (
          <ol className={styles.log} reversed>
            {log.map((exchange, position) => {
              const headingId = `${ids}-exchange-${exchange.key}`
              const failed = exchange.status === null
              return (
                <li key={exchange.key} data-cw-mcp-exchange={exchange.method} data-cw-mcp-status={failed ? 'error' : String(exchange.status)}>
                  <article ref={position === 0 ? latest : undefined} tabIndex={-1} className={styles.exchange} aria-labelledby={headingId} data-failed={failed ? '' : undefined}>
                    <header className={styles.exchangeHead}>
                      <h4 id={headingId} className={styles.exchangeTitle}>
                        <code>{exchange.method}</code>
                      </h4>
                      <span className={styles.exchangeMeta}>{failed ? '—' : fillLabel(labels.meta, { status: exchange.status ?? 0, ms: exchange.ms })}</span>
                    </header>
                    {failed ? (
                      <p className={styles.error} data-cw-mcp-error="">
                        {fillLabel(labels.failed, { reason: exchange.error ?? '' })}
                      </p>
                    ) : null}
                    <details className={styles.wire} open={position === 0}>
                      <summary>{labels.request}</summary>
                      <pre tabIndex={0} data-cw-mcp-request="">
                        <code>{requestText(exchange, endpoint)}</code>
                      </pre>
                    </details>
                    {exchange.response !== null ? (
                      <details className={styles.wire} open={position === 0}>
                        <summary>{labels.response}</summary>
                        <pre tabIndex={0} data-cw-mcp-response="">
                          <code>{pretty(exchange.response)}</code>
                        </pre>
                      </details>
                    ) : null}
                    <CopyButton text={transcript(exchange, endpoint, labels)} labels={{ copy: labels.copy, copied: labels.copied, copyError: labels.copyError }} />
                  </article>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </GlassSurface>
  )
}