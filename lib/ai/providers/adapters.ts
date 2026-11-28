import 'server-only'
import { GENERATE_TIMEOUT_MS } from '@/lib/ai/generate'
import type { AdapterLoader } from './adapter'

export const PORT_TIMEOUT_MS = GENERATE_TIMEOUT_MS

export const loadAdapter: AdapterLoader = async (provider, key) => {
  if (provider === 'gemini') {
    const { createGeminiAdapter } = await import('./gemini')
    return createGeminiAdapter(key)
  }
  if (provider === 'claude') {
    const { claudeCreateFor, createClaudeAdapter } = await import('./claude')
    return createClaudeAdapter(await claudeCreateFor(key, PORT_TIMEOUT_MS))
  }
  const { createOpenAIAdapter, openaiCreateFor } = await import('./openai')
  return createOpenAIAdapter(await openaiCreateFor(key, PORT_TIMEOUT_MS))
}
