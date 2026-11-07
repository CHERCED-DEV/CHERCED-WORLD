'use client'

import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react'
import type { Trace } from '@/lib/ailab/games/net'
import styles from './Rally.module.scss'

export type BrainLabels = {
  title: string
  caption: string
  idle: string
  decision: (action: string, confidence: number) => string
  actions: readonly string[]
  senses: readonly string[]
}

export type BrainHandle = { update(trace: Trace | null, action: number): void; freeze(frozen: boolean): void }

export type BrainPanelProps = {
  sizes: readonly number[]
  weights: readonly Float32Array[] | null
  labels: BrainLabels
  still?: boolean
  ref?: Ref<BrainHandle>
}

const VIEW = { width: 400, height: 228, top: 14, bottom: 14 }

const COLUMNS = [92, 178, 262, 330]

const TOP_LINKS = 3

const PATH_LINKS = 6

const LIT = 0.6

type Node = { x: number; y: number }

function layout(sizes: readonly number[]): Node[][] {
  const span = VIEW.height - VIEW.top - VIEW.bottom
  return sizes.map((count, layer) =>
    Array.from({ length: count }, (_, index) => ({ x: COLUMNS[layer] ?? 0, y: VIEW.top + ((index + 0.5) * span) / count })),
  )
}

type Link = { key: string; from: Node; to: Node; strength: number }

function strongest(sizes: readonly number[], weights: readonly Float32Array[] | null, nodes: Node[][]): Link[] {
  if (!weights) return []
  const links: Link[] = []
  let max = 0
  for (let l = 0; l < sizes.length - 1; l += 1) {
    const inputs = sizes[l]!
    const outputs = sizes[l + 1]!
    const layer = weights[l * 2]
    if (!layer || layer.length !== inputs * outputs) return []
    for (let j = 0; j < outputs; j += 1) {
      const ranked = Array.from({ length: inputs }, (_, i) => ({ i, w: Math.abs(layer[j * inputs + i]!) }))
        .sort((a, b) => b.w - a.w)
        .slice(0, TOP_LINKS)
      for (const { i, w } of ranked) {
        max = Math.max(max, w)
        links.push({ key: `${l}-${j}-${i}`, from: nodes[l]![i]!, to: nodes[l + 1]![j]!, strength: w })
      }
    }
  }
  return links.map((link) => ({ ...link, strength: max > 0 ? link.strength / max : 0 }))
}

function decisionPath(trace: Trace, weights: readonly Float32Array[], sizes: readonly number[], action: number): Array<[number, number, number]> {
  const path: Array<[number, number, number]> = []
  let targets = [action]
  for (let l = sizes.length - 2; l >= 0 && path.length < PATH_LINKS; l -= 1) {
    const inputs = sizes[l]!
    const layer = weights[l * 2]!
    const from = trace.a[l]!
    const next: number[] = []
    for (const j of targets) {
      let best = -1
      let bestValue = 0
      let second = -1
      let secondValue = 0
      for (let i = 0; i < inputs; i += 1) {
        const value = Math.abs(layer[j * inputs + i]! * from[i]!)
        if (value > bestValue) {
          second = best
          secondValue = bestValue
          best = i
          bestValue = value
        } else if (value > secondValue) {
          second = i
          secondValue = value
        }
      }
      if (best >= 0) {
        path.push([l, best, j])
        next.push(best)
      }
      if (l === sizes.length - 2 && second >= 0) {
        path.push([l, second, j])
        next.push(second)
      }
    }
    targets = [...new Set(next)]
  }
  return path.slice(0, PATH_LINKS)
}

export function BrainPanel({ sizes, weights, labels, still = false, ref }: BrainPanelProps) {
  const nodes = useMemo(() => layout(sizes), [sizes])
  const links = useMemo(() => strongest(sizes, weights, nodes), [sizes, weights, nodes])
  const svgRef = useRef<SVGSVGElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const neuronRefs = useRef<Array<SVGGElement | null>>([])
  const pathRefs = useRef<Array<SVGGElement | null>>([])
  const flowRef = useRef(0)
  const weightsRef = useRef(weights)
  const labelsRef = useRef(labels)

  useEffect(() => {
    weightsRef.current = weights
    labelsRef.current = labels
  })

  const flat = useMemo(() => nodes.flatMap((column, layer) => column.map((node, index) => ({ ...node, layer, index }))), [nodes])

  useImperativeHandle(
    ref,
    () => ({
      update(trace, action) {
        const svg = svgRef.current
        const text = textRef.current
        if (!svg || !text) return
        const current = weightsRef.current
        let lit = 0
        let n = 0
        const last = sizes.length - 1
        for (let layer = 0; layer < sizes.length; layer += 1) {
          for (let index = 0; index < sizes[layer]!; index += 1) {
            const neuron = neuronRefs.current[n]
            n += 1
            if (!neuron) continue
            let level = 0
            if (trace) {
              level = layer === last ? trace.probs[index]! : Math.min(1, Math.abs(trace.a[layer]![index]!))
            }
            const on = trace !== null && (layer === last ? index === action : level >= LIT)
            if (on) lit += 1
            neuron.style.opacity = String(Math.round((0.3 + 0.7 * level) * 100) / 100)
            neuron.toggleAttribute('data-on', on)
          }
        }
        const path = trace && current ? decisionPath(trace, current, sizes, action) : []
        if (trace && !svg.hasAttribute('data-still')) {
          flowRef.current = (flowRef.current - 3) % 18
          svg.style.setProperty('--cw-rally-flow', String(flowRef.current))
        }
        pathRefs.current.forEach((group, index) => {
          if (!group) return
          const link = path[index]
          group.toggleAttribute('data-hidden', !link)
          if (!link) return
          const [layer, from, to] = link
          const a = nodes[layer]![from]!
          const b = nodes[layer + 1]![to]!
          for (const line of group.children) {
            line.setAttribute('x1', String(a.x))
            line.setAttribute('y1', String(a.y))
            line.setAttribute('x2', String(b.x))
            line.setAttribute('y2', String(b.y))
          }
        })
        svg.setAttribute('data-lit', String(lit))
        svg.toggleAttribute('data-active', trace !== null)
        const { actions, decision, idle } = labelsRef.current
        const next = trace ? decision(actions[action] ?? '', Math.round(trace.probs[action]! * 100)) : idle
        if (text.textContent !== next) text.textContent = next
      },
      freeze(frozen) {
        svgRef.current?.toggleAttribute('data-frozen', frozen)
      },
    }),
    [nodes, sizes],
  )

  return (
    <figure className={styles.brain} data-cw-rally-brain="">
      <figcaption className={styles.panelTitle}>{labels.title}</figcaption>
      <div className={styles.brainView}>
        <svg className={styles.brainSvg} viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} aria-hidden="true" focusable="false">
          <g>
            {links.map((link) => (
              <line
                key={link.key}
                className={styles.syn}
                x1={link.from.x}
                y1={link.from.y}
                x2={link.to.x}
                y2={link.to.y}
                style={{ opacity: 0.18 + 0.62 * link.strength }}
              />
            ))}
          </g>
          <g className={styles.brainLabels}>
            {nodes[0]!.map((node, index) => (
              <text key={index} x={node.x - 12} y={node.y} textAnchor="end" dominantBaseline="middle">
                {labels.senses[index] ?? ''}
              </text>
            ))}
            {nodes[sizes.length - 1]!.map((node, index) => (
              <text key={index} x={node.x + 12} y={node.y} textAnchor="start" dominantBaseline="middle">
                {labels.actions[index] ?? ''}
              </text>
            ))}
          </g>
        </svg>
        <svg
          ref={svgRef}
          className={styles.brainLive}
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          aria-hidden="true"
          focusable="false"
          data-lit="0"
          data-still={still ? '' : undefined}
          data-frozen=""
        >
          <g>
            {Array.from({ length: PATH_LINKS }, (_, index) => (
              <g
                key={index}
                ref={(element) => {
                  pathRefs.current[index] = element
                }}
                className={styles.path}
                data-hidden=""
              >
                <line className={styles.pathGlow} />
                <line className={styles.synOn} />
              </g>
            ))}
          </g>
          <g>
            {flat.map((node, n) => {
              const radius = node.layer === 0 || node.layer === sizes.length - 1 ? 5.5 : 4.2
              return (
                <g
                  key={`${node.layer}-${node.index}`}
                  ref={(element) => {
                    neuronRefs.current[n] = element
                  }}
                  className={styles.neuron}
                  style={{ opacity: 0.3 }}
                  data-layer={node.layer}
                >
                  <circle className={styles.halo} cx={node.x} cy={node.y} r={radius + 3.5} />
                  <circle className={styles.core} cx={node.x} cy={node.y} r={radius} />
                </g>
              )
            })}
          </g>
        </svg>
      </div>
      <p ref={textRef} className={styles.decision} data-cw-rally-decision="">
        {labels.idle}
      </p>
      <p className={styles.caption}>{labels.caption}</p>
    </figure>
  )
}
