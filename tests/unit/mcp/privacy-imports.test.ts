import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()

const LIMIT = 'lib/mcp/core/limit.ts'

const FORBIDDEN = ['lib/data/', 'lib/auth/', 'lib/accounts/', 'lib/ai/agent/', 'content/mini-cherced/', 'lib/security/keys.ts']

const IMPORT = /(?:^|\n)\s*(?:import|export)\s+(type\s+)?(?:([\s\S]*?)\s+from\s+)?['"]([^'"]+)['"]/g

function files(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((entry) => {
    const path = `${dir}/${entry}`
    return statSync(join(ROOT, path)).isDirectory() ? files(path) : /\.tsx?$/.test(entry) ? [path] : []
  })
}

function typeOnly(clause: string | undefined): boolean {
  if (!clause) return false
  const named = /^\{([\s\S]*)\}$/.exec(clause.trim())
  if (!named?.[1]) return false
  const parts = named[1].split(',').map((part) => part.trim()).filter(Boolean)
  return parts.length > 0 && parts.every((part) => part.startsWith('type '))
}

function resolve(from: string, specifier: string): string | null {
  let base: string
  if (specifier.startsWith('@/')) base = specifier.slice(2)
  else if (specifier.startsWith('.')) base = relative(ROOT, join(ROOT, dirname(from), specifier)).replace(/\\/g, '/')
  else return null
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
    if (/\.(tsx?)$/.test(candidate) && existsSync(join(ROOT, candidate))) return candidate
  }
  return null
}

function runtimeImports(file: string): { specifier: string; target: string | null }[] {
  const source = readFileSync(join(ROOT, file), 'utf8')
  return [...source.matchAll(IMPORT)]
    .filter((match) => !match[1] && !typeOnly(match[2]))
    .map((match) => ({ specifier: match[3]!, target: resolve(file, match[3]!) }))
}

function reaches(start: string): Map<string, string[]> {
  const seen = new Map<string, string[]>([[start, [start]]])
  const queue = [start]
  while (queue.length > 0) {
    const file = queue.shift()!
    if (file === LIMIT) continue
    for (const { target } of runtimeImports(file)) {
      if (!target || seen.has(target)) continue
      seen.set(target, [...seen.get(file)!, target])
      queue.push(target)
    }
  }
  return seen
}

describe('guarda de privacidad por imports (FR-4406)', () => {
  it('ningún archivo de lib/mcp/servers importa la capa de datos, cuentas ni el agente', () => {
    for (const file of files('lib/mcp/servers')) {
      for (const { specifier } of runtimeImports(file)) {
        expect(specifier, file).not.toMatch(/^@\/lib\/(data|auth|accounts)(\/|$)|^@\/lib\/ai\/agent\/|mini-cherced/)
      }
    }
  })

  it('dentro de lib/mcp, solo lib/mcp/core/limit.ts toca @/lib/data', () => {
    const touching = files('lib/mcp').filter((file) => runtimeImports(file).some(({ specifier }) => /^@\/lib\/data(\/|$)/.test(specifier)))
    expect(touching).toEqual([LIMIT])
  })

  it('desde el servidor del portafolio y la ruta no se llega a nada privado sin pasar por el límite', () => {
    const starts = ['lib/mcp/servers', 'app/api/mcp', 'app/[lang]/mcp', 'components/mcp', 'content/mcp'].filter((dir) => existsSync(join(ROOT, dir))).flatMap(files)
    for (const start of starts) {
      for (const [file, path] of reaches(start)) {
        for (const prefix of FORBIDDEN) expect(file.startsWith(prefix) ? path.join(' → ') : null, start).toBeNull()
      }
    }
  })
})