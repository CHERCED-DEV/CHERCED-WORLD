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
  return (
    <GlassSurface as="figure" className={`${styles.diagram} ${journey.stage}`} edge grain depth light data-cw-architecture-diagram={kind}>
      <GridLines fade="radial" /><CornerMarks />
      <figcaption className="cw-visually-hidden">{title}</figcaption>
      {(['wide', 'tall'] as const).map(variant => {
        const tall = variant === 'tall'
        const titleId = `architecture-${kind}-${variant}`
        return (
          <svg key={variant} className={cx(styles.svg, tall ? styles.tall : styles.wide)} viewBox={tall ? '0 0 320 840' : '0 0 920 240'} role="img" aria-labelledby={titleId} data-cw-architecture-svg={variant}>
            <title id={titleId}>{title}</title>
            {nodes.map((node, index) => {
              const x = tall ? 12 : 10 + index * 182
              const y = tall ? 10 + index * 168 : 25
              const width = tall ? 296 : 166
              const center = x + width / 2
              return (
                <g key={node.title.en}>
                  <rect className={styles.node} x={x} y={y} width={width} height={tall ? 148 : 170} rx={12} />
                  <text className={styles.nodeGlyph} x={tall ? 48 : center} y={y + (tall ? 90 : 56)} textAnchor="middle" aria-hidden="true">{glyphs[index]}</text>
                  <text className={styles.number} x={x + 12} y={y + 23}>{String(index + 1).padStart(2, '0')}</text>
                  <text className={styles.nodeTitle} x={tall ? 190 : center} y={y + (tall ? 54 : 98)} textAnchor="middle">{node.title[lang]}</text>
                  <text className={styles.nodeDetail} x={tall ? 190 : center} y={y + (tall ? 84 : 124)} textAnchor="middle">
                    {lines(node.detail[lang], tall ? 18 : 19).map((line, lineIndex) => <tspan key={line} x={tall ? 190 : center} dy={lineIndex ? 19 : 0}>{line}</tspan>)}
                  </text>
                  {index < nodes.length - 1 ? <path className={styles.connector} d={tall ? `M160 ${y + 149} v18 m-4 -5 l4 5 4 -5` : `M${x + width + 1} 110 h13 m-5 -4 l5 4 -5 4`} /> : null}
                </g>
              )
            })}
          </svg>
        )
      })}
      <details className={styles.details}>
        <summary>{architecture.copy.readDiagram[lang]}</summary>
        <ol className={styles.textFlow}>{nodes.map(node => <li key={node.title.en}><strong>{node.title[lang]}</strong><span>{node.detail[lang]}</span></li>)}</ol>
      </details>
    </GlassSurface>
  )
}
