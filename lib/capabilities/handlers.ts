import { canonicalTech } from '@/lib/assistant/intent'
import type { Locale } from '@/lib/i18n/config'
import { createSearcher, type Searcher } from '@/lib/search/searcher'
import { excerpt, fold, sentences } from '@/lib/search/text'
import type { ProjectFact, SearchDoc, SearchIndex } from '@/lib/search/types'
import type { PreferencesPort } from './preferences'
import { CapabilityError } from './types'

export type HandlerEnv = { origin: string | null }

const SUMMARY_MAX = 200

const searchers = new WeakMap<SearchIndex, Searcher<SearchDoc>>()

function searcherFor(index: SearchIndex): Searcher<SearchDoc> {
  const cached = searchers.get(index)
  if (cached) return cached
  const created = createSearcher(index.docs)
  searchers.set(index, created)
  return created
}

function link(env: HandlerEnv, path: string): string {
  if (!env.origin || !path.startsWith('/')) return path
  return new URL(path, env.origin).toString()
}

function summarize(index: SearchIndex, doc: SearchDoc): string {
  const [kind, id] = [doc.kind, doc.id.slice(doc.id.indexOf(':') + 1)]
  if (kind === 'project') return index.facts.projects.find((project) => project.id === id)?.summary ?? ''
  if (kind === 'post') return index.facts.posts.find((post) => post.id === id)?.description ?? ''
  if (kind === 'skill') return doc.text
  if (doc.id === 'section:career') {
    return excerpt(index.facts.career.map((entry) => `${entry.role}, ${entry.company}`).join(' · '), SUMMARY_MAX)
  }
  return excerpt(sentences(doc.text)[0] ?? '', SUMMARY_MAX)
}

export function searchPortfolio(index: SearchIndex, input: { query: string; limit: number }, env: HandlerEnv) {
  const hits = searcherFor(index).search(input.query, { limit: input.limit })
  return {
    query: input.query,
    results: hits.map((hit) => ({
      kind: hit.doc.kind,
      title: hit.doc.title,
      summary: summarize(index, hit.doc),
      url: link(env, hit.doc.url),
    })),
  }
}

function projectOutput(project: ProjectFact, env: HandlerEnv) {
  return {
    id: project.id,
    title: project.title,
    era: project.era,
    summary: project.summary,
    context: project.context,
    role: project.role,
    decisions: project.decisions,
    adrs: project.adrs,
    result: project.result,
    technologies: project.technologies,
    url: link(env, project.url),
    links: { live: project.live, github: project.github, repos: project.repos },
  }
}

export function getProject(index: SearchIndex, input: { id: string }, env: HandlerEnv) {
  const project = index.facts.projects.find((item) => item.id === input.id)
  if (!project) throw new CapabilityError('not_found', `No project with id "${input.id}"`)
  return projectOutput(project, env)
}

function usesTechnology(project: ProjectFact, technology: string): boolean {
  const wanted = canonicalTech(technology)
  return project.technologies.some((name) => canonicalTech(name) === wanted || fold(name) === fold(technology))
}

export function listProjects(index: SearchIndex, input: { technology?: string }, env: HandlerEnv) {
  const technology = input.technology ?? null
  const projects = index.facts.projects
    .filter((project) => (technology ? usesTechnology(project, technology) : true))
    .map((project) => ({
      id: project.id,
      title: project.title,
      era: project.era,
      summary: project.summary,
      technologies: project.technologies,
      url: link(env, project.url),
    }))
  return { technology, count: projects.length, projects }
}

export function getExperience(index: SearchIndex) {
  return {
    career: index.facts.career.map((entry) => ({
      company: entry.company,
      role: entry.role,
      start: entry.start,
      end: entry.end,
      description: entry.description,
    })),
    education: index.facts.education.map((entry) => ({
      institution: entry.institution,
      degree: entry.degree,
      start: entry.start,
      end: entry.end,
    })),
  }
}

export function getSkills(index: SearchIndex, input: { area?: string }, env: HandlerEnv) {
  const { tech, lobes } = index.facts.skills
  const areas = lobes
    .filter((lobe) => !input.area || lobe.id === input.area)
    .map((lobe) => ({
      id: lobe.id,
      name: lobe.name,
      summary: lobe.words,
      url: link(env, lobe.url),
      skills: lobe.skills.flatMap((id) => {
        const skill = tech.find((item) => item.id === id)
        if (skill) return [{ id, name: skill.label, level: skill.progress, years: skill.used }]
        const language = index.facts.languages.find((item) => item.id === id)
        return language ? [{ id, name: language.name, level: language.progress, years: null }] : []
      }),
    }))
  if (input.area && areas.length === 0) throw new CapabilityError('not_found', `No skill area "${input.area}"`)
  return { areas }
}

export function listPosts(index: SearchIndex, input: { tag?: string }, env: HandlerEnv) {
  const tag = input.tag ?? null
  const posts = index.facts.posts
    .filter((post) => (tag ? post.tags.some((item) => fold(item) === fold(tag)) : true))
    .map((post) => ({
      id: post.id,
      title: post.title,
      description: post.description,
      date: post.date,
      tags: post.tags,
      url: link(env, post.url),
    }))
  return { tag, count: posts.length, posts }
}

export function getCv(index: SearchIndex, env: HandlerEnv = { origin: null }) {
  const { cv } = index.facts
  if (!cv) throw new CapabilityError('unavailable', 'The CV link is not published')
  const output: { url: string; label: string; pdf?: { url: string; label: string; bytes: number } } = { url: cv.href, label: cv.label }
  if (cv.pdf) output.pdf = { url: link(env, cv.pdf.href), label: cv.pdf.label, bytes: cv.pdf.bytes }
  return output
}

export function setPreferences(
  preferences: PreferencesPort | null,
  input: { language?: Locale; theme?: 'light' | 'dark' },
) {
  if (!preferences) throw new CapabilityError('unavailable', 'Preferences can only change in the browser')
  const before = { language: preferences.language(), theme: preferences.theme() }
  if (input.theme && input.theme !== before.theme) preferences.setTheme(input.theme)
  if (input.language && input.language !== before.language) preferences.setLanguage(input.language)
  return {
    previous: before,
    current: { language: input.language ?? before.language, theme: input.theme ?? before.theme },
  }
}
