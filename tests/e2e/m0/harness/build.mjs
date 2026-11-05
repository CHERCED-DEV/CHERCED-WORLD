import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..', '..', '..')
const outDir = resolve(process.argv[2] ?? join(root, 'test-results', 'm0-harness'))

mkdirSync(outDir, { recursive: true })

await build({
  configFile: false,
  root,
  logLevel: 'error',
  publicDir: false,
  resolve: {
    alias: [{ find: /^@\//, replacement: `${root.replace(/\\/g, '/')}/` }],
  },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  css: {
    preprocessorOptions: { scss: { loadPaths: [join(root, 'styles')] } },
  },
  oxc: { jsx: { runtime: 'automatic' } },
  build: {
    outDir,
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    cssCodeSplit: false,
    lib: {
      entry: join(here, 'entry.tsx'),
      formats: ['iife'],
      name: 'CwM0Harness',
      fileName: () => 'harness.js',
      cssFileName: 'harness',
    },
  },
})
