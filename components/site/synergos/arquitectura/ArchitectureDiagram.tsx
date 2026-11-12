import { architecture } from '@/content/synergos-architecture'
import type { Locale } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks, GridLines } from '@/components/ui/graphics'
import { cx } from '@/components/ui/cx'
import styles from './Architecture.module.scss'
import journey from '../ScrollJourney.module.scss'

type DiagramKind = keyof typeof architecture.diagrams

function lines(value: string, max = 21): string[] {
  const result: string[] = ['']
  for (const word of value.split(' ')) {
    const last = result.length - 1
    if (result[last] && result[last]!.length + word.length + 1 > max) result.push(word)
    else result[last] = [result[last], word].filter(Boolean).join(' ')
  }
  return result
}

export function ArchitectureDiagram({ kind, lang }: { kind: DiagramKind; lang: Locale }) {
  const nodes = architecture.diagrams[kind]
  const title = architecture.copy.sections[kind][lang]
  const glyphs = { recorrido: ['</>', '{ }', '<>', '↗', '◎'], contratos: ['C#', '{ }', 'TS', '✓', '↔'], islas: ['◌', '⟡', '⇄', '⌁', '⋈'] }[kind]
  const titleId = `architecture-${kind}-wide`
  return (
    <GlassSurface as="figure" className={cx(styles.diagram, journey.stage)} edge grain depth light data-cw-architecture-diagram={kind}>
      <GridLines fade="radial" /><CornerMarks />
      <figcaption className="cw-visually-hidden">{title}</figcaption>
      <svg className={cx(styles.svg, styles.wide)} viewBox="0 0 920 240" role="img" aria-labelledby={titleId} data-cw-architecture-svg="wide">
        <title id={titleId}>{title}</title>
        {nodes.map((node, index) => {
          const x = 10 + index * 182
          const y = 25
          const width = 166
          const center = x + width / 2
          return (
            <g key={node.title.en}>
              <rect className={styles.node} x={x} y={y} width={width} height={170} rx={12} />
              <text className={styles.nodeGlyph} x={center} y={y + 56} textAnchor="middle" aria-hidden="true">{glyphs[index]}</text>
              <text className={styles.number} x={x + 12} y={y + 23}>{String(index + 1).padStart(2, '0')}</text>
              <text className={styles.nodeTitle} x={center} y={y + 98} textAnchor="middle">{node.title[lang]}</text>
              <text className={styles.nodeDetail} x={center} y={y + 124} textAnchor="middle">
                {lines(node.detail[lang], 19).map((line, lineIndex) => <tspan key={line} x={center} dy={lineIndex ? 19 : 0}>{line}</tspan>)}
              </text>
              {index < nodes.length - 1 ? <path className={styles.connector} d={`M${x + width + 1} 110 h13 m-5 -4 l5 4 -5 4`} /> : null}
            </g>
          )
        })}
      </svg>
      <ol className={styles.steps} data-cw-architecture-steps="">
        {nodes.map((node, index) => <li key={node.title.en} className={styles.step} data-cw-architecture-step="">
          <span className={styles.stepGlyph} aria-hidden="true">{glyphs[index]}</span>
          <span className={styles.stepText}>
            <span className={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <strong>{node.title[lang]}</strong>
            <span>{node.detail[lang]}</span>
          </span>
        </li>)}
      </ol>
      <details className={cx(styles.details, styles.diagramText)}>
        <summary>{architecture.copy.readDiagram[lang]}</summary>
        <ol className={styles.textFlow}>{nodes.map(node => <li key={node.title.en}><strong>{node.title[lang]}</strong><span>{node.detail[lang]}</span></li>)}</ol>
      </details>
    </GlassSurface>
  )
}
