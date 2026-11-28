import type { BetaMessage } from '@anthropic-ai/sdk/resources/beta/messages/messages'
import type { Response as OpenAIResponse } from 'openai/resources/responses/responses'

export function claudeRecorded(partial: Partial<BetaMessage> & { content: BetaMessage['content'] }, usage: Partial<BetaMessage['usage']> = {}): BetaMessage {
  return {
    id: 'msg_grabado',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5-5',
    container: null,
    context_management: null,
    diagnostics: null,
    stop_reason: 'end_turn',
    stop_sequence: null,
    stop_details: null,
    ...partial,
    usage: {
      input_tokens: 1500,
      output_tokens: 600,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation: null,
      fallback_credit: null,
      inference_geo: null,
      iterations: null,
      output_tokens_details: null,
      server_tool_use: null,
      service_tier: 'standard',
      speed: null,
      ...usage,
    },
  } as BetaMessage
}

export function openaiRecorded(partial: Partial<OpenAIResponse> & { output: OpenAIResponse['output'] }): OpenAIResponse {
  return {
    id: 'resp_grabado',
    object: 'response',
    created_at: 1_764_000_000,
    model: 'gpt-6.2-sol',
    status: 'completed',
    error: null,
    incomplete_details: null,
    instructions: null,
    metadata: null,
    output_text: '',
    parallel_tool_calls: true,
    temperature: null,
    top_p: null,
    tool_choice: 'auto',
    tools: [],
    usage: { input_tokens: 1500, output_tokens: 600, total_tokens: 2100, input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 }, output_tokens_details: { reasoning_tokens: 200 } },
    ...partial,
  } as OpenAIResponse
}

export function openaiMessage(text: string, phase: 'final_answer' | 'commentary' | null = 'final_answer'): OpenAIResponse['output'][number] {
  return { id: 'msg_1', type: 'message', role: 'assistant', status: 'completed', phase, content: [{ type: 'output_text', text, annotations: [] }] } as OpenAIResponse['output'][number]
}

export function geminiRecorded(parts: Array<Record<string, unknown>>, finishReason = 'STOP', extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    candidates: [{ content: { role: 'model', parts }, finishReason }],
    usageMetadata: { promptTokenCount: 1500, candidatesTokenCount: 500, thoughtsTokenCount: 100, totalTokenCount: 2100 },
    modelVersion: 'gemini-3.8-flash',
    ...extra,
  }
}

export function jsonFetch(bodies: unknown[], calls: Array<{ url: string; body: Record<string, unknown> }> = []): typeof fetch {
  const queue = [...bodies]
  return (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown> })
    const next = queue.shift()
    if (next instanceof Response) return next
    return new Response(JSON.stringify(next ?? {}), { status: 200, headers: { 'content-type': 'application/json' } })
  }) as typeof fetch
}
