import { describe, expect, it } from 'vitest'
import { needsVerification, pickVerifier, reportersOf, VERIFY_CONFIDENCE_BELOW } from '@/lib/ai/gates/providers'
import type { FindingReporter } from '@/lib/ai/gates/schema'
import { PAID_PROVIDERS, type PaidProviderId } from '@/lib/ai/providers/types'
import { finding } from './fixtures'

function reporter(seat: PaidProviderId, overrides: Partial<FindingReporter> = {}): FindingReporter {
  return { seat, provider: seat, gravity: 'importante', confidence: 0.8, problem: 'p', fix: 'f', ...overrides }
}

describe('qué pasa por el verificador (FR-4608)', () => {
  it('todo hallazgo bloqueante de un revisor', () => {
    expect(needsVerification(finding({ gravity: 'bloqueante', confidence: 0.95 }))).toBe(true)
    expect(needsVerification(finding({ gravity: 'bloqueante', seenByBoth: true, reporters: [reporter('claude'), reporter('openai')] }))).toBe(true)
  })

  it(`lo que reportó un solo revisor con confianza menor a ${VERIFY_CONFIDENCE_BELOW}`, () => {
    expect(needsVerification(finding({ gravity: 'importante', confidence: 0.59 }))).toBe(true)
    expect(needsVerification(finding({ gravity: 'menor', confidence: 0.3 }))).toBe(true)
    expect(needsVerification(finding({ gravity: 'importante', confidence: 0.6 }))).toBe(false)
  })

  it('no lo visto por los dos con poca confianza, ni lo determinista, ni lo que viene de la ronda anterior', () => {
    expect(needsVerification(finding({ gravity: 'importante', confidence: 0.4, seenByBoth: true }))).toBe(false)
    expect(needsVerification(finding({ gravity: 'bloqueante', origin: 'determinista', reporters: [], rules: ['coverage.unknown-requirement'] }))).toBe(false)
    expect(needsVerification(finding({ gravity: 'bloqueante', carried: true }))).toBe(false)
    expect(needsVerification(finding({ gravity: 'bloqueante', verification: { result: 'se-sostiene', reason: 'r', seat: 'openai', provider: 'openai' } }))).toBe(false)
  })
})

describe('el verificador nunca es del proveedor que reportó (SC-4602)', () => {
  const active: PaidProviderId[][] = [['gemini', 'claude'], ['gemini', 'openai'], ['claude', 'openai'], ['gemini', 'claude', 'openai']]
  for (const providers of active) {
    for (const one of PAID_PROVIDERS) {
      it(`activos [${providers.join(', ')}], reportó ${one}`, () => {
        const verifier = pickVerifier(providers, [one])
        expect(verifier).not.toBe(one)
        if (verifier) expect(providers).toContain(verifier)
      })
    }
  }

  it('si lo reportaron Claude y OpenAI, verifica Gemini; si no queda nadie, no hay verificador', () => {
    expect(pickVerifier(['gemini', 'claude', 'openai'], ['claude', 'openai'])).toBe('gemini')
    expect(pickVerifier(['claude'], ['claude'])).toBeNull()
  })

  it('elige el cheap más barato que queda: lo de Claude lo verifica OpenAI y lo de OpenAI, Claude', () => {
    expect(pickVerifier(['gemini', 'claude', 'openai'], ['claude'])).toBe('openai')
    expect(pickVerifier(['gemini', 'claude', 'openai'], ['openai'])).toBe('claude')
  })

  it('los que reportaron salen del asiento y del proveedor que respondió de verdad', () => {
    const merged = finding({ reporters: [reporter('claude', { provider: 'openai' })] })
    expect(reportersOf(merged)).toEqual(['claude', 'openai'])
    expect(pickVerifier(['gemini', 'claude', 'openai'], reportersOf(merged))).toBe('gemini')
  })
})
