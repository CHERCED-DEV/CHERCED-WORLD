import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { HISTORY_PATH, parseHistory } from '@/lib/engineering/history'

const ROOT = process.cwd()
const SCRIPT = join(ROOT, 'scripts', 'engineering-metrics.mjs')
const NAMES_LIST = join(ROOT, 'specs', '041-pruebame-en-vivo', 'privado', 'nombres-prohibidos.txt')
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/
const text = readFileSync(join(ROOT, HISTORY_PATH), 'utf8')
const history = parseHistory(JSON.parse(text))

function hasGit(): boolean {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

describe('historial versionado (FR-4506, SC-4504)', () => {
  it('cumple el esquema: solo sha corto, fecha y asunto por commit', () => {
    expect(history).not.toBeNull()
    expect(history!.commits.length).toBeGreaterThan(0)
    for (const commit of history!.commits) expect(Object.keys(commit).sort()).toEqual(['date', 'sha', 'subject'])
    expect(Object.keys(history!.specCreated)).toContain('030')
  })

  it('no trae correos, URLs de vista previa ni rutas de privado/', () => {
    expect(text).not.toMatch(EMAIL)
    expect(text).not.toMatch(/vercel\.app/i)
    expect(text).not.toMatch(/privado\//i)
    expect(text).not.toMatch(/"(author|email|name|committer)"/i)
  })

  it.skipIf(!existsSync(NAMES_LIST))('no trae ningún nombre de la lista privada (solo corre en local, donde está la lista)', () => {
    const folded = text.toLowerCase()
    const found = readFileSync(NAMES_LIST, 'utf8')
      .split(/\r?\n/)
      .map((name) => name.trim().toLowerCase())
      .filter((name) => name.length >= 3 && folded.includes(name))
    expect(found).toHaveLength(0)
  })
})

describe.skipIf(!hasGit())('recolector local sobre un repo de prueba (FR-4506, FR-4507, SC-4504)', () => {
  let dir = ''
  let repo = ''
  let out = ''
  let env = process.env

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'cw-engineering-'))
    repo = join(dir, 'repo')
    out = join(dir, 'history.json')
    const config = join(dir, 'gitconfig')
    writeFileSync(config, '')
    env = { ...process.env, GIT_CONFIG_GLOBAL: config, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' }
  })

  function git(args: string[], date?: string): void {
    execFileSync('git', ['-c', 'user.name=Tercera Persona', '-c', 'user.email=tercera@example.com', ...args], {
      cwd: repo,
      env: date ? { ...env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : env,
      stdio: 'ignore',
    })
  }

  function write(file: string, content: string): void {
    mkdirSync(join(repo, file, '..'), { recursive: true })
    writeFileSync(join(repo, file), content)
  }

  function collect(extra: string[] = []): string {
    execFileSync(process.execPath, [SCRIPT, '--repo', repo, '--salida', out, '--sin-gh', ...extra], { cwd: dir, env, stdio: 'pipe' })
    return readFileSync(out, 'utf8')
  }

  afterAll(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
  })

  it('guarda solo sha, fecha y asunto, limpia correos, enlaces y rutas privadas, y fecha la spec por su primer commit', { timeout: 60_000 }, () => {
    mkdirSync(repo, { recursive: true })
    git(['init', '-q'])
    write('specs/099-demo/spec.md', '# 099 — Demo\n\nEstado: borrador\n')
    git(['add', '.'])
    git(['commit', '-q', '-m', 'docs(099): spec de la demo'], '2026-11-20T10:00:00-05:00')
    write('specs/099-demo/plan.md', '# Plan\n')
    write('specs/099-demo/privado/notas.md', 'nota privada\n')
    git(['add', '.'])
    git(['commit', '-q', '-m', 'feat(099): primera pieza, avisar a tercera@example.com'], '2026-11-21T10:00:00-05:00')
    write('src.txt', 'x\n')
    git(['add', '.'])
    git(['commit', '-q', '-m', 'fix(099): vista previa en https://cherced-world-git-demo.vercel.app/es y ver specs/099-demo/privado/notas.md'], '2026-11-22T10:00:00-05:00')

    const output = collect()
    const parsed = parseHistory(JSON.parse(output))
    expect(parsed).not.toBeNull()
    expect(parsed!.commits.map((item) => item.subject)).toEqual([
      'fix(099): vista previa en [enlace] y ver [ruta privada]',
      'feat(099): primera pieza, avisar a [correo]',
      'docs(099): spec de la demo',
    ])
    expect(parsed!.specCreated).toEqual({ '099': '2026-11-20T10:00:00-05:00' })
    expect(parsed!.deployments).toBeNull()
    expect(output).not.toMatch(EMAIL)
    expect(output).not.toContain('Tercera Persona')
    expect(output).not.toMatch(/vercel\.app|privado\//i)
  })

  it('conserva las mediciones que ya estaban y suma solo las válidas', { timeout: 60_000 }, () => {
    const extra = join(dir, 'mediciones.json')
    writeFileSync(
      extra,
      JSON.stringify([
        { budget: 'lcp', page: '/es/ingenieria', value: 1830, date: '2026-11-26T10:00:00-05:00', source: 'tests/e2e/integration/performance.spec.ts' },
        { budget: 'velocidad', page: '/es', value: 1, source: 'inventada' },
      ]),
    )
    collect(['--mediciones', extra])
    const parsed = parseHistory(JSON.parse(collect()))
    expect(parsed!.measurements).toEqual([
      { budget: 'lcp', page: '/es/ingenieria', value: 1830, date: '2026-11-26T10:00:00-05:00', source: 'tests/e2e/integration/performance.spec.ts' },
    ])
  })
})
