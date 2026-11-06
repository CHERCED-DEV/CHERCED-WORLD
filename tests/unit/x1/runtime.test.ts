import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'
import { labExperiment } from '@/content/ailab/catalog'
import { formatBytes } from '@/lib/ailab/core/format'
import { ONNX_RUNTIME } from '@/lib/ailab/voice/models'

const ROOT = process.cwd()
const ORT = join(ROOT, 'node_modules', 'onnxruntime-web')

function files(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

describe('el motor ONNX Runtime Web: qué es, cuánto pesa y desde dónde llega (FR-310)', () => {
  it('es el .wasm que referencia el bundle de onnxruntime-web/webgpu que importa transformers.js', () => {
    const transformers = readFileSync(join(ROOT, 'node_modules', '@huggingface', 'transformers', 'dist', 'transformers.web.js'), 'utf8')
    expect(transformers).toContain('from "onnxruntime-web/webgpu"')
    const pkg = JSON.parse(readFileSync(join(ORT, 'package.json'), 'utf8')) as { version: string; exports: Record<string, { import: { default: string } }> }
    expect(pkg.version).toBe(ONNX_RUNTIME.version)
    const bundle = readFileSync(join(ORT, pkg.exports['./webgpu']!.import.default), 'utf8')
    expect([...new Set(bundle.match(/ort-wasm-simd-threaded[.\w]*\.wasm/g))]).toEqual([ONNX_RUNTIME.file])
    expect(bundle).toContain('import.meta.url')
    expect(statSync(join(ORT, 'dist', ONNX_RUNTIME.file)).size).toBe(ONNX_RUNTIME.bytes)
  })

  it('lo sirve este sitio: el worker apaga el CDN que transformers.js trae por defecto', () => {
    const defaults = readFileSync(join(ROOT, 'node_modules', '@huggingface', 'transformers', 'src', 'backends', 'onnx.js'), 'utf8')
    expect(defaults).toMatch(/cdn\.jsdelivr\.net\/npm\/onnxruntime-web@/)
    const worker = readFileSync(join(ROOT, 'lib', 'ailab', 'voice', 'whisper.worker.ts'), 'utf8')
    expect(worker).toMatch(/wasmPaths = undefined/)
    expect(worker.indexOf('wasmPaths = undefined')).toBeLessThan(worker.indexOf('pipeline('))
  })

  it('no está en el repo: public/ y el código no traen .wasm ni .onnx', () => {
    const tracked = ['public', 'app', 'components', 'content', 'lib'].flatMap((dir) => files(join(ROOT, dir)))
    const heavy = tracked.filter((file) => /\.(wasm|onnx)$/i.test(file) || /ort-wasm/i.test(file)).map((file) => relative(ROOT, file))
    expect(heavy).toEqual([])
  })

  it('pesa 27 MB, y así lo dicen la tarjeta y el copy de V1 y V4 en los dos idiomas', () => {
    const size = { es: formatBytes(ONNX_RUNTIME.bytes, 'es'), en: formatBytes(ONNX_RUNTIME.bytes, 'en') }
    expect(size).toEqual({ es: '27 MB', en: '27 MB' })
    for (const id of ['V1', 'V4'] as const) {
      const experiment = labExperiment(id)
      for (const lang of ['es', 'en'] as const) {
        expect(experiment.privacy[lang], `${id} ${lang}`).toMatch(new RegExp(`ONNX Runtime Web( engine)? \\(${size[lang]}\\)`))
        expect(experiment.flow.map((step) => step[lang]).join(' '), `${id} ${lang}`).toContain('ONNX Runtime Web')
      }
    }
    expect(labExperiment('V1').adrCards[0]!.tradeoff.es).toContain(`(${size.es}) desde este sitio`)
    for (const dict of [es, en]) {
      expect(dict['ailab.v1.engine']).toContain('{size}')
      expect(dict['ailab.v1.engine']).toContain('{cdn}')
      for (const mark of ['{model}', '{size}', '{host}', '{runtime}']) expect(dict['ailab.v4.activate.body']).toContain(mark)
    }
    expect(es['ailab.v1.engine']).toMatch(/este mismo sitio/)
    expect(en['ailab.v1.engine']).toMatch(/this same site/)
  })
})
