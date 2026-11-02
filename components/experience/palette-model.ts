import { t, type Dictionary } from '@/lib/i18n/translate'
import { createSearcher, type Searcher } from '@/lib/search/searcher'
import { fold } from '@/lib/search/text'
import type { SearchDoc } from '@/lib/search/types'

export type PaletteGroup = 'secret' | 'pages' | 'projects' | 'posts' | 'actions'

export type PaletteCommand =
  | { type: 'navigate'; href: string }
  | { type: 'theme'; to: 'dark' | 'light' }
  | { type: 'lang' }
  | { type: 'assistant' }
  | { type: 'copy-email' }
  | { type: 'capsule' }

export type PaletteItem = {
  id: string
  group: PaletteGroup
  title: string
  hint?: string
  command: PaletteCommand
}

export type PaletteDoc = SearchDoc & { item: PaletteItem }

export const GROUP_ORDER: PaletteGroup[] = ['secret', 'pages', 'projects', 'posts', 'actions']

export const MAX_RESULTS = 12

const SECRET_COMMANDS = ['2023', 'enecimo intento', 'enesimo intento', 'nth attempt']

export function isCapsuleCommand(query: string): boolean {
  const normalized = fold(query).replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim()
  return SECRET_COMMANDS.some((command) => normalized === command || (command.length > 4 && normalized.startsWith(command)))
}

export type ActionContext = {
  theme: 'dark' | 'light'
  email: string | null
  capsuleFound: boolean
}

const ACTION_KEYWORDS: Record<string, string> = {
  theme: 'tema theme oscuro claro dark light modo mode',
  lang: 'idioma language english espanol ingles spanish',
  assistant: 'asistente assistant pregunta ask chat ia ai',
  'copy-email': 'correo email mail copiar copy contacto contact',
  capsule: 'capsula capsule 2023 tiempo time historia history',
}

export function buildActions(labels: Dictionary, context: ActionContext): PaletteItem[] {
  const next = context.theme === 'dark' ? 'light' : 'dark'
  const actions: PaletteItem[] = [
    {
      id: 'action:theme',
      group: 'actions',
      title: t(labels, next === 'light' ? 'palette.action.themeLight' : 'palette.action.themeDark'),
      command: { type: 'theme', to: next },
    },
    { id: 'action:lang', group: 'actions', title: t(labels, 'palette.action.lang'), command: { type: 'lang' } },
    { id: 'action:assistant', group: 'actions', title: t(labels, 'palette.action.assistant'), command: { type: 'assistant' } },
  ]
  if (context.email) {
    actions.push({
      id: 'action:copy-email',
      group: 'actions',
      title: t(labels, 'palette.copyEmail'),
      hint: context.email,
      command: { type: 'copy-email' },
    })
  }
  if (context.capsuleFound) {
    actions.push({ id: 'action:capsule', group: 'actions', title: t(labels, 'palette.action.capsule'), command: { type: 'capsule' } })
  }
  return actions
}

function groupOf(doc: SearchDoc): PaletteGroup | null {
  if (doc.kind === 'page') return 'pages'
  if (doc.kind === 'project') return 'projects'
  if (doc.kind === 'post') return 'posts'
  return null
}

export function toPaletteDocs(docs: SearchDoc[], actions: PaletteItem[]): PaletteDoc[] {
  const fromIndex = docs.flatMap((doc): PaletteDoc[] => {
    const group = groupOf(doc)
    if (!group) return []
    return [{ ...doc, item: { id: doc.id, group, title: doc.title, command: { type: 'navigate', href: doc.url } } }]
  })
  const fromActions = actions.map(
    (action): PaletteDoc => ({
      id: action.id,
      kind: 'section',
      title: action.title,
      text: action.hint ?? '',
      keywords: ACTION_KEYWORDS[action.command.type] ?? '',
      url: '',
      item: action,
    }),
  )
  return [...fromIndex, ...fromActions]
}

export function createPaletteSearcher(docs: PaletteDoc[]): Searcher<PaletteDoc> {
  return createSearcher(docs)
}

export function paletteResults(
  query: string,
  docs: PaletteDoc[],
  searcher: Searcher<PaletteDoc>,
  secretLabel: string,
): PaletteItem[] {
  if (isCapsuleCommand(query)) {
    return [{ id: 'secret:capsule', group: 'secret', title: secretLabel, command: { type: 'capsule' } }]
  }
  if (query.trim() === '') {
    return docs.filter((doc) => doc.item.group === 'pages' || doc.item.group === 'actions').map((doc) => doc.item)
  }
  return searcher.search(query, { limit: MAX_RESULTS }).map((hit) => hit.doc.item)
}

export function groupItems(items: PaletteItem[]): Array<{ group: PaletteGroup; items: PaletteItem[] }> {
  if (items.length > 0 && items.every((item) => item.group !== 'secret')) {
    const ranked = items[0]
    const rest = items.slice(1)
    const groups = GROUP_ORDER.map((group) => ({ group, items: rest.filter((item) => item.group === group) }))
    const first = groups.find((entry) => entry.group === ranked.group)
    first?.items.unshift(ranked)
    const order = [ranked.group, ...GROUP_ORDER.filter((group) => group !== ranked.group)]
    return order
      .map((group) => groups.find((entry) => entry.group === group))
      .filter((entry): entry is { group: PaletteGroup; items: PaletteItem[] } => Boolean(entry && entry.items.length > 0))
  }
  return GROUP_ORDER.map((group) => ({ group, items: items.filter((item) => item.group === group) })).filter(
    (entry) => entry.items.length > 0,
  )
}
