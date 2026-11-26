'use client'

import { buttonClassName } from '@/components/ui/Button'
import { MCP_TRY_EVENT } from './labels'

export function McpTryButton({ tool, text, label }: { tool: string; text: string; label: string }) {
  return (
    <span className="cw-js-only">
      <button
        type="button"
        className={buttonClassName({ variant: 'glass', size: 'sm' })}
        aria-label={label}
        data-cw-mcp-try={tool}
        onClick={() => window.dispatchEvent(new CustomEvent(MCP_TRY_EVENT, { detail: tool }))}
      >
        {text}
      </button>
    </span>
  )
}