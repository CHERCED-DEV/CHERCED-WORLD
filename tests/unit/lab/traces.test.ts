import { describe, expect, it } from 'vitest'
import { needsTrial } from '@/lib/ai/agent/config'
import { labPayload } from '@/lib/ai/lab/client'
import { groupUnanswered, hasLabConsent, labRecordFrom, labSessionInput, LAB_RETENTION_DAYS, summarizeConversation } from '@/lib/ai/lab/traces'
import { createMemoryLabRepo } from '@/lib/data/memory/lab'

const NOW = new Date('2026-11-15T15:00:00Z')

const input = {
  lang: 'es' as const,
  mode: 'live' as const,
  interview: null,
  startedAt: NOW.getTime() - 120_000,
  endedAt: NOW.getTime(),
  endReason: 'hangup' as const,
  turns: [
    { who: 'agent' as const, text: '¡Pa!' },
    { who: 'you' as const, text: '¿Camilo sabe Kubernetes?' },
    { who: 'agent' as const, text: 'Eso no lo encuentro en el sitio.' },
  ],
  trace: { turns: 2, latencyP50: 800, latencyP95: 1200, tokens: 3000, costUsd: 0.01, tools: ['buscar_en_el_sitio'] },
}

describe('trazas del AI Lab (038)', () => {
  it('valida tamaños: máximo 40 turnos de 600 caracteres, nunca audio', () => {
    expect(labSessionInput.safeParse(input).success).toBe(true)
    expect(labSessionInput.safeParse({ ...input, turns: Array.from({ length: 41 }, () => ({ who: 'you', text: 'x' })) }).success).toBe(false)
    expect(labSessionInput.safeParse({ ...input, turns: [{ who: 'you', text: 'x'.repeat(601) }] }).success).toBe(false)
    expect(labSessionInput.safeParse({ ...input, audio: 'base64...' }).data).not.toHaveProperty('audio')
  })

  it('FR-3803: el registro vence a los 90 días y no acepta fechas del futuro', () => {
    const record = labRecordFrom({ ...input, endedAt: NOW.getTime() + 999_999 }, 'a1', NOW, 'id1')
    expect(record.expiresAt.getTime() - NOW.getTime()).toBe(LAB_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    expect(record.endedAt.getTime()).toBe(NOW.getTime())
  })

  it('FR-3801: sin consentimiento no hay nada; retirarlo borra todo', async () => {
    const repo = createMemoryLabRepo()
    expect(await hasLabConsent(repo, 'a1')).toBe(false)
    await repo.setConsent('a1', '2026-11-15', NOW)
    expect(await hasLabConsent(repo, 'a1')).toBe(true)
    await repo.saveSession(labRecordFrom(input, 'a1', new Date(), 'id1'))
    await repo.saveSession(labRecordFrom(input, 'a2', new Date(), 'id2'))
    expect(await repo.listByAccount('a1', 10)).toHaveLength(1)
    expect(await repo.removeSession('a2', 'id1')).toBe(false)
    await repo.revokeConsent('a1', NOW)
    expect(await hasLabConsent(repo, 'a1')).toBe(false)
    expect(await repo.listByAccount('a1', 10)).toHaveLength(0)
    expect(await repo.listRecent(10)).toHaveLength(1)
  })

  it('FR-3806: el resumen se valida; si no cumple el esquema, no se guarda', async () => {
    const reply = (text: string) => async () =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text }] } }],
          usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50, totalTokenCount: 150 },
        }),
      )
    const good = await summarizeConversation(
      'k',
      input.turns,
      NOW,
      reply(JSON.stringify({ points: ['Preguntó por Kubernetes.'], intent: 'reclutador', topic: 'Kubernetes', unanswered: ['¿Sabe Kubernetes?'] })) as typeof fetch,
    )
    expect(good).toMatchObject({ intent: 'reclutador', unanswered: ['¿Sabe Kubernetes?'] })
    expect(good!.costUsd).toBeGreaterThan(0)
    expect(await summarizeConversation('k', input.turns, NOW, reply(JSON.stringify({ intent: 'hacker' })) as typeof fetch)).toBeNull()
  })

  it('agrupa las preguntas sin respuesta sin importar mayúsculas, tildes ni signos', () => {
    const summary = (unanswered: string[]) => ({ points: ['x'], intent: 'otro' as const, topic: '', unanswered, model: 'm', costUsd: 0, createdAt: NOW })
    const a = { ...labRecordFrom(input, 'a1', NOW, '1'), summary: summary(['¿Sabe Kubernetes?']) }
    const b = { ...labRecordFrom(input, 'a2', NOW, '2'), summary: summary(['sabe kubernetes', '¿Cuál es su salario?']) }
    expect(groupUnanswered([a, b]).map((group) => [group.question, group.count])).toEqual([
      ['¿Sabe Kubernetes?', 2],
      ['¿Cuál es su salario?', 1],
    ])
  })

  it('el navegador manda solo texto y un resumen de la traza, y nada si el visitante no preguntó', () => {
    const turns = input.turns.map((turn, index) => ({ id: index, done: true, ...turn }))
    const payload = labPayload({ lang: 'es', mode: 'live', interview: null, startedAt: 1, endedAt: 2, endReason: 'hangup', turns, trace: null })
    expect(payload?.turns).toHaveLength(3)
    expect(labPayload({ lang: 'es', mode: 'live', interview: null, startedAt: 1, endedAt: 2, endReason: 'hangup', turns: [turns[0]!], trace: null })).toBeNull()
  })

  it('FR-3805: la prueba sin cuenta solo aplica con el ingreso de Google configurado', () => {
    expect(needsTrial({ kind: 'anonymous' }, 'google')).toBe(true)
    expect(needsTrial({ kind: 'anonymous' }, 'off')).toBe(false)
    expect(needsTrial({ kind: 'account', name: 'Ana' }, 'google')).toBe(false)
  })
})
