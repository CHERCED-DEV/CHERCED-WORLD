import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { approvedPitch, casePitches } from '@/content/pitches'
import { getProjects } from '@/lib/content'

describe('pitch de 60 segundos (033)', () => {
  it('cada guion es de un caso que existe y dura cerca de un minuto en los dos idiomas', () => {
    const ids = new Set(getProjects().map((project) => project.id))
    for (const pitch of casePitches) {
      expect(ids.has(pitch.caseId), pitch.caseId).toBe(true)
      for (const lang of ['es', 'en'] as const) {
        const words = pitch.script[lang].split(/\s+/).length
        expect(words, `${pitch.caseId} ${lang}`).toBeGreaterThanOrEqual(90)
        expect(words, `${pitch.caseId} ${lang}`).toBeLessThanOrEqual(170)
      }
    }
  })

  it('FR-3301: nada se publica sin la aprobación del autor', () => {
    for (const pitch of casePitches) expect(approvedPitch(pitch.caseId) === undefined).toBe(!pitch.approved)
    expect(readFileSync('content/pitches.ts', 'utf8')).not.toMatch(/approved: true/)
  })
})
