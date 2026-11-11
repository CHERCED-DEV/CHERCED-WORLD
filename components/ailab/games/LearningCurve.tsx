import styles from './Rally.module.scss'

export type CurveLabels = {
  title: string
  axis: string
  empty: string
  summary: string | null
}

export type LearningCurveProps = { points: readonly number[]; labels: CurveLabels; smooth?: number }

const VIEW = { width: 320, height: 132, left: 34, right: 8, top: 10, bottom: 18 }

export function rolling(points: readonly number[], window: number): number[] {
  return points.map((_, index) => {
    const slice = points.slice(Math.max(0, index - window + 1), index + 1)
    return slice.reduce((sum, value) => sum + value, 0) / slice.length
  })
}

export function LearningCurve({ points, labels, smooth = 5 }: LearningCurveProps) {
  const innerW = VIEW.width - VIEW.left - VIEW.right
  const innerH = VIEW.height - VIEW.top - VIEW.bottom
  const x = (index: number) => VIEW.left + (points.length <= 1 ? innerW : (index / (points.length - 1)) * innerW)
  const y = (value: number) => VIEW.top + (1 - value) * innerH
  const trend = rolling(points, smooth)
  const line = trend.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ')
  const last = trend.at(-1)

  return (
    <figure className={styles.curve} data-cw-rally-curve="" data-points={points.length}>
      <figcaption className={styles.panelTitle}>{labels.title}</figcaption>
      <svg className={styles.curveSvg} viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} aria-hidden="true" focusable="false">
        {[0, 0.5, 1].map((value) => (
          <g key={value}>
            <line className={styles.grid} x1={VIEW.left} x2={VIEW.width - VIEW.right} y1={y(value)} y2={y(value)} />
            <text className={styles.tick} x={VIEW.left - 6} y={y(value)} textAnchor="end" dominantBaseline="middle">
              {Math.round(value * 100)}%
            </text>
          </g>
        ))}
        <text className={styles.tick} x={VIEW.left} y={VIEW.height - 4}>
          {labels.axis}
        </text>
        {points.map((value, index) => (
          <circle key={index} className={styles.dot} cx={x(index)} cy={y(value)} r={1.8} />
        ))}
        {points.length > 1 ? <polyline className={styles.trend} points={line} /> : null}
        {last !== undefined ? <circle className={styles.head} cx={x(points.length - 1)} cy={y(last)} r={3.4} /> : null}
      </svg>
      <p className={styles.curveAxis} data-cw-rally-axis="">
        0–100% · {labels.axis}
      </p>
      <p className={styles.summary} data-cw-rally-summary="">
        {labels.summary ?? labels.empty}
      </p>
    </figure>
  )
}
