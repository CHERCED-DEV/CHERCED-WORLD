import type { CapabilityName } from '@/lib/capabilities/types'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { createSearcher, type Searcher } from '@/lib/search/searcher'
import { fold } from '@/lib/search/text'
import type { PageId, SearchDoc } from '@/lib/search/types'

export type PaletteGroup = 'secret' | 'pages' | 'projects' | 'skills' | 'posts' | 'actions' | 'commands'

export type PaletteCommand =
  | { type: 'navigate'; href: string }
  | { type: 'theme'; to: 'dark' | 'light' }
  | { type: 'lang' }
  | { type: 'assistant' }
  | { type: 'copy-email' }
  | { type: 'capsule' }
  | { type: 'open'; href: string }
  | { type: 'download'; href: string; filename: string }
  | { type: 'shortcuts' }
  | { type: 'extension'; id: string }

export type PaletteItem = {
  id: string
  group: PaletteGroup
  title: string
  hint?: string
  shortcut?: string
  capability?: CapabilityName
  commandOnly?: boolean
  command: PaletteCommand
}

export type PaletteDoc = SearchDoc & { item: PaletteItem }

export const GROUP_ORDER: PaletteGroup[] = ['secret', 'pages', 'projects', 'skills', 'posts', 'actions', 'commands']

export const MAX_RESULTS = 12

export const COMMAND_PREFIX = '>'

const SKILL_WEIGHT = 0.6

const SECRET_COMMANDS = ['2023', 'enecimo intento', 'enesimo intento', 'nth attempt']

export function isCapsuleCommand(query: string): boolean {
  const normalized = fold(query).replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim()
  return SECRET_COMMANDS.some((command) => normalized === command || (command.length > 4 && normalized.startsWith(command)))
}

export function commandQuery(query: string): string | null {
  const trimmed = query.trimStart()
  return trimmed.startsWith(COMMAND_PREFIX) ? trimmed.slice(COMMAND_PREFIX.length).trim() : null
}

export type ActionContext = {
  theme: 'dark' | 'light'
  email: string | null
  capsuleFound: boolean
}

export type CvPdfCommand = { href: string; filename: string }

export type CommandContext = ActionContext & {
  cv: string | null
  cvPdf?: CvPdfCommand | null
  now: string | null
  aiLab?: string | null
  extensions?: PaletteExtension[]
}

export type PaletteExtension = {
  id: string
  labelKey: string
  keywords: string
  run: () => void
}

const extensions = new Map<string, PaletteExtension>()

export function registerPaletteCommand(extension: PaletteExtension): () => void {
  extensions.set(extension.id, extension)
  return () => {
    if (extensions.get(extension.id) === extension) extensions.delete(extension.id)
  }
}

export function paletteExtensions(): PaletteExtension[] {
  return [...extensions.values()]
}

export function findPaletteExtension(id: string): PaletteExtension | null {
  return extensions.get(id) ?? null
}

const ACTION_KEYWORDS: Record<string, string> = {
  theme: 'tema theme oscuro claro dark light modo mode',
  lang: 'idioma language english espanol ingles spanish',
  assistant: 'asistente assistant pregunta ask chat ia ai',
  'copy-email': 'correo email mail copiar copy contacto contact',
  capsule: 'capsula capsule 2023 tiempo time historia history',
  'action:cv': 'cv hoja vida resume curriculum linkedin',
  'action:cv-pdf': 'cv pdf descargar download bajar hoja vida resume curriculum',
  'action:shortcuts': 'atajos shortcuts teclado keyboard teclas keys',
  'action:now': 'ahora now hoy today',
  'action:ai-lab': 'ai lab laboratorio laboratory ia experimentos experiments demos',
}

export const CAPABILITY_COMMANDS: Readonly<Record<string, CapabilityName>> = {
  'action:cv': 'get_cv',
  'action:theme': 'set_preferences',
  'action:lang': 'set_preferences',
}

export function buildActions(labels: Dictionary, context: ActionContext): PaletteItem[] {
  const next = context.theme === 'dark' ? 'light' : 'dark'
  const actions: PaletteItem[] = [
    {
      id: 'action:theme',
      group: 'actions',
      title: t(labels, next === 'light' ? 'palette.action.themeLight' : 'palette.action.themeDark'),
      shortcut: 't',
      capability: CAPABILITY_COMMANDS['action:theme'],
      command: { type: 'theme', to: next },
    },
    {
      id: 'action:lang',
      group: 'actions',
      title: t(labels, 'palette.action.lang'),
      capability: CAPABILITY_COMMANDS['action:lang'],
      command: { type: 'lang' },
    },
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

export function buildCommands(labels: Dictionary, context: CommandContext): PaletteItem[] {
  const actions = buildActions(labels, context)
  const byId = (id: string) => actions.find((action) => action.id === id)
  const commands: PaletteItem[] = []
  if (context.cvPdf) {
    commands.push({
      id: 'action:cv-pdf',
      group: 'actions',
      title: t(labels, 'palette.action.cvPdf'),
      command: { type: 'download', href: context.cvPdf.href, filename: context.cvPdf.filename },
    })
  }
  if (context.cv) {
    commands.push({
      id: 'action:cv',
      group: 'actions',
      title: t(labels, 'palette.action.cv'),
      capability: CAPABILITY_COMMANDS['action:cv'],
      command: { type: 'open', href: context.cv },
    })
  }
  for (const id of ['action:copy-email', 'action:theme', 'action:lang', 'action:assistant']) {
    const action = byId(id)
    if (action) commands.push(action)
  }
  commands.push({
    id: 'action:shortcuts',
    group: 'actions',
    title: t(labels, 'palette.action.shortcuts'),
    shortcut: '?',
    command: { type: 'shortcuts' },
  })
  if (context.now) {
    commands.push({
      id: 'action:now',
      group: 'actions',
      title: t(labels, 'nav.now'),
      hint: context.now,
      commandOnly: true,
      command: { type: 'navigate', href: context.now },
    })
  }
  if (context.aiLab) {
    commands.push({
      id: 'action:ai-lab',
      group: 'pages',
      title: t(labels, 'palette.action.aiLab'),
      command: { type: 'navigate', href: context.aiLab },
    })
  }
  const capsule = byId('action:capsule')
  if (capsule) commands.push(capsule)
  for (const extension of context.extensions ?? []) {
    if (!Object.prototype.hasOwnProperty.call(labels, extension.labelKey)) continue
    commands.push({
      id: `extension:${extension.id}`,
      group: 'actions',
      title: t(labels, extension.labelKey),
      command: { type: 'extension', id: extension.id },
    })
  }
  return commands
}

function groupOf(doc: SearchDoc): PaletteGroup | null {
  if (doc.kind === 'page') return 'pages'
  if (doc.kind === 'project') return 'projects'
  if (doc.kind === 'post') return 'posts'
  if (doc.kind === 'skill') return 'skills'
  return null
}

function actionKeywords(action: PaletteItem, extensionKeywords: Map<string, string>): string {
  if (action.command.type === 'extension') return extensionKeywords.get(action.command.id) ?? ''
  return ACTION_KEYWORDS[action.id] ?? ACTION_KEYWORDS[action.command.type] ?? ''
}

export function toPaletteDocs(docs: SearchDoc[], actions: PaletteItem[], extensionList: PaletteExtension[] = []): PaletteDoc[] {
  const extensionKeywords = new Map(extensionList.map((extension) => [extension.id, extension.keywords]))
  const fromIndex = docs.flatMap((doc): PaletteDoc[] => {
    const group = groupOf(doc)
    if (!group) return []
    const hint = group === 'skills' ? doc.text : undefined
    return [{ ...doc, item: { id: doc.id, group, title: doc.title, hint, command: { type: 'navigate', href: doc.url } } }]
  })
  const fromActions = actions.map(
    (action): PaletteDoc => ({
      id: action.id,
      kind: 'section',
      title: action.title,
      text: action.hint ?? '',
      keywords: actionKeywords(action, extensionKeywords),
      url: '',
      item: action,
    }),
  )
  return [...fromIndex, ...fromActions]
}

export function createPaletteSearcher(docs: PaletteDoc[]): Searcher<PaletteDoc> {
  return createSearcher(docs, { weight: (doc) => (doc.item.group === 'skills' ? SKILL_WEIGHT : 1) })
}

function asCommand(item: PaletteItem): PaletteItem {
  return { ...item, group: 'commands' }
}

export function paletteResults(
  query: string,
  docs: PaletteDoc[],
  searcher: Searcher<PaletteDoc>,
  secretLabel: string,
): PaletteItem[] {
  const commands = commandQuery(query)
  if (commands !== null) {
    if (commands === '') return docs.filter((doc) => doc.item.group === 'actions').map((doc) => asCommand(doc.item))
    return searcher
      .search(commands, { limit: MAX_RESULTS, filter: (doc) => doc.item.group === 'actions' })
      .map((hit) => asCommand(hit.doc.item))
  }
  if (isCapsuleCommand(query)) {
    return [{ id: 'secret:capsule', group: 'secret', title: secretLabel, command: { type: 'capsule' } }]
  }
  if (query.trim() === '') {
    return docs
      .filter((doc) => (doc.item.group === 'pages' || doc.item.group === 'actions') && !doc.item.commandOnly)
      .map((doc) => doc.item)
  }
  return searcher.search(query, { limit: MAX_RESULTS, filter: (doc) => !doc.item.commandOnly }).map((hit) => hit.doc.item)
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

export type PaletteCommandId =
  | `page:${PageId}`
  | 'action:theme'
  | 'action:lang'
  | 'action:assistant'
  | 'action:copy-email'
  | 'action:cv'
  | 'action:cv-pdf'
  | 'action:shortcuts'
  | 'action:now'
  | 'action:ai-lab'
  | 'action:capsule'
  | `extension:${string}`

export type PaletteEffects = {
  close: () => void
  navigate: (href: string) => void
  setTheme: (to: 'dark' | 'light') => void
  switchLang: () => void
  open: (href: string) => void
  download: (href: string, filename: string) => void
  shortcuts: () => void
  assistant: () => void
  copyEmail: () => void
  capsule: () => void
}

export function executePaletteCommand(command: PaletteCommand, effects: PaletteEffects): void {
  switch (command.type) {
    case 'navigate':
      effects.close()
      effects.navigate(command.href)
      return
    case 'theme':
      effects.setTheme(command.to)
      effects.close()
      return
    case 'lang':
      effects.close()
      effects.switchLang()
      return
    case 'open':
      effects.close()
      effects.open(command.href)
      return
    case 'download':
      effects.close()
      effects.download(command.href, command.filename)
      return
    case 'shortcuts':
      effects.shortcuts()
      return
    case 'extension':
      effects.close()
      findPaletteExtension(command.id)?.run()
      return
    case 'assistant':
      effects.assistant()
      return
    case 'copy-email':
      effects.close()
      effects.copyEmail()
      return
    case 'capsule':
      effects.capsule()
      return
  }
}

export type PaletteRunner = {
  items: () => PaletteItem[]
  run: (item: PaletteItem) => void
}

let runner: PaletteRunner | null = null

export function registerPaletteRunner(next: PaletteRunner): () => void {
  runner = next
  return () => {
    if (runner === next) runner = null
  }
}

export function findPaletteCommand(id: PaletteCommandId | string): PaletteItem | null {
  return runner?.items().find((item) => item.id === id) ?? null
}

export function runPaletteCommand(id: PaletteCommandId | string): boolean {
  const current = runner
  const item = findPaletteCommand(id)
  if (!current || !item) return false
  current.run(item)
  return true
}
