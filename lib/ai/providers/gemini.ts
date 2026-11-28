import 'server-only'
import { generateJson as geminiGenerateJson } from '@/lib/ai/generate'
import type { ProviderAdapter } from './adapter'
import { servedCostUsd } from './cost'
import { geminiFailure, geminiFinish, geminiTokens, geminiTools } from './gemini-tools'
import { jsonSchemaOf, toGeminiSchema } from './schema'

export function createGeminiAdapter(key: string, fetcher: typeof fetch = fetch): ProviderAdapter {
  return {
    id: 'gemini',
    async json(request) {
      let reply: Awaited<ReturnType<typeof geminiGenerateJson>>
      try {
        reply = await geminiGenerateJson(
          {
            key,
            model: request.model,
            system: request.system,
            prompt: request.prompt,
            schema: toGeminiSchema(jsonSchemaOf(request.schema)),
            maxOutputTokens: request.maxOutputTokens,
            timeoutMs: request.timeoutMs,
          },
          fetcher,
        )
      } catch (error) {
        throw geminiFailure(error)
      }
      const usage = geminiTokens(reply.usage)
      const { truncated } = geminiFinish(reply.finishReason, usage, request.model)
      return { text: reply.text, model: request.model, usage, costUsd: servedCostUsd(request.model, request.model, usage), truncated }
    },
    tools(request) {
      return geminiTools(key, request, fetcher)
    },
  }
}
