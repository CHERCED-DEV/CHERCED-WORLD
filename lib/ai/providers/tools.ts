import type { ToolsReply } from './adapter'
import { SCHEMA_NAME } from './adapter'
import { callContext, elapsed, estimateUsage, keyFor, maxOutputFor, record, recordFailure, routeFor, runAttempt, totalCost, type PortDeps } from './core'
import { failsOver } from './errors'
import { jsonSchemaOf, parseStructured, retryNote, schemaIssues } from './schema'
import { simulateReply } from './simulator'
import { ProviderRequestError, ProvidersUnavailableError, type AssistantMessage, type CallToolsInput, type CallToolsResult, type PortMessage, type PortTool, type ToolCall } from './types'

export const NOT_RUN_NOTE = 'No se ejecutó: otra llamada de este turno traía argumentos inválidos. Pídela otra vez si la necesitas.'

export const INVALID_ARGS_PREFIX = 'Argumentos inválidos: '

export type CallCheck = { ok: true; call: ToolCall } | { ok: false; call: ToolCall; reason: string }

export function checkCall(call: ToolCall, tools: readonly PortTool[]): CallCheck {
  const tool = tools.find((item) => item.name === call.name)
  if (!tool) return { ok: false, call, reason: `${call.name}: herramienta desconocida` }
  const parsed = tool.inputSchema.safeParse(call.args)
  if (!parsed.success) return { ok: false, call, reason: `${call.name}: ${schemaIssues(parsed.error)}` }
  return { ok: true, call: { ...call, args: parsed.data } }
}

function repairTurn(reply: ToolsReply): AssistantMessage {
  return { role: 'assistant', text: reply.text, toolCalls: reply.toolCalls, native: reply.native }
}

export async function runCallTools<T>(deps: PortDeps, input: CallToolsInput<T>): Promise<CallToolsResult<T>> {
  const mode = deps.mode()
  if (mode === 'local') {
    const simulated = simulateReply(input)
    return { ...simulated, toolCalls: [], turn: { role: 'assistant', text: simulated.text, toolCalls: [] } }
  }
  if (mode === 'off') throw new ProvidersUnavailableError([], 'off: no hay llaves de proveedores ni base local')
  const maxOutputTokens = maxOutputFor(input.task, input.maxOutputTokens)
  const toolsText = JSON.stringify(input.tools.map((tool) => ({ name: tool.name, description: tool.description, schema: jsonSchemaOf(tool.inputSchema) })))
  const estimate = input.estimate ?? estimateUsage(input.system + JSON.stringify(input.messages) + toolsText, input.schema, maxOutputTokens)
  const { plan, keys } = routeFor(deps, input, estimate)
  const ctx = callContext(deps, input.line)
  ctx.attempts.push(...plan.skipped)
  for (const candidate of plan.candidates) {
    const adapter = await deps.adapter(candidate.provider, keyFor(keys, candidate.provider))
    let working: PortMessage[] = [...input.messages]
    let repaired = false
    for (let round = 0; round < 2; round++) {
      const result = await runAttempt(ctx, candidate, () =>
        adapter.tools({
          model: candidate.model,
          task: input.task,
          system: input.system,
          schema: input.schema,
          schemaName: SCHEMA_NAME,
          maxOutputTokens,
          timeoutMs: deps.timeoutMs,
          messages: working,
          tools: input.tools,
        }),
      )
      if (!result.ok) {
        recordFailure(ctx, candidate, result)
        if (!failsOver(result.error.kind)) throw new ProviderRequestError(ctx.attempts)
        break
      }
      const { reply } = result
      const base = { model: reply.model, latencyMs: result.latencyMs, usage: reply.usage, costUsd: reply.costUsd }
      const finish = (data: T | null, toolCalls: ToolCall[]): CallToolsResult<T> => ({
        data,
        toolCalls,
        text: reply.text,
        provider: candidate.provider,
        model: reply.model,
        usage: reply.usage,
        latencyMs: elapsed(ctx),
        costUsd: totalCost(ctx.attempts),
        attempts: ctx.attempts,
        turn: { role: 'assistant', text: reply.text, toolCalls, ...(repaired ? {} : { native: reply.native }) },
      })

      if (reply.toolCalls.length > 0) {
        const checks = reply.toolCalls.map((call) => checkCall(call, input.tools))
        const invalid = checks.filter((check): check is Extract<CallCheck, { ok: false }> => !check.ok)
        if (invalid.length === 0) {
          record(ctx, candidate, { ...base, outcome: 'ok', reason: null })
          return finish(null, checks.map((check) => check.call))
        }
        record(ctx, candidate, { ...base, outcome: 'invalid', reason: invalid.map((check) => check.reason).join('; ') })
        working = [
          ...working,
          repairTurn(reply),
          {
            role: 'tool',
            results: checks.map((check) => ({ callId: check.call.id, content: check.ok ? NOT_RUN_NOTE : `${INVALID_ARGS_PREFIX}${check.reason}`, isError: true })),
          },
        ]
        repaired = true
        continue
      }

      const parsed = parseStructured(reply.text, input.schema)
      if (parsed.ok) {
        record(ctx, candidate, { ...base, outcome: 'ok', reason: reply.truncated ? 'salida cortada por maxOutputTokens' : null })
        return finish(parsed.data, [])
      }
      record(ctx, candidate, { ...base, outcome: 'invalid', reason: parsed.reason })
      working = [...working, repairTurn(reply), { role: 'user', text: retryNote(parsed.reason).trim() }]
      repaired = true
    }
  }
  throw new ProvidersUnavailableError(ctx.attempts)
}
