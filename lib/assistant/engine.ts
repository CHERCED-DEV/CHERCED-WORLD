import { familyOf, technologyAliases, technologyById, technologyName, technologyParts } from '@/content/technologies'
import type { Locale } from '@/lib/i18n/config'
import { projectDetails } from '@/lib/search/facts'
import { createSearcher, type Searcher } from '@/lib/search/searcher'
import { excerpt, fold, sentences, tokenize } from '@/lib/search/text'
import type { AdrFact, AssistantFacts, PageId, ProjectFact, SearchDoc, SearchIndex, SkillFact } from '@/lib/search/types'
import { buildVocabulary, canonicalTech, classify, type Classification, type Intent, type Vocabulary } from './intent'
import { CASE_FILLER, CONCEPTS, DIRECTED, EXTERNAL_DISPLAY, EXTERNAL_TECH, SECOND_PERSON, SERVICE_FOCUS, SOCIAL_DISPLAY } from './lexicon'
import { closeTo, normalizeQuestion, type NormalizedQuestion } from './normalize'
import { pickPassages, projectPassages, rankPassages, type Passage } from './passages'
import { render, type AssistantTemplateKey, type AssistantTemplates } from './templates'

export type AnswerKind = 'answer' | 'unknown' | 'out_of_scope' | 'refusal' | 'greeting'

export type AnswerLink = { label: string; href: string; external: boolean }

export type AssistantAnswer = {
  kind: AnswerKind
  intent: Intent
  lang: Locale
  text: string
  links: AnswerLink[]
}

export type Assistant = { lang: Locale; answer: (question: string) => AssistantAnswer }

type Context = {
  lang: Locale
  facts: AssistantFacts
  templates: AssistantTemplates
  vocabulary: Vocabulary
  searcher: Searcher<SearchDoc>
  docs: SearchDoc[]
  passages: Passage[]
}

type Draft = { kind: AnswerKind; parts: string[]; links: AnswerLink[] }

const MAX_LINKS = 5

function tr(ctx: Context, key: AssistantTemplateKey, vars?: Record<string, string | number>): string {
  return render(ctx.templates, key, vars)
}

function conjunction(ctx: Context, next: string): string {
  const and = tr(ctx, 'assistant.tpl.and')
  return ctx.lang === 'es' && and === 'y' && /^h?i(?![aeiou])/.test(fold(next)) ? 'e' : and
}

function joinList(ctx: Context, items: string[]): string {
  if (items.length <= 1) return items.join('')
  const last = items[items.length - 1]!
  return `${items.slice(0, -1).join(', ')} ${conjunction(ctx, last)} ${last}`
}

function percent(ctx: Context, value: number): string {
  return ctx.lang === 'es' ? `${value} %` : `${value}%`
}

function quote(ctx: Context, value: string): string {
  return ctx.lang === 'es' ? `«${value}»` : `“${value}”`
}

function formatDate(ctx: Context, value: string): string {
  const [year, month] = value.split('-')
  if (!month) return year ?? value
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
  return new Intl.DateTimeFormat(ctx.lang, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
}

function period(ctx: Context, start: string, end: string | null): string {
  return `${formatDate(ctx, start)} – ${end ? formatDate(ctx, end) : tr(ctx, 'assistant.tpl.present')}`
}

function displayTech(canonical: string, fallback?: string): string {
  const known = technologyById(canonical)
  if (known) return known.name
  if (EXTERNAL_DISPLAY[canonical]) return EXTERNAL_DISPLAY[canonical]
  return fallback ? technologyName(fallback) : canonical
}

function sentenceCase(ctx: Context, value: string): string {
  const lower = value.trim().toLocaleLowerCase(ctx.lang)
  return `${lower.charAt(0).toLocaleUpperCase(ctx.lang)}${lower.slice(1)}`
}

function skillDisplay(ctx: Context, skill: SkillFact): string {
  return skill.label !== skill.name ? sentenceCase(ctx, skill.label) : technologyName(skill.name)
}

function skillCanonicals(skill: SkillFact): string[] {
  return [canonicalTech(skill.name), ...technologyParts(skill.name).map(canonicalTech)]
}

function skillFor(ctx: Context, canonical: string): SkillFact | undefined {
  const { tech } = ctx.facts.skills
  const family = familyOf(canonical)
  return (
    tech.find((skill) => skillCanonicals(skill).includes(canonical)) ??
    tech.find((skill) => skillCanonicals(skill).some((id) => familyOf(id) === family))
  )
}

function pageLink(ctx: Context, id: PageId): AnswerLink {
  return { label: ctx.facts.pages[id].title, href: ctx.facts.pages[id].url, external: false }
}

function projectLink(project: ProjectFact): AnswerLink {
  return { label: project.title, href: project.url, external: false }
}

function lowerFor(ctx: Context, value: string): string {
  return ctx.lang === 'es' ? value.toLocaleLowerCase('es') : value
}

function projectsUsing(ctx: Context, canonical: string): ProjectFact[] {
  const family = familyOf(canonical)
  return ctx.facts.projects.filter((project) => project.technologies.some((name) => familyOf(canonicalTech(name)) === family))
}

function aliasesOf(canonical: string): string[] {
  if (technologyById(canonical)) return technologyAliases(canonical).map((alias) => alias.toLowerCase())
  return EXTERNAL_TECH[canonical] ?? [canonical]
}

function projectsMentioning(ctx: Context, canonical: string): ProjectFact[] {
  const aliases = aliasesOf(canonical)
  return ctx.facts.projects.filter((project) => {
    const tokens = tokenize([project.summary, ...projectDetails(project)].join(' '))
    return aliases.some((alias) => tokens.includes(alias))
  })
}

function findMention(ctx: Context, canonical: string): { doc: SearchDoc; sentence: string } | null {
  const aliases = aliasesOf(canonical).filter((alias) => alias.length >= 2)
  for (const doc of ctx.docs) {
    for (const sentence of sentences(doc.text)) {
      const tokens = tokenize(sentence)
      const pairs = tokens.slice(1).map((token, index) => `${tokens[index]}${token}`)
      if (aliases.some((alias) => tokens.includes(alias) || pairs.includes(alias))) return { doc, sentence }
    }
  }
  return null
}

function unknown(ctx: Context, prefix?: string): Draft {
  return {
    kind: 'unknown',
    parts: prefix ? [prefix, tr(ctx, 'assistant.tpl.askDirect')] : [tr(ctx, 'assistant.unknown')],
    links: [pageLink(ctx, 'contact')],
  }
}

function answerTech(ctx: Context, canonicals: string[]): Draft {
  const parts: string[] = []
  const links: AnswerLink[] = []
  let known = false
  for (const canonical of canonicals.slice(0, 3)) {
    const skill = skillFor(ctx, canonical)
    const listed = ctx.facts.technologies.find((name) => familyOf(canonicalTech(name)) === familyOf(canonical))
    const name = displayTech(canonical, skill?.name ?? listed)
    const used = projectsUsing(ctx, canonical)
    const projects = used.length === 0 && (skill || listed) ? projectsMentioning(ctx, canonical) : used
    if (skill || listed || projects.length > 0) {
      known = true
      parts.push(tr(ctx, 'assistant.tpl.techKnown', { tech: name }))
      if (skill) parts.push(tr(ctx, 'assistant.tpl.techLevel', { progress: skill.progress }))
      if (projects.length > 0) {
        parts.push(tr(ctx, 'assistant.tpl.techProjects', { list: joinList(ctx, projects.slice(0, 5).map((p) => p.title)) }))
        links.push(...projects.slice(0, 3).map(projectLink))
      } else {
        parts.push(tr(ctx, 'assistant.tpl.techNoProjects', { tech: name }))
      }
      links.unshift(pageLink(ctx, 'about'))
      continue
    }
    const mention = findMention(ctx, canonical)
    if (mention) {
      known = true
      parts.push(tr(ctx, 'assistant.tpl.techMention', { tech: name, quote: excerpt(mention.sentence, 220) }))
      links.push({ label: mention.doc.title, href: mention.doc.url, external: false })
      continue
    }
    parts.push(tr(ctx, 'assistant.tpl.techUnknown', { tech: name }))
  }
  if (!known) return unknown(ctx, parts.join(' '))
  return { kind: 'answer', parts, links }
}

function answerTechnologies(ctx: Context): Draft {
  const { skills, technologies } = ctx.facts
  const names = skills.tech.map((tech) => skillDisplay(ctx, tech))
  const covered = new Set(skills.tech.flatMap((tech) => skillCanonicals(tech).map(familyOf)))
  const extra = technologies
    .filter((name) => !covered.has(familyOf(canonicalTech(name))))
    .slice(0, Math.max(0, 14 - names.length))
    .map((name) => technologyName(name))
  const all = [...names, ...extra]
  if (all.length === 0) return unknown(ctx)
  const parts = [tr(ctx, 'assistant.tpl.technologies', { list: joinList(ctx, all) })]
  const strongest = skills.tech.slice(0, 3)
  if (strongest.length > 0) {
    parts.push(
      tr(ctx, 'assistant.tpl.strongest', {
        list: joinList(
          ctx,
          strongest.map((tech) => `${skillDisplay(ctx, tech)} (${percent(ctx, tech.progress)})`),
        ),
      }),
    )
  }
  return { kind: 'answer', parts, links: [pageLink(ctx, 'about'), pageLink(ctx, 'portfolio')] }
}

const CASE_CONCEPT_WORDS = new Set(Object.values(CONCEPTS).flatMap(({ words, weak = [] }) => [...words, ...weak]))

function focusTerms(question: NormalizedQuestion, project?: ProjectFact): string[] {
  const title = project ? tokenize(project.title) : []
  return [
    ...new Set(
      question.content.filter(
        (token) =>
          token.length >= 4 &&
          !SECOND_PERSON.has(token) &&
          !DIRECTED.has(token) &&
          !CASE_FILLER.has(token) &&
          !CASE_CONCEPT_WORDS.has(token) &&
          !title.some((word) => closeTo(token, word)),
      ),
    ),
  ]
}

function formatAdr(ctx: Context, adr: AdrFact): string {
  return tr(ctx, 'assistant.tpl.adr', { decision: adr.decision.replace(/[.\s]+$/, ''), why: adr.why, tradeoff: adr.tradeoff })
}

function caseDraft(ctx: Context, chosen: Passage[]): Draft {
  const project = chosen[0]!.project
  return {
    kind: 'answer',
    parts: [tr(ctx, 'assistant.tpl.caseDetail', { title: project.title, text: chosen.map((item) => item.text).join(' ') })],
    links: [projectLink(project)],
  }
}

function answerCaseDetail(ctx: Context, project: ProjectFact, question: NormalizedQuestion): Draft | null {
  const terms = focusTerms(question, project)
  if (terms.length === 0) return null
  const passages = ctx.passages.filter((item) => item.project.id === project.id)
  const hits = rankPassages(terms, passages)
  const [best] = hits
  if (!best || best.matched.length < Math.ceil(terms.length / 2)) return null
  return caseDraft(ctx, pickPassages(best, hits, passages))
}

function answerFromCases(ctx: Context, question: NormalizedQuestion): Draft | null {
  const terms = focusTerms(question)
  if (terms.length === 0) return null
  const hits = rankPassages(terms, ctx.passages)
  const [best] = hits
  if (!best || best.matched.length < Math.ceil((terms.length * 2) / 3)) return null
  const tied = hits.filter((hit) => hit.matched.length === best.matched.length)
  if (new Set(tied.map((hit) => hit.passage.project.id)).size > 1) return null
  return caseDraft(ctx, pickPassages(best, hits, ctx.passages))
}

function answerProjects(ctx: Context, projects: ProjectFact[]): Draft {
  if (projects.length === 0) return unknown(ctx)
  return {
    kind: 'answer',
    parts: [tr(ctx, 'assistant.tpl.projects', { list: joinList(ctx, projects.map((project) => project.title)) })],
    links: [pageLink(ctx, 'portfolio'), ...projects.slice(0, 3).map(projectLink)],
  }
}

function answerProject(ctx: Context, project: ProjectFact): Draft {
  const techs = project.technologies.slice(0, 8).map((name) => technologyName(name))
  const parts = [`${project.title}: ${project.summary}`]
  if (techs.length > 0) parts.push(tr(ctx, 'assistant.tpl.projectTech', { list: joinList(ctx, techs) }))
  const links: AnswerLink[] = [projectLink(project)]
  if (project.live) links.push({ label: tr(ctx, 'assistant.link.live', { title: project.title }), href: project.live, external: true })
  if (project.github) {
    links.push({ label: tr(ctx, 'assistant.link.github', { title: project.title }), href: project.github, external: true })
  }
  return { kind: 'answer', parts, links }
}

function answerProjectsWithTech(ctx: Context, canonicals: string[]): Draft {
  const canonical = canonicals[0]
  const projects = projectsUsing(ctx, canonical)
  if (projects.length === 0) projects.push(...projectsMentioning(ctx, canonical))
  const skill = skillFor(ctx, canonical)
  const name = displayTech(canonical, skill?.name)
  if (projects.length > 0) {
    return {
      kind: 'answer',
      parts: [tr(ctx, 'assistant.tpl.projectsWithTech', { tech: name, list: joinList(ctx, projects.map((p) => p.title)) })],
      links: [...projects.slice(0, 4).map(projectLink), pageLink(ctx, 'portfolio')],
    }
  }
  const tech = answerTech(ctx, [canonical])
  if (tech.kind !== 'answer') return tech
  return { ...tech, links: [...tech.links, pageLink(ctx, 'portfolio')] }
}

function cvLink(ctx: Context): AnswerLink[] {
  const { cv } = ctx.facts
  if (!cv) return []
  const links: AnswerLink[] = []
  if (cv.pdf) links.push({ label: cv.pdf.label, href: cv.pdf.href, external: true })
  links.push({ label: cv.label, href: cv.href, external: true })
  return links
}

function answerExperience(ctx: Context): Draft {
  const { career, about, contact } = ctx.facts
  if (career.length > 0) {
    const items = career.map((entry) => `${entry.role}, ${entry.company} (${period(ctx, entry.start, entry.end)})`)
    return {
      kind: 'answer',
      parts: [tr(ctx, 'assistant.tpl.experience', { list: joinList(ctx, items) })],
      links: [pageLink(ctx, 'about'), ...cvLink(ctx)],
    }
  }
  const dated = sentences(contact.description).filter((sentence) => /\b(19|20)\d{2}\b/.test(sentence))
  return { kind: 'answer', parts: [about, ...dated], links: [pageLink(ctx, 'about'), pageLink(ctx, 'contact'), ...cvLink(ctx)] }
}

function answerCv(ctx: Context): Draft {
  const experience = answerExperience(ctx)
  const { cv } = ctx.facts
  if (!cv) return experience
  return { kind: 'answer', parts: [`${cv.label}.`, ...experience.parts], links: [...cvLink(ctx), ...experience.links] }
}

function skillName(ctx: Context, id: string): string | null {
  const tech = ctx.facts.skills.tech.find((skill) => skill.id === id)
  if (tech) return skillDisplay(ctx, tech)
  return ctx.facts.languages.find((language) => language.id === id)?.name ?? null
}

function answerLobe(ctx: Context, ids: string[]): Draft {
  const lobes = ids
    .map((id) => ctx.facts.skills.lobes.find((lobe) => lobe.id === id))
    .filter((lobe): lobe is NonNullable<typeof lobe> => Boolean(lobe))
    .slice(0, 2)
  if (lobes.length === 0) return unknown(ctx)
  const parts: string[] = []
  const links: AnswerLink[] = []
  for (const lobe of lobes) {
    const names = lobe.skills.map((id) => skillName(ctx, id)).filter((name): name is string => name !== null)
    const skills = names.length > 0 ? tr(ctx, 'assistant.tpl.technologies', { list: joinList(ctx, names) }) : ''
    if (lobe.words) parts.push(`${lobe.name}: ${lobe.words}`, skills)
    else parts.push(`${lobe.name}: ${skills}`)
    links.push({ label: lobe.name, href: lobe.url, external: false })
  }
  const projects = lobes
    .flatMap((lobe) => lobe.projects)
    .map((id) => ctx.facts.projects.find((project) => project.id === id))
    .filter((project): project is ProjectFact => Boolean(project))
  links.push(...projects.slice(0, 2).map(projectLink), pageLink(ctx, 'about'))
  return { kind: 'answer', parts, links }
}

function serviceFocus(ctx: Context, question: NormalizedQuestion) {
  for (const [id, words] of Object.entries(SERVICE_FOCUS)) {
    if (question.tokens.some((token) => words.includes(token))) {
      const item = ctx.facts.services.items.find((service) => service.id === id)
      if (item) return item
    }
  }
  return null
}

function answerServices(ctx: Context, question: NormalizedQuestion, hire: boolean): Draft {
  const { items } = ctx.facts.services
  if (items.length === 0) return unknown(ctx)
  const focus = serviceFocus(ctx, question)
  const parts = focus
    ? [`${focus.title}: ${focus.description}`]
    : [
        tr(ctx, 'assistant.tpl.services', { list: joinList(ctx, items.map((item) => lowerFor(ctx, item.title))) }),
        ...items.map((item) => item.description),
      ]
  const links = [pageLink(ctx, 'services')]
  if (hire) {
    parts.push(tr(ctx, 'assistant.tpl.hire'))
    links.unshift(pageLink(ctx, 'contact'))
  }
  return { kind: 'answer', parts, links }
}

function answerEducation(ctx: Context): Draft {
  const { education } = ctx.facts
  if (education.length === 0) return unknown(ctx)
  const items = education.map((entry) => `${entry.degree}, ${entry.institution} (${period(ctx, entry.start, entry.end)})`)
  return { kind: 'answer', parts: [tr(ctx, 'assistant.tpl.education', { list: joinList(ctx, items) })], links: [pageLink(ctx, 'about')] }
}

function answerCourses(ctx: Context): Draft {
  const { courses, platzi } = ctx.facts
  const names = courses.map((course) => course.name).filter((name) => !/^(y|and) (otr|other)/.test(fold(name)))
  if (names.length === 0) return unknown(ctx)
  return {
    kind: 'answer',
    parts: [tr(ctx, 'assistant.tpl.courses', { list: joinList(ctx, names) })],
    links: [pageLink(ctx, 'about'), { label: platzi.label, href: platzi.href, external: true }],
  }
}

function answerLanguages(ctx: Context): Draft {
  const { languages } = ctx.facts
  if (languages.length === 0) return unknown(ctx)
  const items = languages.map((language) => {
    const name = lowerFor(ctx, language.name)
    return language.level ? `${name} ${language.level}` : name
  })
  return { kind: 'answer', parts: [tr(ctx, 'assistant.tpl.languages', { list: joinList(ctx, items) })], links: [pageLink(ctx, 'about')] }
}

function answerContact(ctx: Context): Draft {
  const { contact, socials } = ctx.facts
  const parts = [contact.email ? tr(ctx, 'assistant.tpl.contact', { email: contact.email }) : tr(ctx, 'assistant.tpl.contactForm')]
  const networks = socials.filter((social) => social.id !== 'email')
  if (networks.length > 0) {
    parts.push(tr(ctx, 'assistant.tpl.socials', { list: joinList(ctx, networks.map((social) => SOCIAL_DISPLAY[social.id] ?? social.label)) }))
  }
  const links: AnswerLink[] = [pageLink(ctx, 'contact')]
  if (contact.email) links.push({ label: contact.email, href: `mailto:${contact.email}`, external: true })
  links.push(...networks.map((social) => ({ label: social.label, href: social.href, external: true })))
  return { kind: 'answer', parts, links }
}

function answerBlog(ctx: Context): Draft {
  const { posts } = ctx.facts
  if (posts.length === 0) return unknown(ctx)
  return {
    kind: 'answer',
    parts: [tr(ctx, 'assistant.tpl.blog', { list: joinList(ctx, posts.map((post) => quote(ctx, post.title))) })],
    links: [pageLink(ctx, 'blog'), ...posts.slice(0, 3).map((post) => ({ label: post.title, href: post.url, external: false }))],
  }
}

function answerSite(ctx: Context): Draft {
  const project = ctx.facts.projects.find((item) => fold(item.title).includes('cherced'))
  if (project) return answerProject(ctx, project)
  return { kind: 'answer', parts: [ctx.facts.about], links: [pageLink(ctx, 'about'), pageLink(ctx, 'portfolio')] }
}

function answerSearch(ctx: Context, question: NormalizedQuestion): Draft | null {
  const terms = [...new Set(question.content.filter((token) => token.length >= 4 && !SECOND_PERSON.has(token) && !DIRECTED.has(token)))]
  if (terms.length === 0) return null
  const needed = Math.ceil((terms.length * 2) / 3)
  const hits = ctx.searcher
    .search(terms.join(' '), { limit: 6, exact: true })
    .filter((hit) => new Set(hit.matched).size >= needed)
    .slice(0, 3)
  if (hits.length === 0) return null
  const docs = hits.map((hit) => hit.doc)
  return {
    kind: 'answer',
    parts: [
      tr(ctx, 'assistant.tpl.search', { list: joinList(ctx, docs.map((doc) => doc.title)) }),
      excerpt(docs[0].text, 220),
    ],
    links: docs.map((doc) => ({ label: doc.title, href: doc.url, external: false })),
  }
}

function topics(ctx: Context): string {
  return tr(ctx, 'assistant.tpl.topics')
}

function respond(ctx: Context, question: NormalizedQuestion, result: Classification): Draft {
  switch (result.intent) {
    case 'refusal':
      return { kind: 'refusal', parts: [tr(ctx, 'assistant.tpl.refusal'), topics(ctx)], links: [] }
    case 'greeting':
      return { kind: 'greeting', parts: [tr(ctx, 'assistant.tpl.greeting'), topics(ctx)], links: [] }
    case 'thanks':
      return { kind: 'greeting', parts: [tr(ctx, 'assistant.tpl.thanks'), topics(ctx)], links: [] }
    case 'out_of_scope':
      return { kind: 'out_of_scope', parts: [tr(ctx, 'assistant.outOfScope'), topics(ctx)], links: [] }
    case 'technologies':
      return answerTechnologies(ctx)
    case 'tech':
      return answerTech(ctx, result.techs)
    case 'projects_with_tech':
      return answerProjectsWithTech(ctx, result.techs)
    case 'project': {
      const [first, second] = result.projects
      const byId = (id: string) => ctx.facts.projects.find((project) => project.id === id)
      if (first && (!second || first.score - second.score >= 0.25)) {
        const project = byId(first.id)
        if (project) return answerCaseDetail(ctx, project, question) ?? answerProject(ctx, project)
      }
      return answerProjects(
        ctx,
        result.projects.map((match) => byId(match.id)).filter((project): project is ProjectFact => Boolean(project)),
      )
    }
    case 'projects':
      return answerProjects(ctx, ctx.facts.projects)
    case 'experience':
      return answerExperience(ctx)
    case 'cv':
      return answerCv(ctx)
    case 'skills_area':
      return answerLobe(ctx, result.lobes)
    case 'services':
      return answerServices(ctx, question, (result.concepts.hire ?? 0) > 0)
    case 'hire':
      return answerServices(ctx, question, true)
    case 'education':
      return answerEducation(ctx)
    case 'courses':
      return answerCourses(ctx)
    case 'languages':
      return answerLanguages(ctx)
    case 'contact':
      return answerContact(ctx)
    case 'about':
      return { kind: 'answer', parts: [ctx.facts.about], links: [pageLink(ctx, 'about')] }
    case 'blog':
      return answerBlog(ctx)
    case 'site':
      return answerSite(ctx)
    case 'search':
    case 'unknown': {
      const found = answerFromCases(ctx, question) ?? answerSearch(ctx, question)
      if (found) return found
      if (result.mentionsAuthor) return unknown(ctx)
      return { kind: 'out_of_scope', parts: [tr(ctx, 'assistant.outOfScope'), topics(ctx)], links: [] }
    }
  }
}

function dedupeLinks(links: AnswerLink[]): AnswerLink[] {
  const seen = new Set<string>()
  return links.filter((link) => {
    if (seen.has(link.href)) return false
    seen.add(link.href)
    return true
  })
}

export function createAssistant(index: SearchIndex, templates: AssistantTemplates): Assistant {
  const ctx: Context = {
    lang: index.lang,
    facts: index.facts,
    templates,
    vocabulary: buildVocabulary(index.facts),
    searcher: createSearcher(index.docs),
    docs: index.docs,
    passages: [],
  }
  ctx.passages = index.facts.projects.flatMap((project) => projectPassages(project, (adr) => formatAdr(ctx, adr)))
  return {
    lang: index.lang,
    answer(input) {
      const question = normalizeQuestion(input)
      const result = classify(question, ctx.vocabulary)
      const draft = respond(ctx, question, result)
      const intent: Intent = draft.kind === 'unknown' && result.intent === 'search' ? 'unknown' : result.intent
      return {
        kind: draft.kind,
        intent,
        lang: ctx.lang,
        text: draft.parts.filter((part) => part.trim().length > 0).join(' '),
        links: dedupeLinks(draft.links).slice(0, MAX_LINKS),
      }
    },
  }
}
