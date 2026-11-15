'use client'

import { useId, useRef } from 'react'
import { AdrCards, type AdrLabels } from '@/components/ui/AdrCards'
import { Button } from '@/components/ui/Button'
import { layoutDiagram, NODE_H, NODE_W, type DesignDecision, type Diagram, type NodeKind } from '@/lib/ai/agent/design'
import { downloadText } from '@/lib/ailab/skill/download'
import styles from './Agent.module.scss'

export type DesignBoardCopy = { title: string; empty: string; decisions: string; exportSvg: string; exportMd: string; adr: AdrLabels; file: string }

const KIND_FILL: Record<NodeKind, string> = {
  cliente: '#1f2937',
  servicio: '#0b3d2c',
  datos: '#2b2140',
  cola: '#3d2a0b',
  cache: '#0b2e3d',
  externo: '#262626',
}

function decisionsMarkdown(title: string, decisions: readonly DesignDecision[], labels: AdrLabels): string {
  return [
    `# ${title}`,
    '',
    ...decisions.flatMap((item, index) => [`## ${index + 1}. ${item.decision}`, '', `- **${labels.why}:** ${item.why}`, `- **${labels.tradeoff}:** ${item.tradeoff}`, '']),
  ].join('\n')
}

export function DesignBoard({ diagram, decisions, copy }: { diagram: Diagram | null; decisions: readonly DesignDecision[]; copy: DesignBoardCopy }) {
  const markerId = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement>(null)
  const layout = diagram ? layoutDiagram(diagram) : null
  const byId = new Map(layout?.nodes.map((node) => [node.id, node]) ?? [])

  const exportSvg = () => {
    const svg = svgRef.current
    if (!svg) return
    downloadText(`${copy.file}.svg`, `<?xml version="1.0" encoding="UTF-8"?>\n${svg.outerHTML}`, 'image/svg+xml')
  }

  return (
    <section className={styles.design} aria-label={copy.title} data-cw-agent-design="">
      <p className={styles.label}>{copy.title}</p>
      {layout && diagram ? (
        <div className={styles.designCanvas}>
          <svg
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            width={layout.width}
            height={layout.height}
            role="img"
            aria-label={diagram.nodos.map((node) => node.etiqueta).join(', ')}
            data-cw-agent-diagram=""
          >
            <defs>
              <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill="#25ed9e" />
              </marker>
            </defs>
            <rect width={layout.width} height={layout.height} fill="#050505" />
            {diagram.grupos.map((group) => {
              const members = group.nodos.map((member) => byId.get(member)).filter((node) => node !== undefined)
              if (members.length === 0) return null
              const x = Math.min(...members.map((node) => node.x)) - 10
              const y = Math.min(...members.map((node) => node.y)) - 22
              const right = Math.max(...members.map((node) => node.x + NODE_W)) + 10
              const bottom = Math.max(...members.map((node) => node.y + NODE_H)) + 10
              return (
                <g key={group.id}>
                  <rect x={x} y={y} width={right - x} height={bottom - y} rx={10} fill="none" stroke="#25ed9e" strokeDasharray="6 5" opacity={0.6} />
                  <text x={x + 8} y={y + 14} fill="#25ed9e" fontSize={11} fontFamily="Montserrat, sans-serif">
                    {group.etiqueta}
                  </text>
                </g>
              )
            })}
            {diagram.conexiones.map((edge, index) => {
              const from = byId.get(edge.de)
              const to = byId.get(edge.a)
              if (!from || !to) return null
              const forward = to.x > from.x
              const x1 = forward ? from.x + NODE_W : from.x + NODE_W / 2
              const y1 = forward ? from.y + NODE_H / 2 : from.y + NODE_H
              const x2 = forward ? to.x : to.x + NODE_W / 2
              const y2 = forward ? to.y + NODE_H / 2 : to.y
              return (
                <g key={`${edge.de}-${edge.a}-${index}`}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#25ed9e" strokeWidth={1.6} markerEnd={`url(#${markerId})`} />
                  {edge.etiqueta ? (
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 5} fill="#cfcfcf" fontSize={10} textAnchor="middle" fontFamily="Montserrat, sans-serif">
                      {edge.etiqueta}
                    </text>
                  ) : null}
                </g>
              )
            })}
            {layout.nodes.map((node) => (
              <g key={node.id} data-cw-diagram-node={node.id}>
                <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx={node.tipo === 'datos' ? 18 : 8} fill={KIND_FILL[node.tipo]} stroke="#f4f4f4" strokeWidth={1.2} />
                <text x={node.x + NODE_W / 2} y={node.y + 24} fill="#f4f4f4" fontSize={12} fontWeight={600} textAnchor="middle" fontFamily="Montserrat, sans-serif">
                  {node.etiqueta.length > 22 ? `${node.etiqueta.slice(0, 21)}…` : node.etiqueta}
                </text>
                <text x={node.x + NODE_W / 2} y={node.y + 41} fill="#9a9a9a" fontSize={10} textAnchor="middle" fontFamily="Montserrat, sans-serif">
                  {node.tipo}
                </text>
              </g>
            ))}
          </svg>
        </div>
      ) : (
        <p className={styles.note}>{copy.empty}</p>
      )}
      {decisions.length ? (
        <>
          <p className={styles.label}>{copy.decisions}</p>
          <AdrCards cards={[...decisions]} labels={copy.adr} columns={1} />
        </>
      ) : null}
      {layout || decisions.length ? (
        <div className={styles.row}>
          {layout ? (
            <Button variant="ghost" size="sm" onClick={exportSvg} data-cw-agent-design-svg="">
              {copy.exportSvg}
            </Button>
          ) : null}
          {decisions.length ? (
            <Button variant="ghost" size="sm" onClick={() => downloadText(`${copy.file}-decisiones.md`, decisionsMarkdown(copy.title, decisions, copy.adr))}>
              {copy.exportMd}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
