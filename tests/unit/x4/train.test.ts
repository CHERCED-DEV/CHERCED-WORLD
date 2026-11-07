import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { serveLabWorker, type LabWorkerScope } from '@/lib/ailab/core/worker-runtime'
import { createDemoRecorder, demoFromRecorder, recordMove } from '@/lib/ailab/games/clone'
import { Match } from '@/lib/ailab/games/match'
import { NET_SIZES, createNet, netFromArrays, netToArrays, seededRandom } from '@/lib/ailab/games/net'
import { createRally } from '@/lib/ailab/games/physics'
import { resultBuffers, runGameJob, type GameJob, type GameJobProgress, type GameJobResult } from '@/lib/ailab/games/train'

function episodes() {
  const net = createNet(NET_SIZES, seededRandom(2))
  const match = new Match({ seed: 2, net, playerDriver: 'coach', learn: true })
  for (let tick = 0; tick < 60 * 20; tick += 1) match.tick()
  return { net, episodes: match.takeOutcomes().flatMap((outcome) => outcome.episodes) }
}

describe('el entrenamiento corre en un worker (FR-330)', () => {
  it('un trabajo de refuerzo devuelve pesos nuevos y llama checkpoint para poder pausar', async () => {
    const { net, episodes: list } = episodes()
    expect(list.length).toBeGreaterThan(0)
    let checkpoints = 0
    const result = await runGameJob(
      { kind: 'reinforce', weights: netToArrays(net), optimizer: null, episodes: list },
      { checkpoint: async () => void (checkpoints += 1) },
    )
    expect(checkpoints).toBeGreaterThanOrEqual(2)
    expect(result.samples).toBe(list.reduce((sum, episode) => sum + episode.actions.length, 0))
    expect(netFromArrays(result.weights)).not.toBeNull()
    expect(result.weights).not.toEqual(netToArrays(net))
    expect(resultBuffers(result).every((buffer) => buffer instanceof ArrayBuffer)).toBe(true)
  })

  it('rechaza pesos con otra forma y descarta episodios mal armados', async () => {
    const checkpoint = async () => {}
    await expect(runGameJob({ kind: 'reinforce', weights: [], optimizer: null, episodes: [] }, { checkpoint })).rejects.toThrow(TypeError)
    const net = createNet(NET_SIZES, seededRandom(2))
    const result = await runGameJob(
      {
        kind: 'reinforce',
        weights: netToArrays(net),
        optimizer: null,
        episodes: [{ inputs: new Float32Array(3), actions: Uint8Array.of(1), rewards: Float32Array.of(1) }],
      },
      { checkpoint },
    )
    expect(result.samples).toBe(0)
  })

  it('un trabajo de imitación avisa su avance por época y entrega el parecido', async () => {
    const recorder = createDemoRecorder()
    const state = createRally(1)
    state.phase = 'play'
    Object.assign(state.ball, { u: 0.5, v: 0.1, du: -0.6, dv: 0.2 })
    for (let n = 0; n < 60; n += 1) {
      state.paddles.player.v = 0.3 - (n % 20) * 0.01
      recordMove(recorder, state)
    }
    const progress: GameJobProgress[] = []
    const result = await runGameJob(
      { kind: 'imitate', seed: 4, demo: demoFromRecorder(recorder), options: { epochs: 5, lr: 0.02, batch: 16, holdout: 0.2, seed: 1 } },
      { checkpoint: async () => {}, progress: (value) => progress.push(value) },
    )
    expect(progress.map((value) => value.epoch)).toEqual([1, 2, 3, 4, 5])
    expect(result.similarity).toBe(progress.at(-1)?.similarity)
    expect(result.curve).toHaveLength(6)
    await expect(
      runGameJob({ kind: 'imitate', seed: 1, demo: { inputs: new Float32Array(4), actions: Uint8Array.of(1) } }, { checkpoint: async () => {} }),
    ).rejects.toThrow(TypeError)
  })

  it('conectado al runtime de X0, el worker responde con el resultado transferido', async () => {
    const toWorker = new EventTarget()
    const replies: Array<{ message: unknown; transfer?: Transferable[] }> = []
    let resolve: () => void = () => {}
    const done = new Promise<void>((settle) => (resolve = settle))
    const scope: LabWorkerScope = {
      postMessage: (message, transfer) => {
        replies.push({ message, transfer })
        resolve()
      },
      addEventListener: (type, listener) => toWorker.addEventListener(type, listener as EventListener),
      removeEventListener: (type, listener) => toWorker.removeEventListener(type, listener as EventListener),
    }
    const { net, episodes: list } = episodes()
    const stop = serveLabWorker<GameJob, GameJobResult, GameJobProgress>(async (job, { checkpoint }) => {
      const result = await runGameJob(job, { checkpoint })
      return result
    }, scope)
    toWorker.dispatchEvent(new MessageEvent('message', { data: { cw: 'call', id: 1, payload: { kind: 'reinforce', weights: netToArrays(net), optimizer: null, episodes: list } } }))
    await done
    stop()
    const reply = replies[0]!.message as { cw: string; id: number; payload: GameJobResult }
    expect(reply.cw).toBe('result')
    expect(reply.payload.weights).toHaveLength(6)
  })

  it('el worker usa el runtime de X0 y transfiere los buffers', () => {
    const source = readFileSync(join(process.cwd(), 'lib', 'ailab', 'games', 'rival.worker.ts'), 'utf8')
    expect(source).toContain("from '@/lib/ailab/core/worker-runtime'")
    expect(source).toContain('transfer(result, resultBuffers(result))')
  })
})
