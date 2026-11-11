import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import path from 'node:path'

export type IsolatedServer = {
  baseURL: string
  output: () => string
  waitForOutput: (pattern: RegExp, timeoutMs?: number) => Promise<RegExpMatchArray>
  stop: () => Promise<void>
}

const ROOT = path.resolve(__dirname, '..', '..', '..', '..')

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()
      probe.close(() => (typeof address === 'object' && address ? resolve(address.port) : reject(new Error('sin puerto'))))
    })
  })
}

async function waitUntilUp(baseURL: string, child: ChildProcess, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`el servidor aislado terminó con código ${child.exitCode}`)
    try {
      const response = await fetch(`${baseURL}/robots.txt`)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('el servidor aislado no respondió a tiempo')
}

export async function startIsolatedServer(options: { cwd?: string } = {}): Promise<IsolatedServer> {
  const port = await freePort()
  const baseURL = `http://localhost:${port}`
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: 'production' }
  delete env.MONGODB_INTEGRAL_DB
  delete env.VERCEL
  const nextBin = require.resolve('next/dist/bin/next', { paths: [ROOT] })
  const child = spawn(process.execPath, [nextBin, 'start', '--port', String(port)], {
    cwd: options.cwd ?? ROOT,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  let output = ''
  const listeners = new Set<() => void>()
  const append = (chunk: Buffer) => {
    output += chunk.toString('utf8')
    for (const listener of listeners) listener()
  }
  child.stdout?.on('data', append)
  child.stderr?.on('data', append)

  const stop = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return
    const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()))
    child.kill()
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 5000))])
  }

  try {
    await waitUntilUp(baseURL, child, 60_000)
  } catch (error) {
    await stop()
    throw error
  }

  return {
    baseURL,
    output: () => output,
    waitForOutput: (pattern, timeoutMs = 10_000) =>
      new Promise((resolve, reject) => {
        const check = () => {
          const match = output.match(pattern)
          if (!match) return false
          listeners.delete(check)
          clearTimeout(timer)
          resolve(match)
          return true
        }
        const timer = setTimeout(() => {
          listeners.delete(check)
          reject(new Error(`no apareció ${pattern} en los logs del servidor`))
        }, timeoutMs)
        listeners.add(check)
        check()
      }),
    stop,
  }
}
