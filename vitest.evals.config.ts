import { loadEnv } from 'vite'
import { defineConfig, mergeConfig } from 'vitest/config'
import base from './vitest.config'

const env = loadEnv('development', process.cwd(), ['GEMINI_', 'ANTHROPIC_', 'OPENAI_'])

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ['evals/**/*.eval.ts'],
      exclude: ['node_modules/**'],
      testTimeout: 15 * 60 * 1000,
      env: { ...env, GEMINI_API_KEY: env.GEMINI_API_KEY ?? '', ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY ?? '', OPENAI_API_KEY: env.OPENAI_API_KEY ?? '' },
    },
  }),
)
