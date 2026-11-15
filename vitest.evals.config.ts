import { loadEnv } from 'vite'
import { defineConfig, mergeConfig } from 'vitest/config'
import base from './vitest.config'

const env = loadEnv('development', process.cwd(), 'GEMINI_')

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ['evals/**/*.eval.ts'],
      exclude: ['node_modules/**'],
      testTimeout: 15 * 60 * 1000,
      env: { GEMINI_API_KEY: env.GEMINI_API_KEY ?? '' },
    },
  }),
)
