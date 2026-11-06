import type { CSSProperties } from 'react'
import { cx } from '@/components/ui/cx'
import type { LineLayout } from './model'
import styles from './Synergos.module.scss'

export type AssemblyLineLabels = { title: string; desc: string; director: string; release: string; scope: string }

export type AssemblyLineProps = { layout: LineLayout; variant: 'wide' | 'tall'; labels: AssemblyLineLabels }

function width(value: number): number {
  return Math.round(value * 10) / 10
}

export function AssemblyLine({ layout, variant, labels }: AssemblyLineProps) {
  const titleId = `synergos-line-${variant}-title`
  const descId = `synergos-line-${variant}-desc`
  const { director, release } = layout
  return (
    <svg
      className={cx(styles.svg, variant === 'wide' ? styles.wide : styles.tall)}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      data-cw-line-svg={variant}
    >
      <title id={titleId}>{labels.title}</title>
      <desc id={descId}>{labels.desc}</desc>
      {layout.trunk ? <path d={layout.trunk} className={styles.trunk} /> : null}
      {layout.lanes.map((lane) => (
        <g key={lane.id} className={styles.lane} data-state={lane.state} data-cw-lane={lane.id}>
          <path d={lane.path} className={styles.lanePath} />
          {lane.pulse ? (
            <path d={lane.path} className={styles.pulse} style={{ animationDelay: `${lane.delay}s` } as CSSProperties} data-cw-pulse="" />
          ) : null}
          <text x={lane.labelX} y={lane.labelY} className={styles.laneLabel}>
            {lane.label}
          </text>
          <rect x={lane.barX} y={lane.barY} width={lane.barWidth} height={3} rx={1.5} className={styles.barTrack} />
          <rect x={lane.barX} y={lane.barY} width={width(lane.barWidth * lane.ratio)} height={3} rx={1.5} className={styles.barFill} />
          <text x={lane.statusX} y={lane.statusY} className={styles.laneState}>
            {lane.status}
          </text>
        </g>
      ))}
      <path d={layout.out} className={styles.outPath} />
      <path d={layout.out} className={styles.pulse} data-cw-pulse="" />
      <g className={styles.director} data-cw-director="">
        <circle cx={director.cx} cy={director.cy} r={director.r} className={styles.directorDot} />
        <text x={director.cx} y={director.cy + 4} textAnchor="middle" className={styles.directorText}>
          {labels.director}
        </text>
      </g>
      <rect x={release.x} y={release.y} width={release.width} height={release.height} rx={14} className={styles.release} />
      <text x={release.x + release.width / 2} y={release.y + release.height / 2 - 4} textAnchor="middle" className={styles.releaseText}>
        {labels.release}
      </text>
      <text x={release.x + release.width / 2} y={release.y + release.height / 2 + 14} textAnchor="middle" className={styles.releaseScope}>
        {labels.scope}
      </text>
    </svg>
  )
}
