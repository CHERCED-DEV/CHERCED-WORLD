import type { PublishedEvals } from '@/content/engineering/evals'
import type { EvalRun } from '@/lib/ai/evals/grade'
import { budgetRows, type BudgetRow } from './budgets'
import { commitsBySpec, daysBetween, firstFeat, weeklyCounts, type WeekCount } from './commits'
import { checkEvalResults, latestRun } from './evals'
import type { Commit, Deployment, History } from './history'
import { readSpecs, SPEC_STATUSES, type SpecInfo, type SpecStatus } from './specs'
import { countByKind, idIndex, traceRequirements, type RequirementTrace, type TestCounts } from './tests'
import type { TrackedFiles } from './tracked'
import type { VitestSummary } from './vitest-report'

export const WEEKS = 8

export const DEPLOY_DAYS = 30

export type DeployInfo = { sha: string | null; ref: string | null; environment: string | null; builtAt: string }

export type DashboardInput = {
  history: History | null
  tracked: TrackedFiles
  read: (file: string) => string | null
  vitest: VitestSummary | null
  deploy: DeployInfo
  evals: readonly PublishedEvals[]
}

export type SpecRow = SpecInfo & {
  commits: Commit[]
  created: string | null
  firstFeat: Commit | null
  days: number | null
  trace: RequirementTrace
}

export type EnvironmentDeploys = { environment: string; total: number; byState: Array<{ state: string; count: number }>; latest: Deployment | null }

export type EvalsRow = { entry: PublishedEvals; latest: EvalRun | null; runs: number; problem: string | null }

export type Dashboard = {
  builtAt: string
  deploy: DeployInfo
  vitest: VitestSummary | null
  history: { takenAt: string; head: string; commits: number } | null
  specs: SpecRow[]
  statusCounts: Record<SpecStatus, number>
  tests: { source: TrackedFiles['source']; byKind: TestCounts; requirements: number; tested: number }
  weekly: WeekCount[] | null
  deployments: { takenAt: string; days: number; environments: EnvironmentDeploys[] } | null
  budgets: BudgetRow[]
  evals: EvalsRow[]
}

export function deployInfo(env: Record<string, string | undefined>, builtAt: Date): DeployInfo {
  const sha = env.VERCEL_GIT_COMMIT_SHA?.trim().toLowerCase() ?? ''
  const environment = env.VERCEL_ENV?.trim().toLowerCase() ?? ''
  const valid = /^[0-9a-f]{7,40}$/.test(sha)
  return {
    sha: valid ? sha.slice(0, 7) : null,
    ref: valid ? sha : null,
    environment: /^[a-z][a-z0-9-]{0,31}$/.test(environment) ? environment : null,
    builtAt: builtAt.toISOString(),
  }
}

function environments(history: History): Dashboard['deployments'] {
  if (!history.deployments) return null
  const list = Object.entries(history.deployments.byEnvironment)
    .map(([environment, deploys]) => {
      const states = new Map<string, number>()
      for (const deploy of deploys) states.set(deploy.state, (states.get(deploy.state) ?? 0) + 1)
      const latest = [...deploys].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0] ?? null
      return {
        environment,
        total: deploys.length,
        byState: [...states.entries()].map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count || a.state.localeCompare(b.state)),
        latest,
      }
    })
    .sort((a, b) => b.total - a.total || a.environment.localeCompare(b.environment))
  return { takenAt: history.deployments.takenAt, days: DEPLOY_DAYS, environments: list }
}

export function buildDashboard(input: DashboardInput): Dashboard {
  const { history, tracked, read } = input
  const specs = readSpecs(tracked.files, read)
  const known = new Set(specs.map((spec) => spec.number))
  const bySpec = commitsBySpec(history?.commits ?? [], known)
  const index = idIndex(tracked.files, read)
  const rows: SpecRow[] = specs.map((spec) => {
    const commits = bySpec.get(spec.number) ?? []
    const created = history?.specCreated[spec.number] ?? null
    const feat = firstFeat(commits)
    return { ...spec, commits, created, firstFeat: feat, days: daysBetween(created, feat?.date ?? null), trace: traceRequirements(spec.requirements, index) }
  })
  const statusCounts = Object.fromEntries(SPEC_STATUSES.map((status) => [status, 0])) as Record<SpecStatus, number>
  for (const row of rows) statusCounts[row.status] += 1
  return {
    builtAt: input.deploy.builtAt,
    deploy: input.deploy,
    vitest: input.vitest,
    history: history ? { takenAt: history.takenAt, head: history.head, commits: history.commits.length } : null,
    specs: rows,
    statusCounts,
    tests: {
      source: tracked.source,
      byKind: countByKind(tracked.files),
      requirements: rows.reduce((sum, row) => sum + row.requirements.length, 0),
      tested: rows.reduce((sum, row) => sum + row.trace.tested.length, 0),
    },
    weekly: history && history.commits.length ? weeklyCounts(history.commits, history.takenAt, WEEKS) : null,
    deployments: history ? environments(history) : null,
    budgets: budgetRows(history?.measurements ?? []),
    evals: input.evals.map((entry) => {
      const check = checkEvalResults(entry.results)
      return check.ok
        ? { entry, latest: latestRun(check.results), runs: check.results.runs.length, problem: null }
        : { entry, latest: null, runs: 0, problem: check.reason }
    }),
  }
}
