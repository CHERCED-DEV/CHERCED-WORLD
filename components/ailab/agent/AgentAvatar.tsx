import { memo, type Ref } from 'react'
import type { Run } from '@/components/fun/sprite'
import { AVATAR_FILL, AVATAR_OUTLINE, AVATAR_VIEWBOX, GLASSES_DOWN_FILL, MOUTH_FILLS, SWEAT_FILL } from './avatar-sprite'
import styles from './Agent.module.scss'

const COLOR_CLASS: Record<string, string | undefined> = {
  h: styles.hair,
  F: styles.hairLight,
  f: styles.fade,
  s: styles.skin,
  S: styles.shade,
  d: styles.skinDark,
  k: styles.ink,
  g: styles.lens,
  l: styles.lensDark,
  G: styles.shine,
  b: styles.beard,
  B: styles.stubble,
  m: styles.mouth,
  w: styles.white,
  t: styles.tee,
  T: styles.teeShade,
  x: styles.accent,
  p: styles.metal,
  r: styles.sole,
  q: styles.tongue,
}

function Rects({ runs, colored }: { runs: readonly Run[]; colored: boolean }) {
  return runs.map((run) => (
    <rect key={`${run.x}:${run.y}`} x={run.x} y={run.y} width={run.w} height={1} className={colored ? COLOR_CLASS[run.c] : undefined} />
  ))
}

const WAVES: ReadonlyArray<[number, number, number]> = [
  [-2, 12, 1],
  [-3, 13, 3],
  [-2, 16, 1],
  [33, 12, 1],
  [34, 13, 3],
  [33, 16, 1],
]

export const AgentAvatar = memo(function AgentAvatar({ figureRef }: { figureRef?: Ref<HTMLDivElement> }) {
  const { x, y, width, height } = AVATAR_VIEWBOX
  return (
    <div ref={figureRef} className={styles.figure} data-mouth="closed" data-cw-agent-avatar="">
      <svg className={styles.sprite} viewBox={`${x} ${y} ${width} ${height}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
        <g className={styles.outline}>
          <Rects runs={AVATAR_OUTLINE} colored={false} />
        </g>
        <g>
          <Rects runs={AVATAR_FILL} colored />
        </g>
        {MOUTH_FILLS.map((mouth) => (
          <g key={mouth.name} className={styles.mouthFrame} data-frame={mouth.name}>
            <Rects runs={mouth.runs} colored />
          </g>
        ))}
        <g className={styles.glassesDown}>
          <Rects runs={GLASSES_DOWN_FILL} colored />
        </g>
        <g className={styles.sweat}>
          <Rects runs={SWEAT_FILL} colored />
        </g>
        <g className={styles.waves}>
          {WAVES.map(([left, top, tall]) => (
            <rect key={`${left}:${top}`} x={left} y={top} width={1} height={tall} />
          ))}
        </g>
        <g className={styles.dots}>
          <rect x={27} y={-6} width={2} height={2} />
          <rect x={30} y={-6} width={2} height={2} />
          <rect x={33} y={-6} width={2} height={2} />
        </g>
      </svg>
    </div>
  )
})
