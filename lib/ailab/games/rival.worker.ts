import { serveLabWorker, transfer } from '@/lib/ailab/core/worker-runtime'
import { resultBuffers, runGameJob, type GameJob, type GameJobProgress, type GameJobResult } from './train'

serveLabWorker<GameJob, GameJobResult, GameJobProgress>(async (job, { checkpoint, progress }) => {
  const result = await runGameJob(job, { checkpoint, progress })
  return transfer(result, resultBuffers(result))
})
