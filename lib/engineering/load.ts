import 'server-only'
import { publishedEvals } from '@/content/engineering/evals'
import history from '@/content/engineering/history.json'
import { buildDashboard, deployInfo, type Dashboard } from './dashboard'
import { parseHistory } from './history'
import { listTracked, trackedReader } from './tracked'
import { readVitestReport } from './vitest-report'

let built: Dashboard | null = null

export function loadDashboard(): Dashboard {
  if (built) return built
  const root = process.cwd()
  const tracked = listTracked(root)
  built = buildDashboard({
    history: parseHistory(history),
    tracked,
    read: trackedReader(root, tracked),
    vitest: readVitestReport(root),
    deploy: deployInfo(process.env, new Date()),
    evals: publishedEvals,
  })
  return built
}
