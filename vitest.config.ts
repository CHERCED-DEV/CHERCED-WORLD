import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: /^server-only$/, replacement: fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url)) },
      { find: /^@\//, replacement: `${root.replace(/\\/g, '/').replace(/\/?$/, '/')}` },
    ],
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/contract/**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', '.worktrees/**', 'tests/e2e/**'],
    restoreMocks: true,
  },
})
