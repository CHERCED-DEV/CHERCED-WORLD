import { describe, expect, it } from 'vitest'
import { pickReviewers, pickWriter, seatsFrom } from '@/lib/ai/gates/providers'
import { PAID_PROVIDERS, type PaidProviderId } from '@/lib/ai/providers/types'

const SUBSETS: PaidProviderId[][] = [[], ['gemini'], ['claude'], ['openai'], ['gemini', 'claude'], ['gemini', 'openai'], ['claude', 'openai'], ['gemini', 'claude', 'openai']]

describe('elección de revisores: nadie revisa lo suyo (FR-4604, SC-4602)', () => {
  for (const active of SUBSETS) {
    for (const writer of PAID_PROVIDERS) {
      it(`activos [${active.join(', ') || 'ninguno'}], redactó ${writer}`, () => {
        const reviewers = pickReviewers(active, writer)
        expect(reviewers).not.toContain(writer)
        expect(new Set(reviewers).size).toBe(reviewers.length)
        for (const reviewer of reviewers) expect(active).toContain(reviewer)
        expect(reviewers).toHaveLength(Math.min(2, active.filter((provider) => provider !== writer).length))
      })
    }
  }

  it('si el redactor fue Gemini, ninguno de los revisores es Gemini y son los otros dos', () => {
    expect(pickReviewers(['gemini', 'claude', 'openai'], 'gemini').sort()).toEqual(['claude', 'openai'])
  })

  it('con un solo proveedor distinto al redactor hay un solo revisor, y con ninguno no hay revisión', () => {
    expect(pickReviewers(['gemini', 'claude'], 'gemini')).toEqual(['claude'])
    expect(pickReviewers(['gemini'], 'gemini')).toEqual([])
    expect(pickReviewers([], 'gemini')).toEqual([])
  })

  it('el simulador no cuenta como proveedor que revise', () => {
    expect(seatsFrom(['simulator'])).toEqual([])
    expect(pickReviewers(['simulator'], 'simulator')).toEqual([])
  })
})

describe('redactor por defecto (P-4603)', () => {
  it('es el balanced más barato disponible: hoy Gemini', () => {
    expect(pickWriter(['gemini', 'claude', 'openai'])).toBe('gemini')
    expect(pickWriter(['openai', 'claude'])).toBe('claude')
    expect(pickWriter(['openai'])).toBe('openai')
    expect(pickWriter([])).toBeNull()
  })
})
