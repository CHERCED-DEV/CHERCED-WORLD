export const SPEC_STATUSES = ['built', 'building', 'approved', 'draft', 'proposal', 'none', 'other'] as const

export type SpecStatus = (typeof SPEC_STATUSES)[number]

export type RequirementId = string

export type SpecFolder = { number: string; slug: string; dir: string; files: readonly string[]; main: string | null }

export type SpecInfo = {
  number: string
  slug: string
  dir: string
  main: string | null
  title: string
  status: SpecStatus
  statusText: string | null
  requirements: readonly RequirementId[]
}

const FOLDER = /^specs\/(\d{3})-([^/]+)\/(.+\.md)$/

const MAIN_FILES = ['spec.md', 'propuesta.md', 'notas.md']

const STATUS_LINE = /^\s*(?:[-*]\s+)?\**\s*(?:Estado|Status)\s*\**\s*:\s*\**\s*(.+?)\s*$/i

const TITLE_PREFIX = /^(?:Feature Specification:\s*|Propuesta\s+\d{3}\s*:\s*|Spec\s+\d{3}\s*[·:—-]\s*|\d{3}\s*[—·:-]\s*)/i

const ID = /(?<![\w-])((?:FR|SC)-(\d+)[a-z]?)(?![\w-])/g

const STATUS_TEXT_MAX = 220

function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function plainMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function statusLine(markdown: string | null): string | null {
  if (!markdown) return null
  for (const line of markdown.split(/\r?\n/).slice(0, 40)) {
    const match = STATUS_LINE.exec(line)
    if (match?.[1]) {
      const text = plainMarkdown(match[1])
      return text.length > STATUS_TEXT_MAX ? `${text.slice(0, STATUS_TEXT_MAX - 1)}…` : text
    }
  }
  return null
}

export function classifyStatus(line: string | null): SpecStatus {
  if (!line) return 'none'
  const text = fold(line)
  if (/\ben (construccion|curso)\b/.test(text)) return 'building'
  if (/\b(construid[oa]s?|implementad[oa]s?|built)\b/.test(text)) return 'built'
  if (/\b(borrador|draft)\b/.test(text)) return 'draft'
  if (/\baprobad[oa]s?\b|\bapproved\b/.test(text)) return 'approved'
  if (/\bpropuesta\b|\bproposal\b/.test(text)) return 'proposal'
  return 'other'
}

export function specFolders(files: readonly string[]): SpecFolder[] {
  const folders = new Map<string, { number: string; slug: string; files: string[] }>()
  for (const file of files) {
    const match = FOLDER.exec(file)
    if (!match) continue
    const [, number, slug, rest] = match
    const dir = `specs/${number}-${slug}`
    const entry = folders.get(dir) ?? { number: number!, slug: slug!, files: [] }
    entry.files.push(rest!)
    folders.set(dir, entry)
  }
  return [...folders.entries()]
    .map(([dir, entry]) => {
      const files = [...entry.files].sort()
      const top = files.filter((file) => !file.includes('/'))
      const main = MAIN_FILES.find((name) => top.includes(name)) ?? top[0] ?? null
      return { number: entry.number, slug: entry.slug, dir, files: files.map((file) => `${dir}/${file}`), main: main ? `${dir}/${main}` : null }
    })
    .sort((a, b) => a.number.localeCompare(b.number) || a.dir.localeCompare(b.dir))
}

export function ownsId(spec: string, id: string): boolean {
  const digits = /^(?:FR|SC)-(\d+)[a-z]?$/.exec(id)?.[1]
  if (!digits) return false
  const number = Number(spec)
  if (number === 1) return digits.length === 3 && (digits[0] === '0' || digits[0] === '1')
  if (number < 10) return digits.length === 3 && digits[0] === String(number)
  return digits.length === 4 && digits.startsWith(String(number))
}

export function idsIn(text: string): string[] {
  return [...new Set([...text.matchAll(ID)].map((match) => match[1]!))]
}

function idOrder(a: string, b: string): number {
  const kind = a.slice(0, 2).localeCompare(b.slice(0, 2))
  if (kind !== 0) return kind
  const na = Number(/\d+/.exec(a)?.[0] ?? 0)
  const nb = Number(/\d+/.exec(b)?.[0] ?? 0)
  return na - nb || a.localeCompare(b)
}

export function declaredIds(spec: string, texts: ReadonlyArray<string | null>): RequirementId[] {
  const ids = new Set<string>()
  for (const text of texts) if (text) for (const id of idsIn(text)) if (ownsId(spec, id)) ids.add(id)
  return [...ids].sort(idOrder)
}

export function specTitle(markdown: string | null, slug: string): string {
  const heading = markdown?.split(/\r?\n/).find((line) => /^#\s+\S/.test(line))
  const title = heading ? plainMarkdown(heading.replace(/^#\s+/, '').replace(TITLE_PREFIX, '')) : ''
  return title || slug.replace(/-/g, ' ')
}

export function readSpec(folder: SpecFolder, read: (file: string) => string | null): SpecInfo {
  const mainText = folder.main ? read(folder.main) : null
  const hasSpec = folder.main?.endsWith('/spec.md') ?? false
  const statusText = hasSpec ? statusLine(mainText) : null
  const status: SpecStatus = hasSpec ? classifyStatus(statusText) : folder.main?.endsWith('/propuesta.md') ? 'proposal' : 'none'
  const markdown = folder.files.filter((file) => file.endsWith('.md')).map(read)
  return {
    number: folder.number,
    slug: folder.slug,
    dir: folder.dir,
    main: folder.main,
    title: specTitle(mainText, folder.slug),
    status,
    statusText,
    requirements: declaredIds(folder.number, markdown),
  }
}

export function readSpecs(files: readonly string[], read: (file: string) => string | null): SpecInfo[] {
  return specFolders(files).map((folder) => readSpec(folder, read))
}
