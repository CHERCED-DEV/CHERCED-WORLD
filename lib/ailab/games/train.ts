import { IMITATE_DEFAULTS, imitate, type Demonstration, type ImitateOptions } from './clone'
import { NET_SIZES, adamFromArrays, adamToArrays, createAdam, createNet, netFromArrays, netToArrays, seededRandom } from './net'
import { SENSES } from './policy'
import { REINFORCE_DEFAULTS, reinforce, type Episode, type ReinforceOptions } from './rival'

export type ReinforceJob = {
  kind: 'reinforce'
  weights: Float32Array[]
  optimizer: Float32Array[] | null
  episodes: Episode[]
  options?: ReinforceOptions
}

export type ImitateJob = {
  kind: 'imitate'
  seed: number
  demo: Demonstration
  options?: ImitateOptions
}

export type GameJob = ReinforceJob | ImitateJob

export type GameJobResult = {
  weights: Float32Array[]
  optimizer: Float32Array[]
  samples: number
  ms: number
  similarity: number | null
  curve: number[]
}

export type GameJobProgress = { epoch: number; similarity: number }

export type GameJobContext = {
  checkpoint: () => Promise<void>
  progress?: (value: GameJobProgress) => void
  now?: () => number
}

function validEpisode(episode: Episode): boolean {
  const steps = episode.actions.length
  return episode.inputs.length === steps * SENSES && episode.rewards.length === steps
}

export async function runGameJob(job: GameJob, context: GameJobContext): Promise<GameJobResult> {
  const now = context.now ?? (() => performance.now())
  const started = now()
  await context.checkpoint()
  if (job.kind === 'reinforce') {
    const net = netFromArrays(job.weights, NET_SIZES)
    if (!net) throw new TypeError('Los pesos del rival no tienen la forma de la red')
    const adam = (job.optimizer && adamFromArrays(job.optimizer, net)) || createAdam(net)
    const episodes = job.episodes.filter(validEpisode)
    const stats = reinforce(net, adam, episodes, job.options ?? REINFORCE_DEFAULTS)
    await context.checkpoint()
    return { weights: netToArrays(net), optimizer: adamToArrays(adam), samples: stats.samples, ms: now() - started, similarity: null, curve: [] }
  }
  const { demo } = job
  if (demo.inputs.length !== demo.actions.length * SENSES) throw new TypeError('La grabación no tiene la forma esperada')
  const net = createNet(NET_SIZES, seededRandom(job.seed))
  const adam = createAdam(net)
  const result = await imitate(net, adam, demo, job.options ?? IMITATE_DEFAULTS, {
    checkpoint: context.checkpoint,
    onEpoch: (epoch, similarity) => context.progress?.({ epoch, similarity }),
  })
  return {
    weights: netToArrays(net),
    optimizer: adamToArrays(adam),
    samples: result.samples,
    ms: now() - started,
    similarity: result.similarity,
    curve: result.curve,
  }
}

export function resultBuffers(result: GameJobResult): ArrayBuffer[] {
  return [...result.weights, ...result.optimizer].map((array) => array.buffer as ArrayBuffer)
}
