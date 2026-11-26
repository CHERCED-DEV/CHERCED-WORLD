import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

export const TRACKED_ROOTS = ['specs', 'tests'] as const

export type TrackedSource = 'git' | 'tree'

export type TrackedFiles = { source: TrackedSource; files: readonly string[] }

export type TrackedDeps = {
  gitLsFiles?: (root: string, roots: readonly string[]) => string[] | null
  walk?: (root: string, dir: string) => string[]
  exists?: (file: string) => boolean
}

const BLOCKED_SEGMENTS = new Set([
  'privado',
  'node_modules',
  '.git',
  '.next',
  '.worktrees',
  '.engineering',
  '.claude',
  '.local',
  '.vercel',
  'test-results',
  'playwright-report',
  'blob-report',
  '__pycache__',
])

const MAX_TEXT_BYTES = 2 * 1024 * 1024

export function toPosix(file: string): string {
  return file.replace(/\\/g, '/').replace(/^(\.\/)+/, '')
}

export function isReadablePath(file: string): boolean {
  const posix = toPosix(file)
  if (!posix || posix.startsWith('/') || /^[a-zA-Z]:/.test(posix)) return false
  const segments = posix.split('/')
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) return false
  if (segments.some((segment) => BLOCKED_SEGMENTS.has(segment.toLowerCase()))) return false
  const base = segments[segments.length - 1] ?? ''
  return !base.toLowerCase().startsWith('.env')
}

function gitLsFiles(root: string, roots: readonly string[]): string[] | null {
  try {
    const output = execFileSync('git', ['ls-files', '-z', '--', ...roots], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    })
    const files = output.split('\0').filter(Boolean)
    return files.length > 0 ? files : null
  } catch {
    return null
  }
}

function walk(root: string, dir: string): string[] {
  const full = path.join(root, dir)
  if (!existsSync(full)) return []
  return readdirSync(full).flatMap((name) => {
    const relative = `${dir}/${name}`
    if (!isReadablePath(relative)) return []
    return statSync(path.join(full, name)).isDirectory() ? walk(root, relative) : [relative]
  })
}

export function listTracked(root: string, roots: readonly string[] = TRACKED_ROOTS, deps: TrackedDeps = {}): TrackedFiles {
  const fromGit = (deps.gitLsFiles ?? gitLsFiles)(root, roots)
  const exists = deps.exists ?? ((file: string) => existsSync(path.join(root, file)))
  const candidates = fromGit ?? roots.flatMap((dir) => (deps.walk ?? walk)(root, dir))
  const files = candidates
    .map(toPosix)
    .filter((file) => roots.some((dir) => file.startsWith(`${dir}/`)))
    .filter(isReadablePath)
    .filter(exists)
  return { source: fromGit ? 'git' : 'tree', files: [...new Set(files)].sort() }
}

export function trackedReader(root: string, tracked: TrackedFiles): (file: string) => string | null {
  const allowed = new Set(tracked.files)
  const cache = new Map<string, string | null>()
  return (file: string) => {
    const posix = toPosix(file)
    if (!allowed.has(posix) || !isReadablePath(posix)) return null
    if (cache.has(posix)) return cache.get(posix) ?? null
    let text: string | null = null
    try {
      const full = path.join(root, posix)
      text = statSync(full).size <= MAX_TEXT_BYTES ? readFileSync(full, 'utf8') : null
    } catch {
      text = null
    }
    cache.set(posix, text)
    return text
  }
}
