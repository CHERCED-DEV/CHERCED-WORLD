import { describe, expect, it, vi } from 'vitest'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { ask, loadAssistants } = await import('../l5/support/assistant')
const { buildSearchIndex } = await import('@/lib/search/build-index')

const assistants = await loadAssistants()
const LEARNING = [/azure ai foundry/i, /semantic kernel/i, /\bRAG\b/, /embeddings/i]

describe('el chat ya no nombra lo que el autor está aprendiendo (2026-11-04)', () => {
  it('el índice del chat toma las skills del contenido y ya no trae las tres', async () => {
    for (const lang of ['es', 'en'] as const) {
      const index = await buildSearchIndex(lang)
      const skills = JSON.stringify(index.facts.skills.tech)
      for (const pattern of LEARNING) expect(skills, `${lang}: ${pattern}`).not.toMatch(pattern)
    }
  })

  for (const question of ['¿Con qué tecnologías trabaja?', '¿Qué tecnologías dominas?', 'What technologies do you work with?']) {
    it(`"${question}" no las nombra`, () => {
      const answer = ask(assistants, question)
      expect(answer.text.length).toBeGreaterThan(20)
      for (const pattern of LEARNING) expect(answer.text, String(pattern)).not.toMatch(pattern)
    })
  }

  for (const question of ['¿Sabes Semantic Kernel?', 'Do you know Azure AI Foundry?', '¿Qué nivel tienes en RAG?']) {
    it(`"${question}" no inventa un nivel`, () => {
      const answer = ask(assistants, question)
      expect(answer.text).not.toMatch(/\b(60|75)\s?%/)
    })
  }
})
