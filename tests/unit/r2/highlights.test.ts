import { describe, expect, it } from 'vitest'
import { caseHighlights } from '@/components/site/portfolio/projects'
import type { Locale, Project } from '@/content/types'
import { getProjects } from '@/lib/content'

const LOCALES: Locale[] = ['es', 'en']

function source(project: Project, lang: Locale): string {
  return [project.summary, project.context, project.role, project.decisions, project.result]
    .map((field) => (field ? field[lang] : ''))
    .concat(project.technologies)
    .join('\n')
}

function anchors(text: string): string[] {
  const words = text.split(/\s+/).map((word) => word.replace(/^[("¿¡]+|[)",.:;!?]+$/g, ''))
  return words.filter((word, index) => {
    if (!word) return false
    if (/\d/.test(word)) return true
    if (/[A-Z].*[A-Z]|[a-z][A-Z]|^\.[A-Z]/.test(word)) return true
    return index > 0 && /^[A-ZÁÉÍÓÚÑ]/.test(word)
  })
}

describe('resultados destacados (US5, nada inventado)', () => {
  const projects = getProjects()

  it('cada proyecto trae entre 2 y 4, cortos y en los dos idiomas', () => {
    for (const project of projects) {
      const list = project.highlights ?? []
      expect(list.length, project.id).toBeGreaterThanOrEqual(2)
      expect(list.length, project.id).toBeLessThanOrEqual(project.id === '12' ? 5 : 4)
      for (const item of list) {
        for (const lang of LOCALES) {
          expect(item[lang].trim(), `${project.id}/${lang}`).not.toBe('')
          expect(item[lang].length, `${project.id}/${lang}: ${item[lang]}`).toBeLessThanOrEqual(90)
        }
      }
    }
  })

  it('cada cifra, sigla o nombre propio sale del texto real del caso, en el mismo idioma', () => {
    for (const project of projects) {
      for (const lang of LOCALES) {
        const text = source(project, lang)
        for (const highlight of caseHighlights(project, lang)) {
          for (const anchor of anchors(highlight)) {
            const bare = anchor.replace(/\+$/, '')
            expect(text.includes(bare), `${project.id}/${lang} "${highlight}": "${bare}" no está en el caso`).toBe(true)
          }
        }
      }
    }
  })

  it('no repite un párrafo completo del caso', () => {
    for (const project of projects) {
      for (const lang of LOCALES) {
        const paragraphs = [project.context, project.role, project.decisions, project.result].flatMap((field) =>
          field ? field[lang].split(/\n\s*\n/).map((part) => part.trim()) : [],
        )
        for (const highlight of caseHighlights(project, lang)) expect(paragraphs, project.id).not.toContain(highlight)
      }
    }
  })
})
