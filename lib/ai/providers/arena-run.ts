import { readFileSync, writeFileSync } from 'node:fs'
import { JUDGE_RED_TEAM, JUDGE_RUBRIC, judgePrompt, judgeSchema, type JudgeRedTeamCase } from '@/content/ailab/arena/judge'
import { addArenaRun, arenaResultsSchema, type ArenaRedTeam, type ArenaResults, type ArenaRun } from '@/content/ailab/arena/results'
import { ARENA_TASKS, arenaTask, type ArenaTask } from '@/content/ailab/arena/tasks'
import { ARENA_JUDGE_ESTIMATE, ARENA_JUDGE_TASK, arenaModels, buildRun, compareCase, runnable, type ArenaGenerate } from './arena'
import { roundUsd } from './cost'
import { BudgetExhaustedError, BudgetUnavailableError, PAID_PROVIDERS, type PaidProviderId } from './types'

export type PregeneratedDeps = {
  generate: ArenaGenerate
  now: () => Date
  tasks?: readonly ArenaTask[]
  redTeam?: readonly JudgeRedTeamCase[]
  simulated?: boolean
}

export async function judgeRedTeam(item: JudgeRedTeamCase, judge: PaidProviderId, generate: ArenaGenerate): Promise<ArenaRedTeam | null> {
  const task = arenaTask(item.taskId)
  if (!task) return null
  try {
    const verdict = await generate({
      task: ARENA_JUDGE_TASK,
      line: 'arena',
      system: JUDGE_RUBRIC[item.lang],
      prompt: judgePrompt(item.lang, task, item.answer),
      schema: judgeSchema,
      prefer: judge,
      exclude: PAID_PROVIDERS.filter((other) => other !== judge),
      estimate: ARENA_JUDGE_ESTIMATE,
      simulate: () => ({ score: 0, reason: 'simulador' }),
    })
    return { caseId: item.id, judge: verdict.provider, model: verdict.model, score: verdict.data.score, pass: verdict.data.score <= item.maxScore, costUsd: roundUsd(verdict.costUsd) }
  } catch (error) {
    if (error instanceof BudgetExhaustedError || error instanceof BudgetUnavailableError) throw error
    return null
  }
}

export async function runPregenerated(deps: PregeneratedDeps): Promise<ArenaRun> {
  const models = arenaModels()
  const cases = []
  for (const task of deps.tasks ?? ARENA_TASKS) cases.push(await compareCase(runnable(task), { generate: deps.generate, models }))
  const redTeam: ArenaRedTeam[] = []
  for (const item of deps.redTeam ?? JUDGE_RED_TEAM) {
    for (const judge of PAID_PROVIDERS) {
      const verdict = await judgeRedTeam(item, judge, deps.generate)
      if (verdict) redTeam.push(verdict)
    }
  }
  return buildRun({ mode: 'pregenerada', simulated: deps.simulated ?? false, cases, redTeam, now: deps.now() })
}

export function readArenaResults(path: string): ArenaResults {
  return arenaResultsSchema.parse(JSON.parse(readFileSync(path, 'utf8')))
}

export function appendArenaRun(path: string, run: ArenaRun): ArenaResults {
  const next = arenaResultsSchema.parse(addArenaRun(readArenaResults(path), run))
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`)
  return next
}

export function runSummary(run: ArenaRun): string[] {
  const lines = [`Arena ${run.at}: ${run.cases.length} casos · ${run.totalUsd.toFixed(4)} USD · COP ${run.totalCop}`]
  for (const entry of run.cases) {
    const columns = entry.columns.map((column) => `${column.provider}:${column.status}${column.rules ? (column.rules.pass ? '✓' : '✗') : ''}${column.judge ? `/${column.judge.score}` : ''}`)
    lines.push(`  ${entry.taskId}: ${columns.join(' ')}`)
  }
  const failed = run.redTeam.filter((item) => !item.pass)
  lines.push(`  Juez contra inyección: ${run.redTeam.length - failed.length}/${run.redTeam.length} resistieron`)
  return lines
}
