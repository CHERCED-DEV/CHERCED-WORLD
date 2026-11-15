import { describe, expect, it } from 'vitest'
import { DIAGRAM_MAX_NODES, diagramMermaid, layoutDiagram, NODE_H, NODE_W, parseDecision, parseDiagram, SIMULATOR_DECISION, SIMULATOR_DIAGRAM } from '@/lib/ai/agent/design'
import { interviewActa, interviewBlock } from '@/lib/ai/agent/interview'
import { createToolRunner, DECISION_TOOL, DIAGRAM_TOOL } from '@/lib/ai/agent/tools'

describe('diseño de sistemas en vivo (034)', () => {
  it('FR-3401 y FR-3402: el diagrama se valida y uno inválido se rechaza con el motivo', () => {
    expect(parseDiagram(SIMULATOR_DIAGRAM).ok).toBe(true)
    const repeated = parseDiagram({ nodos: [{ id: 'a', etiqueta: 'A', tipo: 'servicio' }, { id: 'a', etiqueta: 'B', tipo: 'datos' }] })
    expect(repeated).toMatchObject({ ok: false })
    expect(parseDiagram({ nodos: [{ id: 'a', etiqueta: 'A', tipo: 'servicio' }], conexiones: [{ de: 'a', a: 'zz' }] })).toMatchObject({ ok: false })
    const many = Array.from({ length: DIAGRAM_MAX_NODES + 1 }, (_, index) => ({ id: `n${index}`, etiqueta: `N${index}`, tipo: 'servicio' }))
    expect(parseDiagram({ nodos: many }).ok).toBe(false)
    expect(parseDiagram({ nodos: [{ id: 'a', etiqueta: 'A', tipo: 'inventado' }] })).toMatchObject({ ok: true, diagram: { nodos: [{ tipo: 'servicio' }] } })
  })

  it('el acomodo pone cada nodo después de los que lo alimentan y sin encimarse', () => {
    const { nodes, width, height } = layoutDiagram(SIMULATOR_DIAGRAM)
    const at = new Map(nodes.map((node) => [node.id, node]))
    for (const edge of SIMULATOR_DIAGRAM.conexiones) expect(at.get(edge.a)!.layer).toBeGreaterThan(at.get(edge.de)!.layer)
    for (const a of nodes)
      for (const b of nodes)
        if (a !== b) expect(Math.abs(a.x - b.x) >= NODE_W || Math.abs(a.y - b.y) >= NODE_H, `${a.id} y ${b.id}`).toBe(true)
    for (const node of nodes) {
      expect(node.x + NODE_W).toBeLessThanOrEqual(width)
      expect(node.y + NODE_H).toBeLessThanOrEqual(height)
    }
  })

  it('las herramientas devuelven el diagrama y la decisión, o un error al agente', async () => {
    const run = createToolRunner({ lang: 'es', index: async () => ({ version: 1, lang: 'es', docs: [], facts: {} }) as never, navigate: () => {} })
    const good = await run({ id: '1', name: DIAGRAM_TOOL, args: SIMULATOR_DIAGRAM as never })
    expect(good.effect).toMatchObject({ kind: 'diagram' })
    const bad = await run({ id: '2', name: DIAGRAM_TOOL, args: { nodos: [] } })
    expect(bad.response.response.ok).toBe(false)
    expect(bad.effect).toBeNull()
    const decision = await run({ id: '3', name: DECISION_TOOL, args: { decision: 'Cola', por_que: 'Desacopla', sacrificio: 'Más piezas' } })
    expect(decision.effect).toEqual({ kind: 'decision', decision: { decision: 'Cola', why: 'Desacopla', tradeoff: 'Más piezas' } })
    expect(parseDecision({ decision: 'x' })).toBeNull()
  })

  it('la instrucción de la pista pide alcance, diagrama completo y decisiones', () => {
    const block = interviewBlock('design', 'Camilo')
    expect(block).toMatch(/preguntas de alcance/)
    expect(block).toContain(DIAGRAM_TOOL)
    expect(block).toContain(DECISION_TOOL)
  })

  it('FR-3403: el acta trae las decisiones y el diagrama en Mermaid', () => {
    const mermaid = diagramMermaid(SIMULATOR_DIAGRAM)
    expect(mermaid).toMatch(/^graph LR/)
    expect(mermaid).toContain('subgraph nucleo["Núcleo"]')
    expect(mermaid).toContain('cliente -->|GET /x7| cdn')
    const acta = interviewActa({ lang: 'es', track: 'design', startedAt: 0, endedAt: 60_000, turns: [], sources: [], origin: 'https://x.test', diagram: SIMULATOR_DIAGRAM, decisions: [SIMULATOR_DECISION] })
    expect(acta).toContain('## Decisiones')
    expect(acta).toContain('```mermaid')
  })
})
