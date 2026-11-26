'use client'

import { useSyncExternalStore } from 'react'
import { CopyButton } from '@/components/blog/CopyButton'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { withMcpUrl } from '@/content/mcp/clients'
import type { McpConnectLabels } from './labels'
import styles from './Mcp.module.scss'

export type McpClientView = {
  id: string
  name: string
  steps: string[]
  snippet: { lang: 'bash' | 'json'; code: string } | null
  status: string
  tested: boolean
}

type Props = { serverUrl: string; path: string; labels: McpConnectLabels; clients: McpClientView[] }

function subscribe(): () => void {
  return () => {}
}

export function McpConnect({ serverUrl, path, labels, clients }: Props) {
  const origin = useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => null,
  )
  const url = origin ? `${origin}${path}` : serverUrl

  return (
    <GlassSurface as="section" className={styles.panel} aria-labelledby="mcp-connect-title" data-cw-mcp-connect="">
      <h2 id="mcp-connect-title" className={styles.h2}>
        {labels.title}
      </h2>
      <div className={styles.url}>
        <span id="mcp-url-label" className={styles.label}>
          {labels.url}
        </span>
        <code className={styles.urlValue} aria-labelledby="mcp-url-label" data-cw-mcp-url="">
          {url}
        </code>
        <CopyButton text={url} labels={{ copy: labels.copy, copied: labels.copied, copyError: labels.copyError }} />
      </div>
      <h3 className={styles.h3}>{labels.clients}</h3>
      <ul className={styles.clients}>
        {clients.map((client, position) => (
          <li key={client.id} data-cw-mcp-client={client.id}>
            <details className={styles.client} open={position === 0}>
              <summary>
                <span className={styles.clientName}>{client.name}</span>
                <span className={styles.status} data-tested={client.tested ? '' : undefined}>
                  {client.status}
                </span>
              </summary>
              <ol className={styles.steps}>
                {client.steps.map((step, index) => (
                  <li key={step}>
                    <p>{step}</p>
                    {index === 0 && client.snippet ? (
                      <pre className={styles.snippet} tabIndex={0} data-lang={client.snippet.lang}>
                        <code>{withMcpUrl(client.snippet.code, url)}</code>
                      </pre>
                    ) : null}
                  </li>
                ))}
              </ol>
            </details>
          </li>
        ))}
      </ul>
      <p className={styles.ask}>{labels.ask}</p>
    </GlassSurface>
  )
}