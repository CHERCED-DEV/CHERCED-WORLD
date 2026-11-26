import type { z } from 'zod'
import type { Locale } from '@/lib/i18n/config'
import type { RateLimitAction } from '@/lib/security/rate-limit'

export type McpContext = {
  lang: Locale
  origin: string
  requestId: string | number
  protocolVersion: string
  signal: AbortSignal
}

export type McpSource = { title: string; url: string }

export type McpToolResult<O> = { text: string; structured?: O; sources: McpSource[] }

export type McpTool<I, O> = {
  name: string
  title: string
  description: string
  inputSchema: z.ZodType<I>
  outputSchema?: z.ZodType<O>
  readOnly: true
  limit?: RateLimitAction
  handler(args: I, ctx: McpContext): Promise<McpToolResult<O>>
}

export type McpPromptArgument = { name: string; description: string; required: boolean }

export type McpPromptMessage = { role: 'user' | 'assistant'; text: string }

export type McpPrompt = {
  name: string
  title: string
  description: string
  arguments: Array<McpPromptArgument>
  render(args: Record<string, string>, ctx: McpContext): Array<McpPromptMessage>
}

export type McpLimits = { visitor: RateLimitAction; daily: RateLimitAction }

export type McpServerOptions = {
  name: string
  title?: string
  version: string
  instructions: string
  tools: ReadonlyArray<McpTool<unknown, unknown>>
  prompts?: ReadonlyArray<McpPrompt>
  limits: McpLimits
}

export class McpToolError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'McpToolError'
  }
}

export function defineTool<I, O>(tool: McpTool<I, O>): McpTool<unknown, unknown> {
  return tool as unknown as McpTool<unknown, unknown>
}
