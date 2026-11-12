import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const TRANSFORMERS = '@huggingface/transformers'

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.(ts|tsx|mjs|js)$/.test(name) ? [path] : []
  })
}

describe('@huggingface/transformers (A-708, P-3k, FR-371)', () => {
  it('va con versión exacta', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { dependencies: Record<string, string> }
    expect(pkg.dependencies[TRANSFORMERS]).toMatch(/^\d+\.\d+\.\d+$/)
    const lock = JSON.parse(readFileSync(join(ROOT, 'package-lock.json'), 'utf8')) as { packages: Record<string, { version?: string }> }
    expect(lock.packages[`node_modules/${TRANSFORMERS}`]?.version).toBe(pkg.dependencies[TRANSFORMERS])
  })

  it('solo se importa dentro de un worker (*.worker.ts) o en el build (server-only, R-703), nunca en el bundle de la página', () => {
    const importers = ['app', 'components', 'lib', 'content']
      .flatMap((dir) => sources(join(ROOT, dir)))
      .filter((file) => readFileSync(file, 'utf8').includes(`'${TRANSFORMERS}'`) || readFileSync(file, 'utf8').includes(`"${TRANSFORMERS}"`))
    const outsideWorkers = importers.filter((file) => !/\.worker\.ts$/.test(file))
    for (const file of outsideWorkers) {
      expect(readFileSync(file, 'utf8'), relative(ROOT, file)).toMatch(/^import 'server-only'$/m)
    }
    expect(outsideWorkers.map((file) => relative(ROOT, file).replace(/\\/g, '/'))).toEqual(['lib/ailab/search/meaning-build.ts'])
  })

  it('no descarga binarios de CUDA en el build: onnxruntime-node queda en skip', () => {
    expect(readFileSync(join(ROOT, '.npmrc'), 'utf8')).toMatch(/^onnxruntime-node-install=skip$/m)
  })
})
