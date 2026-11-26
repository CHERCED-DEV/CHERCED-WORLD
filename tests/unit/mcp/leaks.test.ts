import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})
import { callTool, ORIGIN, textOf } from './support/rpc'
import { portfolioSetup } from './support/setup'

const { portfolioMcp, portfolioServer } = await import('@/lib/mcp/servers/portafolio')
const { LEAK_BATTERY } = await import('@/content/mcp/leak-battery')
const { evalCase } = await import('@/content/ailab/evals/battery')
const { publicEmail } = await import('@/lib/search/build-index')
const { getSite } = await import('@/lib/content')
const { DATABASE_ENV } = await import('@/lib/security/keys')
const { GUEST_MODE_ENV } = await import('@/lib/ai/agent/guest')

const ROOT = process.cwd()

const LEAKS = [...(evalCase('red-system-es')?.expect.none ?? []), ...(evalCase('red-key-es')?.expect.none ?? [])].filter((item): item is RegExp => item instanceof RegExp)

const README_ENV = [...readFileSync(join(ROOT, 'README.md'), 'utf8').matchAll(/^\| `([A-Z][A-Z0-9_]+)` \|/gm)].map((match) => match[1]!)

const ENV_NAMES = [...new Set([...README_ENV, DATABASE_ENV, GUEST_MODE_ENV])]

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi

const HASH = /\b[a-f0-9]{64}\b/i

const PRIVATE_DIR = join(ROOT, 'content', 'mini-cherced', 'privado')

function privateLines(): string[] {
  if (!existsSync(PRIVATE_DIR)) return []
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry)
      return statSync(path).isDirectory() ? walk(path) : [path]
    })
  return walk(PRIVATE_DIR)
    .flatMap((file) => readFileSync(file, 'utf8').split(/\r?\n/))
    .map((line) => line.trim())
    .filter((line) => line.length >= 40)
}

beforeEach(portfolioSetup)

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('batería de filtración del MCP (FR-4412, SC-4402, SC-4403)', () => {
  it('tiene unas 20 llamadas y cubre las herramientas que reciben texto libre', () => {
    expect(LEAK_BATTERY.length).toBeGreaterThanOrEqual(20)
    expect(new Set(LEAK_BATTERY.map((item) => item.id)).size).toBe(LEAK_BATTERY.length)
    const names = new Set(portfolioServer.tools.map((tool) => tool.name))
    for (const item of LEAK_BATTERY) expect(names.has(item.tool), item.tool).toBe(true)
    for (const tool of ['search_portfolio', 'search', 'fetch', 'get_case_study', 'get_decisions', 'list_posts', 'match_job_description']) {
      expect(LEAK_BATTERY.some((item) => item.tool === tool), tool).toBe(true)
    }
    expect(LEAKS.length).toBeGreaterThanOrEqual(6)
    expect(ENV_NAMES).toEqual(expect.arrayContaining(['MONGODB_INTEGRAL_DB', 'GEMINI_API_KEY', 'GUEST_MODE']))
  })

  it('ninguna respuesta trae lo privado: prompt de Mini Cherced, llaves, variables, correos ajenos, hashes ni privado/', async () => {
    const author = publicEmail(getSite())
    const secrets = privateLines()
    for (const item of LEAK_BATTERY) {
      const result = await callTool(portfolioMcp, item.tool, item.args)
      const raw = JSON.stringify(result)
      const text = `${textOf(result)}\n${raw}`
      for (const pattern of LEAKS) expect(pattern.test(text), `${item.id}: ${pattern}`).toBe(false)
      for (const name of ENV_NAMES) expect(new RegExp(`\\b${name}\\b`).test(text), `${item.id}: ${name}`).toBe(false)
      for (const email of text.match(EMAIL) ?? []) expect(email.toLowerCase(), item.id).toBe(author?.toLowerCase())
      expect(HASH.test(text), item.id).toBe(false)
      expect(text, item.id).not.toMatch(/mini-cherced|privado\//i)
      for (const line of secrets) expect(text.includes(line), item.id).toBe(false)
      if (!result.isError) {
        const urls = [...text.matchAll(/https?:\/\/[^\s"')\]]+/g)].map((match) => match[0])
        expect(urls.some((url) => url.startsWith(`${ORIGIN}/`)), `${item.id} sin fuente del sitio`).toBe(true)
      }
    }
  })
})