import { InstancedMesh, Mesh, RingGeometry, Vector3, type Camera, type MeshBasicMaterial, type Scene } from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isCrotch, MOUTH_NAMES } from '@/components/ailab/agent/avatar-sprite'
import { createVoxelEngine, MAX_PIXEL_RATIO, QUALITY_FRAMES, type VoxelInputs, type VoxelRenderer } from '@/components/ailab/agent/voxel-engine'
import { createFrameLoop, type FrameLoopEnv } from '@/components/ailab/agent/voxel-loop'
import { LENS_COLORS, VOXEL_MODEL } from '@/components/ailab/agent/voxel-model'
import { chooseScene, hasWebGL, loadVoxelStage, wantsVoxels, type VoxelStageComponent } from '@/components/ailab/agent/voxel-scene'

function fakeFrames() {
  let next = 1
  let time = 0
  let hidden = false
  const queue = new Map<number, (now: number) => void>()
  const listeners: { visibility?: () => void; screen?: (visible: boolean) => void } = {}
  const stopVisibility = vi.fn()
  const stopObserving = vi.fn()
  const env: FrameLoopEnv = {
    raf: vi.fn((callback: (now: number) => void) => {
      const id = next++
      queue.set(id, callback)
      return id
    }),
    caf: vi.fn((id: number) => {
      queue.delete(id)
    }),
    hidden: () => hidden,
    onVisibility: (listener) => {
      listeners.visibility = listener
      return stopVisibility
    },
    observe: (listener) => {
      listeners.screen = listener
      return stopObserving
    },
  }
  return {
    env,
    stopVisibility,
    stopObserving,
    now: () => time,
    pending: () => queue.size,
    flush(frames = 1, step = 16) {
      for (let frame = 0; frame < frames; frame++) {
        time += step
        const due = [...queue.values()]
        queue.clear()
        for (const callback of due) callback(time)
      }
    },
    hide(value: boolean) {
      hidden = value
      listeners.visibility?.()
    },
    onScreen(value: boolean) {
      listeners.screen?.(value)
    },
  }
}

const BOX = { left: 0, top: 0, width: 640, height: 400, right: 640, bottom: 400, x: 0, y: 0, toJSON: () => ({}) }

function fakeRenderer() {
  const canvas = Object.assign(new EventTarget(), { remove: vi.fn(), getBoundingClientRect: () => BOX })
  const renderer = {
    domElement: canvas as unknown as HTMLCanvasElement,
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    render: vi.fn<(scene: Scene, camera: Camera) => void>(),
    dispose: vi.fn(),
    forceContextLoss: vi.fn(),
  }
  return { renderer, canvas }
}

function setup(audio = { level: () => 0, voice: () => 0 }) {
  const frames = fakeFrames()
  const { renderer, canvas } = fakeRenderer()
  const host = { appendChild: vi.fn(), clientWidth: 640, clientHeight: 400, getBoundingClientRect: () => BOX } as unknown as HTMLElement
  const handlers = { onPoke: vi.fn(), onReady: vi.fn(), onFail: vi.fn() }
  const engine = createVoxelEngine(host, {
    audio,
    ...handlers,
    renderer: () => renderer as VoxelRenderer,
    loop: frames.env,
    now: frames.now,
    random: () => 0.5,
    pixelRatio: () => 3,
  })
  return { engine, frames, renderer, canvas, host, handlers }
}

const LIVE: VoxelInputs = { state: 'listening', active: true, live: true, shocked: false, dodge: null }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('respaldo 2D (FR-3703, FR-3705)', () => {
  it('el 3D solo se pide con ?escenario=3d', () => {
    expect(wantsVoxels('?escenario=3d')).toBe(true)
    expect(wantsVoxels('')).toBe(false)
    expect(wantsVoxels('?escenario=2d')).toBe(false)
  })

  it('sin WebGL, con movimiento reducido o sin la opción queda el sprite 2D', () => {
    const webgl = vi.fn(() => true)
    expect(chooseScene({ search: '?escenario=3d', reducedMotion: false, webgl })).toBe('3d')
    expect(chooseScene({ search: '?escenario=3d', reducedMotion: false, webgl: () => false })).toBe('2d')
    webgl.mockClear()
    expect(chooseScene({ search: '?escenario=3d', reducedMotion: true, webgl })).toBe('2d')
    expect(chooseScene({ search: '', reducedMotion: false, webgl })).toBe('2d')
    expect(webgl).not.toHaveBeenCalled()
  })

  it('detecta WebGL 2 y suelta el contexto de prueba', () => {
    const loseContext = vi.fn()
    const gl = { getExtension: () => ({ loseContext }) }
    const doc = (context: unknown) => ({ createElement: () => ({ getContext: () => context }) }) as unknown as Document
    expect(hasWebGL(doc(gl))).toBe(true)
    expect(loseContext).toHaveBeenCalled()
    expect(hasWebGL(doc(null))).toBe(false)
    expect(hasWebGL({ createElement: () => ({ getContext: () => { throw new Error('blocked') } }) } as unknown as Document)).toBe(false)
  })

  it('si falla la descarga de Three.js no hay escenario 3D', async () => {
    expect(await loadVoxelStage(() => Promise.reject(new Error('offline')))).toBeNull()
    const Stage = (() => null) as unknown as VoxelStageComponent
    expect(await loadVoxelStage(() => Promise.resolve({ default: Stage }))).toBe(Stage)
  })

  it('si el navegador pierde el contexto WebGL avisa para volver al 2D', () => {
    const { engine, canvas, handlers, frames } = setup()
    engine.update(LIVE)
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    expect(handlers.onFail).toHaveBeenCalledTimes(1)
    frames.flush(3)
    expect(engine.running()).toBe(false)
  })
})

describe('ciclo de render (FR-3704)', () => {
  it('se pausa con la pestaña oculta o fuera de pantalla y vuelve al mostrarse', () => {
    const frames = fakeFrames()
    const frame = vi.fn(() => false)
    const loop = createFrameLoop(frame, frames.env)
    loop.setActive(true)
    frames.flush(3)
    expect(frame).toHaveBeenCalledTimes(3)
    frames.hide(true)
    expect(loop.running()).toBe(false)
    frames.flush(3)
    expect(frame).toHaveBeenCalledTimes(3)
    frames.hide(false)
    frames.onScreen(false)
    frames.flush(3)
    expect(frame).toHaveBeenCalledTimes(3)
    frames.onScreen(true)
    frames.flush(2)
    expect(frame).toHaveBeenCalledTimes(5)
  })

  it('al colgar termina la animación en curso y se detiene solo', () => {
    const frames = fakeFrames()
    let busy = 2
    const loop = createFrameLoop(() => busy-- > 0, frames.env)
    loop.setActive(true)
    frames.flush(2)
    loop.setActive(false)
    loop.wake()
    frames.flush(5)
    expect(loop.running()).toBe(false)
    expect(frames.pending()).toBe(0)
  })

  it('se detiene y suelta la GPU al desmontar', () => {
    const { engine, frames, renderer, canvas, handlers } = setup()
    engine.update(LIVE)
    frames.flush(4)
    expect(handlers.onReady).toHaveBeenCalledTimes(1)
    expect(engine.running()).toBe(true)
    const rendered = renderer.render.mock.calls.length
    engine.dispose()
    expect(engine.running()).toBe(false)
    expect(frames.env.caf).toHaveBeenCalled()
    expect(frames.pending()).toBe(0)
    expect(frames.stopVisibility).toHaveBeenCalled()
    expect(frames.stopObserving).toHaveBeenCalled()
    expect(renderer.dispose).toHaveBeenCalled()
    expect(renderer.forceContextLoss).toHaveBeenCalled()
    expect(canvas.remove).toHaveBeenCalled()
    frames.flush(5)
    engine.update({ ...LIVE, state: 'speaking' })
    frames.flush(5)
    expect(renderer.render).toHaveBeenCalledTimes(rendered)
  })

  it('tras colgar se queda quieto y no sigue dibujando', () => {
    const { engine, frames, renderer } = setup()
    engine.update(LIVE)
    frames.flush(10)
    engine.update({ ...LIVE, active: false, live: false, state: 'idle' })
    frames.flush(600)
    expect(engine.running()).toBe(false)
    const rendered = renderer.render.mock.calls.length
    frames.flush(30)
    expect(renderer.render).toHaveBeenCalledTimes(rendered)
  })

  it('a 60 fps conserva la resolución', () => {
    const { engine, frames, renderer, handlers } = setup()
    engine.update(LIVE)
    frames.flush(QUALITY_FRAMES * 3, 16)
    expect(renderer.setPixelRatio).not.toHaveBeenCalledWith(1)
    expect(handlers.onFail).not.toHaveBeenCalled()
  })

  it('en un celular lento baja la resolución y, si aun así no da, vuelve al 2D', () => {
    const { engine, frames, renderer, handlers } = setup()
    engine.update(LIVE)
    frames.flush(QUALITY_FRAMES + 2, 30)
    expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(1)
    expect(handlers.onFail).not.toHaveBeenCalled()
    frames.flush(QUALITY_FRAMES * 2 + 2, 60)
    expect(handlers.onFail).toHaveBeenCalledTimes(1)
    expect(engine.running()).toBe(false)
  })

  it('limita el devicePixelRatio a 1,5', () => {
    const { renderer } = setup()
    expect(renderer.setPixelRatio).toHaveBeenCalledWith(MAX_PIXEL_RATIO)
    expect(MAX_PIXEL_RATIO).toBe(1.5)
  })
})

describe('parpadeo', () => {
  const heightOf = (mesh: InstancedMesh, index: number) => {
    const e = mesh.instanceMatrix.array
    return Math.hypot(e[index * 16 + 4]!, e[index * 16 + 5]!, e[index * 16 + 6]!)
  }
  const meshOf = (scene: Scene) => scene.children.find((child): child is InstancedMesh => child instanceof InstancedMesh)!
  const lens = VOXEL_MODEL.body.flatMap((item, index) => (index >= VOXEL_MODEL.visorStart && LENS_COLORS.has(item.c) ? [index] : []))
  const eyesStart = VOXEL_MODEL.body.length + MOUTH_NAMES.reduce((total, name) => total + VOXEL_MODEL.mouths[name].length, 0)
  const pupils = VOXEL_MODEL.eyes.flatMap((item, index) => (item.c === 'w' ? [eyesStart + index] : []))

  it('con las gafas puestas no parpadea', () => {
    const { engine, frames, renderer } = setup()
    engine.update(LIVE)
    let smallest = Infinity
    for (let frame = 0; frame < 900; frame++) {
      frames.flush(1)
      const mesh = meshOf(renderer.render.mock.calls.at(-1)![0])
      for (const index of lens) smallest = Math.min(smallest, heightOf(mesh, index))
    }
    expect(smallest).toBeCloseTo(1, 3)
  })

  it('con el visor abajo parpadean los ojos', () => {
    const { engine, frames, renderer } = setup()
    engine.update({ ...LIVE, shocked: true })
    let smallest = Infinity
    for (let frame = 0; frame < 140; frame++) {
      frames.flush(1)
      const mesh = meshOf(renderer.render.mock.calls.at(-1)![0])
      for (const index of pupils) smallest = Math.min(smallest, heightOf(mesh, index))
    }
    expect(smallest).toBeLessThan(0.3)
  })
})

describe('escenario con la voz y los clics (FR-3702)', () => {
  it('la luz del anillo sigue el nivel de audio que ya calcula el escenario, sin otro AudioContext', () => {
    const AudioContext = vi.fn()
    vi.stubGlobal('AudioContext', AudioContext)
    let voice = 0
    const { engine, frames, renderer } = setup({ level: () => 0.2, voice: () => voice })
    engine.update({ ...LIVE, state: 'speaking' })
    frames.flush(30)
    const scene = renderer.render.mock.calls.at(-1)![0]
    const ring = scene.children.find((child): child is Mesh => child instanceof Mesh && child.geometry instanceof RingGeometry)!
    const quiet = (ring.material as MeshBasicMaterial).opacity
    voice = 1
    frames.flush(30)
    expect((ring.material as MeshBasicMaterial).opacity).toBeGreaterThan(quiet + 0.4)
    expect(AudioContext).not.toHaveBeenCalled()
  })

  it('un clic sobre el personaje llega en coordenadas del sprite, con la misma zona del «¿Qué te pasa?»', () => {
    const { engine, frames, renderer, canvas, handlers } = setup()
    engine.update({ ...LIVE, active: false })
    frames.flush(2)
    const camera = renderer.render.mock.calls.at(-1)![1]
    const click = (world: Vector3) => {
      camera.updateMatrixWorld()
      const point = world.clone().project(camera)
      const event = Object.assign(new Event('pointerdown'), { clientX: ((point.x + 1) / 2) * BOX.width, clientY: ((1 - point.y) / 2) * BOX.height })
      canvas.dispatchEvent(event)
    }
    click(new Vector3(0, 32, 0))
    expect(handlers.onPoke).toHaveBeenCalledTimes(1)
    const [x, y] = handlers.onPoke.mock.calls[0]!
    expect(x).toBeCloseTo(16, 0)
    expect(y).toBeCloseTo(17, 0)
    expect(isCrotch(x, y)).toBe(false)
    click(new Vector3(0, 7.5, 0))
    const [cx, cy] = handlers.onPoke.mock.calls[1]!
    expect(isCrotch(cx, cy)).toBe(true)
    click(new Vector3(-60, 32, 0))
    expect(handlers.onPoke).toHaveBeenCalledTimes(2)
  })
})
