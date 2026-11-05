import { fold, tokenize } from '@/lib/search/text'
import type { AssistantFacts } from '@/lib/search/types'
import {
  ABOUT_PHRASES,
  CODE_REQUEST,
  CONCEPTS,
  DIRECTED,
  EXTERNAL_TECH,
  LOBE_WORDS,
  MANIPULATION_PATTERNS,
  OUT_OF_SCOPE_PATTERNS,
  PROGRAMMING_HINTS,
  SECOND_PERSON,
  SITE_PHRASES,
  SPOKEN_HINTS,
  STOPWORDS,
  STUDY_HINTS,
  TECH_ALIASES,
  type Concept,
} from './lexicon'
import { closeTo, type NormalizedQuestion } from './normalize'

export type Intent =
  | 'refusal'
  | 'greeting'
  | 'thanks'
  | 'technologies'
  | 'tech'
  | 'projects'
  | 'projects_with_tech'
  | 'project'
  | 'experience'
  | 'cv'
  | 'skills_area'
  | 'services'
  | 'hire'
  | 'education'
  | 'courses'
  | 'languages'
  | 'contact'
  | 'about'
  | 'blog'
  | 'site'
  | 'search'
  | 'out_of_scope'
  | 'unknown'

export type ProjectMatch = { id: string; score: number }

export type Classification = {
  intent: Intent
  techs: string[]
  projects: ProjectMatch[]
  concepts: Partial<Record<Concept, number>>
  lobes: string[]
  mentionsAuthor: boolean
}

type ProjectEntry = { id: string; tokens: string[]; collapsed: string; distinctive: string[] }

export type Vocabulary = {
  aliases: Map<string, string>
  fuzzyAliases: string[]
  projects: ProjectEntry[]
  lobes: Map<string, string>
}

const GENERIC_TITLE_WORDS = new Set(['website', 'system', 'sistema', 'world', 'club', 'shop', 'done', 'tracking', 'studio'])

const LOBE_FRIENDLY = new Set<Concept>(['technologies', 'experience', 'projects'])

const CONCEPT_PRIORITY: Concept[] = [
  'contact',
  'hire',
  'services',
  'education',
  'courses',
  'languages',
  'cv',
  'experience',
  'technologies',
  'projects',
  'blog',
  'about',
  'greeting',
  'thanks',
]

export function techKey(name: string): string {
  return fold(name).replace(/[^a-z0-9#+]/g, '')
}

export function canonicalTech(name: string): string {
  const key = techKey(name)
  for (const [canonical, aliases] of Object.entries(TECH_ALIASES)) {
    if (aliases.includes(key)) return canonical
  }
  return key
}

export function buildVocabulary(facts: AssistantFacts): Vocabulary {
  const aliases = new Map<string, string>()
  for (const [canonical, list] of [...Object.entries(TECH_ALIASES), ...Object.entries(EXTERNAL_TECH)]) {
    for (const alias of list) aliases.set(alias, canonical)
  }
  for (const name of [...facts.technologies, ...facts.skills.tech.map((tech) => tech.name)]) {
    aliases.set(techKey(name), canonicalTech(name))
  }
  const fuzzyAliases = [...aliases.keys()].filter((alias) => alias.length >= 6)

  const projects = facts.projects.map((project) => {
    const tokens = tokenize(project.title)
    return {
      id: project.id,
      tokens,
      collapsed: tokens.join(''),
      distinctive: tokens.filter((token) => token.length >= 5 && !GENERIC_TITLE_WORDS.has(token)),
    }
  })

  const known = new Set(facts.skills.lobes.map((lobe) => lobe.id))
  const lobes = new Map<string, string>()
  for (const [id, words] of Object.entries(LOBE_WORDS)) {
    if (!known.has(id)) continue
    for (const word of words) lobes.set(word, id)
  }

  return { aliases, fuzzyAliases, projects, lobes }
}

function detectLobes(tokens: string[], vocabulary: Vocabulary): string[] {
  const found: string[] = []
  for (const token of tokens) {
    const id = vocabulary.lobes.get(token)
    if (id && !found.includes(id)) found.push(id)
  }
  return found
}

export function isManipulation(question: NormalizedQuestion): boolean {
  return MANIPULATION_PATTERNS.some((pattern) => pattern.test(question.text) || pattern.test(question.folded))
}

function detectTechs(tokens: string[], vocabulary: Vocabulary): string[] {
  const found: string[] = []
  const add = (canonical: string) => {
    if (!found.includes(canonical)) found.push(canonical)
  }
  let i = 0
  while (i < tokens.length) {
    let consumed = 0
    for (const size of [3, 2, 1]) {
      if (i + size > tokens.length) continue
      const candidate = tokens.slice(i, i + size).join('')
      const canonical = vocabulary.aliases.get(candidate)
      if (canonical) {
        add(canonical)
        consumed = size
        break
      }
    }
    if (consumed === 0) {
      const token = tokens[i]
      if (token.length >= 6 && !STOPWORDS.has(token)) {
        const near = vocabulary.fuzzyAliases.find((alias) => closeTo(token, alias))
        if (near) add(vocabulary.aliases.get(near) ?? near)
      }
      consumed = 1
    }
    i += consumed
  }
  return found
}

function detectProjects(tokens: string[], vocabulary: Vocabulary): ProjectMatch[] {
  const collapsedQuestion = tokens.join('')
  const matches: ProjectMatch[] = []
  for (const project of vocabulary.projects) {
    if (project.tokens.length === 0) continue
    const matched = project.tokens.filter((word) => tokens.some((token) => closeTo(token, word))).length
    const ratio = matched / project.tokens.length
    const distinctive = project.distinctive.some((word) => tokens.some((token) => closeTo(token, word)))
    const exact = project.collapsed.length >= 5 && collapsedQuestion.includes(project.collapsed)
    if (exact || ratio >= 0.6 || (distinctive && ratio >= 0.5)) {
      matches.push({ id: project.id, score: exact ? 1 + ratio : ratio })
    }
  }
  return matches.sort((a, b) => b.score - a.score)
}

function scoreConcepts(tokens: string[], vocabulary: Vocabulary): Partial<Record<Concept, number>> {
  const scores: Partial<Record<Concept, number>> = {}
  const bump = (concept: Concept, value: number) => {
    scores[concept] = (scores[concept] ?? 0) + value
  }
  for (const token of tokens) {
    for (const concept of Object.keys(CONCEPTS) as Concept[]) {
      const { words, weak = [] } = CONCEPTS[concept]
      if (words.includes(token)) bump(concept, 1)
      else if (weak.includes(token)) bump(concept, 0.5)
      else if (
        token.length >= 5 &&
        !vocabulary.aliases.has(token) &&
        !SECOND_PERSON.has(token) &&
        words.some((word) => word.length >= 5 && closeTo(token, word))
      ) {
        bump(concept, 0.8)
      }
    }
  }
  if (tokens.includes('carrera')) {
    if (tokens.some((token) => STUDY_HINTS.has(token))) bump('education', 1)
    else bump('experience', 1)
  }
  if ((scores.languages ?? 0) > 0 && tokens.some((token) => PROGRAMMING_HINTS.has(token)) && !tokens.some((token) => SPOKEN_HINTS.has(token))) {
    bump('technologies', scores.languages ?? 0)
    delete scores.languages
  }
  return scores
}

function bestConcept(scores: Partial<Record<Concept, number>>): Concept | null {
  let best: Concept | null = null
  let bestScore = 0
  for (const concept of CONCEPT_PRIORITY) {
    const score = scores[concept] ?? 0
    if (score > bestScore) {
      best = concept
      bestScore = score
    }
  }
  return bestScore >= 0.8 ? best : null
}

function mentionsAuthor(tokens: string[]): boolean {
  return tokens.some((token) => SECOND_PERSON.has(token) || DIRECTED.has(token) || /(aste|iste)$/.test(token))
}

export function classify(question: NormalizedQuestion, vocabulary: Vocabulary): Classification {
  const { tokens, text } = question
  const author = mentionsAuthor(tokens)
  const base = { techs: [] as string[], projects: [] as ProjectMatch[], concepts: {}, lobes: [] as string[], mentionsAuthor: author }

  if (isManipulation(question)) return { ...base, intent: 'refusal' }
  if (tokens.length === 0) return { ...base, intent: 'greeting' }
  if (CODE_REQUEST.test(text)) return { ...base, intent: 'out_of_scope' }

  const techs = detectTechs(tokens, vocabulary)
  const projects = detectProjects(tokens, vocabulary)
  const concepts = scoreConcepts(tokens, vocabulary)
  const about = ABOUT_PHRASES.some((pattern) => pattern.test(text))
  const site = SITE_PHRASES.some((pattern) => pattern.test(text))
  const lobes = detectLobes(tokens, vocabulary)
  const result = { ...base, techs, projects, concepts, lobes }
  const projectsConcept = (concepts.projects ?? 0) >= 0.5
  const strongOther = (['contact', 'services', 'hire', 'education', 'courses', 'blog'] as Concept[]).some(
    (concept) => (concepts[concept] ?? 0) >= 1,
  )

  if (projects.length > 0 && !strongOther) return { ...result, intent: 'project' }
  if (techs.length > 0 && projectsConcept) return { ...result, intent: 'projects_with_tech' }
  if (techs.length > 0 && !strongOther) return { ...result, intent: 'tech' }
  if (site) return { ...result, intent: 'site' }
  if (about && !strongOther) return { ...result, intent: 'about' }

  const concept = bestConcept(concepts)
  if (lobes.length > 0 && !strongOther && (concept === null || LOBE_FRIENDLY.has(concept))) return { ...result, intent: 'skills_area' }
  if (concept) return { ...result, intent: concept }

  if (OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(text))) return { ...result, intent: 'out_of_scope' }
  return { ...result, intent: 'search' }
}
