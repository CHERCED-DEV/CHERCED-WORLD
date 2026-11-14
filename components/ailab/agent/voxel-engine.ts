import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  DataTexture,
  DirectionalLight,
  DynamicDrawUsage,
  Euler,
  Fog,
  GridHelper,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearMipmapLinearFilter,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NearestFilter,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  RGBAFormat,
  RingGeometry,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Camera,
} from 'three'
import { AVATAR_VIEWBOX, MOUTH_NAMES, MOUTH_Y, mouthFor, type MouthName } from './avatar-sprite'
import { browserLoopEnv, createFrameLoop, type FrameLoopEnv } from './voxel-loop'
import { LENS_COLORS, VOXEL_COLORS, VOXEL_MODEL, type Voxel } from './voxel-model'

export type VoxelState = 'off' | 'idle' | 'listening' | 'thinking' | 'speaking'

export type VoxelDodge = { side: 'left' | 'right'; id: number } | null

export type VoxelInputs = {
  state: VoxelState
  active: boolean
  live: boolean
  shocked: boolean
  dodge: VoxelDodge
}

export type VoxelAudio = { level: () => number; voice: () => number }

export type VoxelRenderer = {
  domElement: HTMLCanvasElement
  setPixelRatio: (ratio: number) => void
  setSize: (width: number, height: number, updateStyle?: boolean) => void
  render: (scene: Scene, camera: Camera) => void
  dispose: () => void
  forceContextLoss: () => void
}

export type VoxelEngineOptions = {
  audio: VoxelAudio
  onPoke: (x: number, y: number) => void
  onReady: () => void
  onFail: () => void
  renderer?: () => VoxelRenderer
  loop?: FrameLoopEnv
  now?: () => number
  random?: () => number
  pixelRatio?: () => number
}

export type VoxelEngine = {
  update: (inputs: VoxelInputs) => void
  running: () => boolean
  dispose: () => void
}

export const MAX_PIXEL_RATIO = 1.5

export const VOXEL_GREEN = 0x25ed9e

const DODGE_MS = 520

const SHAKE_MS = 600

const GREET_MS = 900

const BLINK_MS = 160

const EYE_COLORS: ReadonlySet<string> = new Set(['w', 'k'])

export const QUALITY_FRAMES = 90

const SMOOTH_MS = 1000 / 40

const SLOW_MS = 1000 / 20

const CAMERA_DISTANCE = 150

const CAMERA_FOV = 29

const CAMERA_TARGET = new Vector3(0, 32, 0)

const LENS_GLOW: Record<VoxelState, number> = { off: 0, idle: 0.35, listening: 0.6, thinking: 0.18, speaking: 0.55 }

const RIM: Record<VoxelState, number> = { off: 0, idle: 0.35, listening: 0.5, thinking: 0.45, speaking: 0.75 }

const RING: Record<VoxelState, number> = { off: 0, idle: 0.05, listening: 0.08, thinking: 0.07, speaking: 0.1 }

const HALO: Record<VoxelState, number> = { off: 0, idle: 0.1, listening: 0.14, thinking: 0.12, speaking: 0.18 }

type Layer = MouthName | 'eyes' | 'sweat'

const DEGREE = Math.PI / 180

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function smooth(value: number): number {
  const x = clamp(value, 0, 1)
  return x * x * (3 - 2 * x)
}

function borderTexture(): DataTexture {
  const size = 16
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const edge = x === 0 || y === 0 || x === size - 1 || y === size - 1
      const index = (y * size + x) * 4
      const value = edge ? 120 : 255
      data[index] = value
      data[index + 1] = value
      data[index + 2] = value
      data[index + 3] = 255
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat)
  texture.magFilter = NearestFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

function radialTexture(shade: number, power: number): DataTexture {
  const size = 64
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5
      const dy = (y + 0.5) / size - 0.5
      const distance = Math.sqrt(dx * dx + dy * dy) * 2
      const index = (y * size + x) * 4
      data[index] = shade
      data[index + 1] = shade
      data[index + 2] = shade
      data[index + 3] = Math.round(Math.pow(1 - smooth(distance), power) * 255)
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat)
  texture.needsUpdate = true
  return texture
}

function voxelMaterial(texture: DataTexture, desat: { value: number }): MeshPhysicalMaterial {
  const material = new MeshPhysicalMaterial({ color: 0xffffff, map: texture, roughness: 0.72, metalness: 0, specularIntensity: 0.35, fog: false })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDesat = desat
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float glow;\nvarying float vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow;\nuniform float uDesat;')
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722))), uDesat);',
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vGlow;')
  }
  return material
}

function listen<T extends Event>(target: EventTarget | undefined, type: string, handler: (event: T) => void, options?: AddEventListenerOptions): () => void {
  if (!target) return () => undefined
  const listener = handler as EventListener
  target.addEventListener(type, listener, options)
  return () => target.removeEventListener(type, listener, options)
}

function defaultRenderer(): VoxelRenderer {
  return new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'default', failIfMajorPerformanceCaveat: true })
}

export function createVoxelEngine(host: HTMLElement, options: VoxelEngineOptions): VoxelEngine {
  const now = options.now ?? (() => performance.now())
  const random = options.random ?? Math.random
  const pixelRatio = options.pixelRatio ?? (() => (typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1))
  const renderer = (options.renderer ?? defaultRenderer)()
  const canvas = renderer.domElement
  host.appendChild(canvas)

  const model = VOXEL_MODEL
  const layers: Array<{ name: Layer; voxels: Voxel[] }> = [
    ...MOUTH_NAMES.map((name) => ({ name: name as Layer, voxels: model.mouths[name] })),
    { name: 'eyes', voxels: model.eyes },
    { name: 'sweat', voxels: model.sweat },
  ]
  const list: Voxel[] = [...model.body, ...layers.flatMap((layer) => layer.voxels)]
  const layerOf: Array<Layer | null> = [...model.body.map(() => null), ...layers.flatMap((layer) => layer.voxels.map(() => layer.name))]
  const count = list.length
  const half = model.width / 2
  const baseX = Float32Array.from(list, (item) => item.x - half + 0.5)
  const baseY = Float32Array.from(list, (item) => model.height - item.y - 0.5)
  const baseZ = Float32Array.from(list, (item) => item.z)
  const depth = Float32Array.from(list, (item) => item.depth)
  const lens = list.flatMap((item, index) => (index >= model.visorStart && index < model.body.length && LENS_COLORS.has(item.c) ? [index] : []))
  const accents = list.flatMap((item, index) => (item.c === 'x' ? [index] : []))

  const scene = new Scene()
  scene.background = new Color(0x000000)
  scene.fog = new Fog(0x000000, 150, 400)

  const camera = new PerspectiveCamera(CAMERA_FOV, 16 / 10, 10, 700)

  const desat = { value: 0 }
  const border = borderTexture()
  const geometry = new BoxGeometry(1, 1, 1)
  const glow = new Float32Array(count)
  const glowAttribute = new InstancedBufferAttribute(glow, 1)
  glowAttribute.setUsage(DynamicDrawUsage)
  geometry.setAttribute('glow', glowAttribute)
  const material = voxelMaterial(border, desat)
  const mesh = new InstancedMesh(geometry, material, count)
  mesh.instanceMatrix.setUsage(DynamicDrawUsage)
  mesh.frustumCulled = false
  const color = new Color()
  list.forEach((item, index) => mesh.setColorAt(index, color.setHex(VOXEL_COLORS[item.c] ?? 0xff00ff)))
  scene.add(mesh)

  const grid = new GridHelper(360, 90, 0x1f4a3a, 0x15211c)
  const gridMaterial = grid.material
  gridMaterial.transparent = true
  gridMaterial.opacity = 0.85
  scene.add(grid)

  const shadowMap = radialTexture(0, 1.6)
  const shadowGeometry = new PlaneGeometry(46, 20)
  const shadowMaterial = new MeshBasicMaterial({ color: 0x000000, map: shadowMap, transparent: true, depthWrite: false })
  const shadow = new Mesh(shadowGeometry, shadowMaterial)
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.02
  shadow.renderOrder = 1
  scene.add(shadow)

  const ringGeometry = new RingGeometry(15.4, 15.8, 128)
  const ringMaterial = new MeshBasicMaterial({ color: VOXEL_GREEN, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false })
  const ring = new Mesh(ringGeometry, ringMaterial)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.04
  ring.renderOrder = 2
  scene.add(ring)

  const haloMap = radialTexture(255, 1.7)
  const haloGeometry = new PlaneGeometry(130, 130)
  const haloMaterial = new MeshBasicMaterial({ color: VOXEL_GREEN, map: haloMap, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, fog: false })
  const halo = new Mesh(haloGeometry, haloMaterial)
  halo.position.set(0, 38, -18)
  halo.renderOrder = -1
  scene.add(halo)

  const key = new DirectionalLight(0xffffff, 2.6)
  key.position.set(-40, 80, 100)
  const fill = new HemisphereLight(0xffffff, 0x0a0a0a, 0.55)
  const rimLeft = new DirectionalLight(VOXEL_GREEN, 0)
  rimLeft.position.set(-80, 45, -60)
  const rimRight = new DirectionalLight(VOXEL_GREEN, 0)
  rimRight.position.set(80, 45, -60)
  scene.add(key, fill, rimLeft, rimRight)

  const pivot = new Vector3(model.pivot.x - half, model.height - model.pivot.y, 0)
  const matrix = new Matrix4()
  const local = new Matrix4()
  const head = new Matrix4()
  const toPivot = new Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z)
  const rotation = new Quaternion()
  const euler = new Euler()
  const still = new Quaternion()
  const position = new Vector3()
  const scale = new Vector3()

  for (let index = 0; index < model.headStart; index++) {
    local.compose(position.set(baseX[index]!, baseY[index]!, baseZ[index]!), still, scale.set(1, 1, depth[index]!))
    mesh.setMatrixAt(index, local)
  }

  let inputs: VoxelInputs = { state: 'idle', active: false, live: false, shocked: false, dodge: null }
  let last = 0
  let ready = false
  let failed = false
  let width = 0
  let height = 0
  let pointer: { x: number; y: number } | null = null
  let lookX = 0
  let lookY = 0
  let camX = 0
  let camY = 0
  let breathAmp = 0
  let roll = 0
  let rim = 0
  let ringLevel = 0
  let haloLevel = 0
  let drop = 0
  let sweat = 0
  const mouth: Record<MouthName, number> = { closed: 0, mid: 0, open: 0 }
  let dodgeAt = -Infinity
  let dodgeSide = 1
  let shakeAt = -Infinity
  let greetAt = -Infinity
  let blinkAt = -Infinity
  let eyesWereOut = false
  let nextBlink = now() + 600 + random() * 900
  let ratioCap = MAX_PIXEL_RATIO
  let sampled = 0
  let spent = 0
  let slow = 0

  const awake = () => inputs.active && inputs.state !== 'off'

  const frame = (time: number): boolean => {
    if (failed || width === 0 || height === 0) return false
    const gap = last ? time - last : 0
    const dt = last ? clamp(gap / 1000, 0, 0.1) : 1 / 60
    last = time
    if (awake() && gap > 0 && gap < 250) {
      spent += gap
      sampled++
    }
    if (sampled >= QUALITY_FRAMES) {
      const average = spent / sampled
      sampled = 0
      spent = 0
      if (average > SMOOTH_MS && Math.min(pixelRatio(), ratioCap) > 1) {
        ratioCap = 1
        applySize()
      } else if (average > SLOW_MS) {
        slow++
        if (slow >= 2) {
          giveUp()
          return false
        }
      } else slow = 0
    }
    const seconds = time / 1000
    const ease = (current: number, target: number, rate: number) => current + (target - current) * (1 - Math.exp(-rate * dt))
    const alive = awake()
    const state = inputs.state
    const speaking = state === 'speaking'
    const level = speaking ? clamp(options.audio.level(), 0, 1) : 0
    const voice = state === 'off' ? 0 : clamp(options.audio.voice(), 0, 1)
    let unsettled = 0
    const follow = (current: number, target: number, rate: number) => {
      const next = ease(current, target, rate)
      unsettled = Math.max(unsettled, Math.abs(target - next))
      return next
    }

    let px = 0
    let py = 0
    if (alive && pointer) {
      const box = host.getBoundingClientRect()
      if (box.width > 0 && box.height > 0) {
        px = clamp((pointer.x - (box.left + box.width / 2)) / (box.width / 2), -1.5, 1.5)
        py = clamp((pointer.y - (box.top + box.height / 2)) / (box.height / 2), -1.5, 1.5)
      }
    }

    desat.value = follow(desat.value, state === 'off' ? 1 : 0, 4)
    breathAmp = follow(breathAmp, alive ? 1 : 0, 3)
    lookX = follow(lookX, clamp(px, -1, 1), 5)
    lookY = follow(lookY, clamp(py, -1, 1), 5)
    camX = follow(camX, px, 2.5)
    camY = follow(camY, py, 2.5)
    roll = follow(roll, state === 'thinking' ? -0.07 : 0, 4)
    rim = follow(rim, RIM[state] + voice * 2.4, 10)
    ringLevel = follow(ringLevel, RING[state] + voice * 0.65, 12)
    drop = follow(drop, inputs.shocked ? 1 : 0, 16)
    const dodging = time - dodgeAt < DODGE_MS
    sweat = follow(sweat, dodging || state === 'thinking' ? 1 : 0, 14)
    const target: MouthName | null = inputs.shocked ? 'closed' : speaking ? mouthFor(level) : null
    for (const name of MOUTH_NAMES) mouth[name] = follow(mouth[name], name === target ? 1 : 0, 32)

    const eyesOut = drop > 0.6
    if (eyesOut && !eyesWereOut) nextBlink = time + 550 + random() * 450
    eyesWereOut = eyesOut
    if (eyesOut && time >= nextBlink) {
      blinkAt = time
      nextBlink = time + 900 + random() * 1400
    }
    const blinkPhase = (time - blinkAt) / BLINK_MS
    const blink = blinkPhase >= 0 && blinkPhase < 1 ? 1 - Math.abs(blinkPhase * 2 - 1) : 0

    const breath = Math.sin((seconds * Math.PI * 2) / (speaking ? 1.6 : 3.8)) * breathAmp
    let offsetX = 0
    let offsetY = 0
    let tilt = 0
    const dodgePhase = (time - dodgeAt) / DODGE_MS
    if (dodgePhase >= 0 && dodgePhase < 1) {
      const room = CAMERA_DISTANCE * Math.tan((CAMERA_FOV / 2) * DEGREE) * camera.aspect - half - 2
      const reach = clamp(room, 8, AVATAR_VIEWBOX.width * 0.7) * dodgeSide
      const lift = AVATAR_VIEWBOX.height * 0.1
      if (dodgePhase < 0.35) {
        const k = smooth(dodgePhase / 0.35)
        offsetX = reach * k
        offsetY = lift * k
        tilt = -dodgeSide * 8 * DEGREE * k
      } else if (dodgePhase < 0.65) {
        const k = smooth((dodgePhase - 0.35) / 0.3)
        offsetX = reach
        offsetY = lift * (1 - k)
        tilt = -dodgeSide * 8 * DEGREE * (1 - k)
      } else offsetX = reach * (1 - smooth((dodgePhase - 0.65) / 0.35))
    }
    const shakePhase = (time - shakeAt) / SHAKE_MS
    if (shakePhase >= 0 && shakePhase < 1) offsetX += Math.sin(shakePhase * Math.PI * 4) * 0.9 * (1 - shakePhase)
    const greetPhase = (time - greetAt) / GREET_MS
    const greeting = greetPhase >= 0 && greetPhase < 1
    const hop = greeting ? Math.sin(greetPhase * Math.PI) * 2.4 : 0
    const nod = greeting ? Math.sin(greetPhase * Math.PI * 2) * 0.2 * (1 - greetPhase) : 0

    mesh.position.set(offsetX, offsetY + hop, 0)
    mesh.rotation.set(0, lookX * 0.12, tilt)
    mesh.scale.set(1, 1 + breath * 0.01, 1)

    euler.set(lookY * 0.2 + nod - drop * 0.1, lookX * 0.38, roll + Math.sin(seconds * 3) * 0.015 * (state === 'thinking' ? 1 : 0))
    rotation.setFromEuler(euler)
    head.compose(position.set(pivot.x, pivot.y + breath * 0.3 + level * 0.9, pivot.z), rotation, scale.set(1, 1, 1)).multiply(toPivot)

    const lift = model.visorDrop * drop
    for (let index = model.headStart; index < count; index++) {
      let sx = 1
      let sy = 1
      let sz = depth[index]!
      let oy = 0
      let oz = 0
      const layer = layerOf[index]
      if (index >= model.visorStart && index < model.body.length) {
        oy = -lift
        oz = drop * 0.6
      } else if (layer === 'eyes') {
        const shown = smooth(drop * 1.4 - 0.2)
        sx = shown
        sy = shown * (EYE_COLORS.has(list[index]!.c) ? 1 - blink * 0.9 : 1)
        sz *= shown
      } else if (layer === 'sweat') {
        sx = sweat
        sy = sweat
        sz *= sweat
        oy = -((seconds * 1.4) % 1) * 1.2 * sweat
      } else if (layer) {
        const row = list[index]!.y - MOUTH_Y
        const shown = clamp(mouth[layer] * 3 - row, 0, 1)
        sx = shown
        sy = shown
        sz *= shown
        oz = (1 - shown) * 0.4
      }
      local.compose(position.set(baseX[index]!, baseY[index]! + oy, baseZ[index]! + oz), still, scale.set(sx, sy, sz))
      matrix.multiplyMatrices(head, local)
      mesh.setMatrixAt(index, matrix)
    }
    mesh.instanceMatrix.clearUpdateRanges()
    mesh.instanceMatrix.addUpdateRange(model.headStart * 16, (count - model.headStart) * 16)
    mesh.instanceMatrix.needsUpdate = true

    const lit = 1 - desat.value
    const base = LENS_GLOW[state]
    const sweep = state === 'thinking' ? 2 + ((seconds % 1.2) / 1.2) * 30 : -99
    for (const index of lens) {
      const item = list[index]!
      const weight = item.c === 'g' ? 1 : item.c === 'l' ? 0.7 : 0.25
      const scan = Math.exp(-((item.x - sweep) ** 2) / 5) * 0.95
      glow[index] = (base * weight + scan + level * 1.6 * weight) * lit
    }
    for (const index of accents) glow[index] = 0.45 * lit
    glowAttribute.needsUpdate = true

    rimLeft.intensity = rim * lit
    rimRight.intensity = rim * lit
    key.intensity = 2.6 - desat.value * 1.1
    ringMaterial.opacity = ringLevel * lit
    ring.scale.setScalar(1 + voice * 0.28)
    ring.position.x = offsetX
    haloLevel = follow(haloLevel, HALO[state] + voice * 0.4, 10)
    haloMaterial.opacity = haloLevel * lit
    halo.position.x = offsetX * 0.6

    const breathe = breathAmp
    const yaw = (Math.sin((seconds * Math.PI * 2) / 11) * 1.4 * breathe + camX * 3) * DEGREE
    const pitch = (3 + Math.sin((seconds * Math.PI * 2) / 8.5) * 0.9 * breathe + camY * 1.6) * DEGREE
    camera.position.set(
      CAMERA_TARGET.x + Math.sin(yaw) * Math.cos(pitch) * CAMERA_DISTANCE,
      CAMERA_TARGET.y + Math.sin(pitch) * CAMERA_DISTANCE,
      CAMERA_TARGET.z + Math.cos(yaw) * Math.cos(pitch) * CAMERA_DISTANCE,
    )
    camera.lookAt(CAMERA_TARGET)

    renderer.render(scene, camera)
    if (!ready) {
      ready = true
      options.onReady()
    }
    const transient = dodging || greeting || (shakePhase >= 0 && shakePhase < 1) || inputs.shocked || blink > 0
    return transient || unsettled > 0.002
  }

  const loop = createFrameLoop(frame, options.loop ?? browserLoopEnv(host))

  function applySize() {
    renderer.setPixelRatio(Math.min(pixelRatio(), ratioCap))
    renderer.setSize(width, height, false)
  }

  function giveUp() {
    if (failed) return
    failed = true
    loop.setActive(false)
    options.onFail()
  }

  const resize = () => {
    const nextWidth = host.clientWidth
    const nextHeight = host.clientHeight
    if (nextWidth === width && nextHeight === height) return
    width = nextWidth
    height = nextHeight
    if (!width || !height) return
    applySize()
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    loop.wake()
  }

  const raycaster = new Raycaster()
  const ndc = new Vector2()
  const front = new Plane(new Vector3(0, 0, 1), 0)
  const hit = new Vector3()
  const poke = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect()
    if (!box.width || !box.height) return
    ndc.set(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1)
    camera.updateMatrixWorld()
    raycaster.setFromCamera(ndc, camera)
    if (!raycaster.ray.intersectPlane(front, hit)) return
    const x = hit.x - mesh.position.x + half
    const y = model.height - (hit.y - mesh.position.y)
    const { x: left, y: top, width: wide, height: tall } = AVATAR_VIEWBOX
    if (x < left || x > left + wide || y < top || y > top + tall) return
    options.onPoke(x, y)
  }

  const fail = (event: Event) => {
    event.preventDefault()
    giveUp()
  }

  const track = (event: PointerEvent) => {
    pointer = { x: event.clientX, y: event.clientY }
  }

  const release = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') pointer = null
  }

  const view = typeof window === 'undefined' ? undefined : window
  const stops = [
    listen<PointerEvent>(canvas, 'pointerdown', poke),
    listen<Event>(canvas, 'webglcontextlost', fail),
    listen<PointerEvent>(view, 'pointermove', track, { passive: true }),
    listen<PointerEvent>(view, 'pointerdown', track, { passive: true }),
    listen<PointerEvent>(view, 'pointerup', release, { passive: true }),
    listen<PointerEvent>(view, 'pointercancel', release, { passive: true }),
  ]
  let resizer: ResizeObserver | null = null
  if (typeof ResizeObserver !== 'undefined') {
    resizer = new ResizeObserver(resize)
    resizer.observe(host)
  }
  resize()
  loop.wake()

  let disposed = false
  return {
    update(next) {
      if (disposed) return
      const at = now()
      if (next.dodge && next.dodge.id !== inputs.dodge?.id) {
        dodgeAt = at
        dodgeSide = next.dodge.side === 'left' ? -1 : 1
      }
      if (next.shocked && !inputs.shocked) shakeAt = at
      if (next.live && !inputs.live) greetAt = at
      inputs = next
      loop.setActive(awake())
      loop.wake()
    },
    running: () => loop.running(),
    dispose() {
      if (disposed) return
      disposed = true
      loop.dispose()
      for (const stop of stops) stop()
      resizer?.disconnect()
      mesh.dispose()
      geometry.dispose()
      material.dispose()
      border.dispose()
      grid.geometry.dispose()
      gridMaterial.dispose()
      shadowGeometry.dispose()
      shadowMaterial.dispose()
      shadowMap.dispose()
      ringGeometry.dispose()
      ringMaterial.dispose()
      haloGeometry.dispose()
      haloMaterial.dispose()
      haloMap.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
