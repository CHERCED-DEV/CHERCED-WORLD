import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, devices, type Project } from '@playwright/test'

const TIERS = ['fast', 'full', 'exhaustive'] as const

type Tier = (typeof TIERS)[number]

const ROOT = __dirname
const PORT = Number(process.env.E2E_PORT ?? 3100)
const baseURL = `http://localhost:${PORT}`
const IN_WORKER = process.env.TEST_WORKER_INDEX !== undefined

function resolveTier(): Tier {
  const explicit = process.env.E2E_TIER
  if (explicit) {
    if ((TIERS as readonly string[]).includes(explicit)) return explicit as Tier
    throw new Error(`E2E_TIER="${explicit}" no es un nivel: usa ${TIERS.join(', ')}`)
  }
  const script = /^test:(fast|full|exhaustive)$/.exec(process.env.npm_lifecycle_event ?? '')
  return (script?.[1] as Tier | undefined) ?? 'exhaustive'
}

const TIER = resolveTier()

const BUILD_INPUTS = [
  'app',
  'components',
  'content',
  'lib',
  'public',
  'styles',
  'next.config.ts',
  'proxy.ts',
  'mdx-components.tsx',
  'tsconfig.json',
  'package-lock.json',
  '.env',
  '.env.local',
  '.env.production',
  '.env.production.local',
]

function newestChange(entry: string): number {
  if (!existsSync(entry)) return 0
  const stats = statSync(entry)
  if (!stats.isDirectory()) return stats.mtimeMs
  let newest = stats.mtimeMs
  for (const child of readdirSync(entry)) newest = Math.max(newest, newestChange(path.join(entry, child)))
  return newest
}

function staleBuild(): string | null {
  if (process.env.E2E_REBUILD === '1') return 'E2E_REBUILD=1'
  const buildId = path.join(ROOT, '.next', 'BUILD_ID')
  if (!existsSync(buildId)) return 'no hay build en .next'
  const builtAt = statSync(buildId).mtimeMs
  const changed = BUILD_INPUTS.find((entry) => newestChange(path.join(ROOT, entry)) > builtAt)
  return changed ? `${changed} cambió después del último build` : null
}

function serverCommand(): string {
  const next = `node "${path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next')}"`
  const start = `${next} start --port ${PORT}`
  if (IN_WORKER) return start
  const stale = staleBuild()
  process.stderr.write(stale ? `[e2e] nivel ${TIER}: compila (${stale})\n` : `[e2e] nivel ${TIER}: reutiliza el build de .next (nada cambió desde entonces)\n`)
  return stale ? `${next} build && ${start}` : start
}

const CONTRAST_OUTSIDE_SUBSET = /contraste del texto sobre glass en tema (dark|light) \/es\/(portfolio|blog|blog\/post1|privacy|esta-ruta-no-existe)$/

const TIER_FILTERS: Record<Tier, Pick<Project, 'testMatch' | 'testIgnore' | 'grepInvert'>> = {
  fast: { testMatch: /[\\/]integration[\\/]smoke\.spec\.ts$/ },
  full: {
    testIgnore: [/[\\/]r2[\\/]responsive\.spec\.ts$/, /[\\/]r4[\\/]responsive-blog\.spec\.ts$/],
    grepInvert: [/@exhaustive/, CONTRAST_OUTSIDE_SUBSET],
  },
  exhaustive: {},
}

const PROJECTS: Project[] = [
  {
    name: 'desktop-chromium',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
  },
  {
    name: 'mobile-chromium',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: devices['Pixel 7'].userAgent,
    },
  },
  {
    name: 'no-js',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, javaScriptEnabled: false },
  },
]

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  metadata: { tier: TIER },
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: PROJECTS.filter((project) => TIER !== 'fast' || project.name === 'desktop-chromium').map((project) => ({
    ...project,
    ...TIER_FILTERS[TIER],
    metadata: { tier: TIER },
  })),
  webServer: {
    command: serverCommand(),
    url: `${baseURL}/robots.txt`,
    timeout: 900_000,
    reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
