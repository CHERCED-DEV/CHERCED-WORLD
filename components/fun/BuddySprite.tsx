import { memo } from 'react'
import { fillRuns, outlineRuns, OVERLAYS, PART_ORDER, PARTS, SPRITE_SCALE, SPRITE_VIEWBOX, type OverlayName, type Run } from './sprite'
import styles from './Buddy.module.scss'

const COLOR_CLASS: Record<string, string | undefined> = {
  h: styles.hair,
  b: styles.beard,
  B: styles.stubble,
  f: styles.fade,
  s: styles.skin,
  S: styles.shade,
  k: styles.ink,
  g: styles.lens,
  G: styles.shine,
  t: styles.tee,
  w: styles.white,
  m: styles.mouth,
}

const OUTLINES = PART_ORDER.map((name) => ({ name, runs: outlineRuns(PARTS[name]) }))

const FILLS = PART_ORDER.map((name) => ({ name, runs: fillRuns(PARTS[name]) }))

const EXTRAS = (Object.keys(OVERLAYS) as OverlayName[]).map((name) => ({ name, runs: fillRuns(OVERLAYS[name]) }))

function Rects({ runs, colored }: { runs: readonly Run[]; colored: boolean }) {
  return runs.map((run) => (
    <rect key={`${run.x}:${run.y}`} x={run.x} y={run.y} width={run.w} height={1} className={colored ? COLOR_CLASS[run.c] : undefined} />
  ))
}

export const BuddySprite = memo(function BuddySprite() {
  const { x, y, width, height } = SPRITE_VIEWBOX
  return (
    <svg
      className={styles.sprite}
      viewBox={`${x} ${y} ${width} ${height}`}
      width={width * SPRITE_SCALE}
      height={height * SPRITE_SCALE}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.outline}>
        {OUTLINES.map((part) => (
          <g key={part.name} className={styles[part.name]}>
            <Rects runs={part.runs} colored={false} />
          </g>
        ))}
      </g>
      <g>
        {FILLS.map((part) => (
          <g key={part.name} className={styles[part.name]}>
            <Rects runs={part.runs} colored />
            {part.name === 'head'
              ? EXTRAS.map((extra) => (
                  <g key={extra.name} className={styles[extra.name]}>
                    <Rects runs={extra.runs} colored />
                  </g>
                ))
              : null}
          </g>
        ))}
      </g>
    </svg>
  )
})
