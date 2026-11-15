import { z } from 'zod'

export const DIAGRAM_MAX_NODES = 30

export const DIAGRAM_MAX_GROUPS = 5

export const NODE_KINDS = ['cliente', 'servicio', 'datos', 'cola', 'cache', 'externo'] as const

export type NodeKind = (typeof NODE_KINDS)[number]

const id = z.string().trim().min(1).max(40)
const label = z.string().trim().min(1).max(60)

export function diagramSchemaWith(maxNodes: number) {
  return z
    .object({
      nodos: z
        .array(z.object({ id, etiqueta: label, tipo: z.enum(NODE_KINDS).catch('servicio') }))
        .min(1)
        .max(maxNodes),
      conexiones: z.array(z.object({ de: id, a: id, etiqueta: z.string().trim().max(40).optional() })).max(maxNodes * 3).default([]),
      grupos: z
        .array(z.object({ id, etiqueta: label, nodos: z.array(id).max(maxNodes) }))
        .max(DIAGRAM_MAX_GROUPS)
        .default([]),
    })
    .superRefine(checkReferences)
}

function checkReferences(diagram: { nodos: Array<{ id: string }>; conexiones: Array<{ de: string; a: string }>; grupos: Array<{ id: string; nodos: string[] }> }, context: z.RefinementCtx) {
  const ids = new Set<string>()
  for (const node of diagram.nodos) {
    if (ids.has(node.id)) context.addIssue({ code: 'custom', message: `id repetido: ${node.id}` })
    ids.add(node.id)
  }
  for (const edge of diagram.conexiones)
    if (!ids.has(edge.de) || !ids.has(edge.a)) context.addIssue({ code: 'custom', message: `conexión a un nodo que no existe: ${edge.de} → ${edge.a}` })
  for (const group of diagram.grupos)
    for (const member of group.nodos) if (!ids.has(member)) context.addIssue({ code: 'custom', message: `grupo ${group.id} con un nodo que no existe: ${member}` })
}

export const diagramSchema = z
  .object({
    nodos: z
      .array(z.object({ id, etiqueta: label, tipo: z.enum(NODE_KINDS).catch('servicio') }))
      .min(1)
      .max(DIAGRAM_MAX_NODES),
    conexiones: z.array(z.object({ de: id, a: id, etiqueta: z.string().trim().max(40).optional() })).max(80).default([]),
    grupos: z
      .array(z.object({ id, etiqueta: label, nodos: z.array(id).max(DIAGRAM_MAX_NODES) }))
      .max(DIAGRAM_MAX_GROUPS)
      .default([]),
  })
  .superRefine((diagram, context) => {
    const ids = new Set<string>()
    for (const node of diagram.nodos) {
      if (ids.has(node.id)) context.addIssue({ code: 'custom', message: `id repetido: ${node.id}` })
      ids.add(node.id)
    }
    for (const edge of diagram.conexiones)
      if (!ids.has(edge.de) || !ids.has(edge.a)) context.addIssue({ code: 'custom', message: `conexión a un nodo que no existe: ${edge.de} → ${edge.a}` })
    for (const group of diagram.grupos)
      for (const member of group.nodos) if (!ids.has(member)) context.addIssue({ code: 'custom', message: `grupo ${group.id} con un nodo que no existe: ${member}` })
  })

export type Diagram = z.infer<typeof diagramSchema>

export type DesignDecision = { decision: string; why: string; tradeoff: string }

export const decisionSchema = z.object({
  decision: z.string().trim().min(1).max(160),
  por_que: z.string().trim().min(1).max(300),
  sacrificio: z.string().trim().min(1).max(300),
})

export function parseDiagram(value: unknown): { ok: true; diagram: Diagram } | { ok: false; error: string } {
  const parsed = diagramSchema.safeParse(value)
  if (parsed.success) return { ok: true, diagram: parsed.data }
  return { ok: false, error: parsed.error.issues.map((issue) => issue.message).slice(0, 3).join('; ') }
}

export function parseDecision(value: unknown): DesignDecision | null {
  const parsed = decisionSchema.safeParse(value)
  return parsed.success ? { decision: parsed.data.decision, why: parsed.data.por_que, tradeoff: parsed.data.sacrificio } : null
}

export type PlacedNode = Diagram['nodos'][number] & { x: number; y: number; layer: number }

export const NODE_W = 150

export const NODE_H = 54

const GAP_X = 70

const GAP_Y = 30

const PAD = 24

export function layoutDiagram(diagram: Diagram): { nodes: PlacedNode[]; width: number; height: number } {
  const ids = diagram.nodos.map((node) => node.id)
  const incoming = new Map(ids.map((nodeId) => [nodeId, 0]))
  for (const edge of diagram.conexiones) incoming.set(edge.a, (incoming.get(edge.a) ?? 0) + 1)
  const layer = new Map<string, number>()
  const queue = ids.filter((nodeId) => (incoming.get(nodeId) ?? 0) === 0)
  for (const start of queue.length ? queue : [ids[0]!]) layer.set(start, 0)
  for (let pass = 0; pass < ids.length; pass++) {
    let changed = false
    for (const edge of diagram.conexiones) {
      const from = layer.get(edge.de)
      if (from === undefined || edge.de === edge.a) continue
      const next = from + 1
      if ((layer.get(edge.a) ?? -1) < next && next < ids.length) {
        layer.set(edge.a, next)
        changed = true
      }
    }
    if (!changed) break
  }
  for (const nodeId of ids) if (!layer.has(nodeId)) layer.set(nodeId, 0)
  const columns = new Map<number, string[]>()
  for (const nodeId of ids) {
    const column = layer.get(nodeId)!
    columns.set(column, [...(columns.get(column) ?? []), nodeId])
  }
  const maxRows = Math.max(...[...columns.values()].map((column) => column.length))
  const height = PAD * 2 + maxRows * NODE_H + (maxRows - 1) * GAP_Y
  const nodes: PlacedNode[] = diagram.nodos.map((node) => {
    const column = layer.get(node.id)!
    const members = columns.get(column)!
    const row = members.indexOf(node.id)
    const columnHeight = members.length * NODE_H + (members.length - 1) * GAP_Y
    return { ...node, layer: column, x: PAD + column * (NODE_W + GAP_X), y: (height - columnHeight) / 2 + row * (NODE_H + GAP_Y) }
  })
  const width = PAD * 2 + columns.size * NODE_W + (columns.size - 1) * GAP_X
  return { nodes, width, height }
}

function mermaidLabel(text: string): string {
  return text.replace(/["\n]/g, ' ')
}

export function diagramMermaid(diagram: Diagram): string {
  const safe = (nodeId: string) => nodeId.replace(/[^\w]/g, '_')
  const lines = ['graph LR']
  for (const group of diagram.grupos) {
    lines.push(`  subgraph ${safe(group.id)}["${mermaidLabel(group.etiqueta)}"]`)
    for (const member of group.nodos) lines.push(`    ${safe(member)}`)
    lines.push('  end')
  }
  for (const node of diagram.nodos) lines.push(`  ${safe(node.id)}["${mermaidLabel(node.etiqueta)}"]`)
  for (const edge of diagram.conexiones)
    lines.push(edge.etiqueta ? `  ${safe(edge.de)} -->|${mermaidLabel(edge.etiqueta)}| ${safe(edge.a)}` : `  ${safe(edge.de)} --> ${safe(edge.a)}`)
  return lines.join('\n')
}

export const SIMULATOR_DIAGRAM: Diagram = {
  nodos: [
    { id: 'cliente', etiqueta: 'Navegador', tipo: 'cliente' },
    { id: 'cdn', etiqueta: 'CDN', tipo: 'externo' },
    { id: 'api', etiqueta: 'API de enlaces', tipo: 'servicio' },
    { id: 'cache', etiqueta: 'Caché de redirecciones', tipo: 'cache' },
    { id: 'db', etiqueta: 'Base de enlaces', tipo: 'datos' },
    { id: 'cola', etiqueta: 'Cola de clics', tipo: 'cola' },
    { id: 'stats', etiqueta: 'Estadísticas', tipo: 'servicio' },
  ],
  conexiones: [
    { de: 'cliente', a: 'cdn', etiqueta: 'GET /x7' },
    { de: 'cdn', a: 'api' },
    { de: 'api', a: 'cache', etiqueta: 'lee primero' },
    { de: 'api', a: 'db' },
    { de: 'api', a: 'cola', etiqueta: 'clic' },
    { de: 'cola', a: 'stats' },
  ],
  grupos: [{ id: 'nucleo', etiqueta: 'Núcleo', nodos: ['api', 'cache', 'db'] }],
}

export const SIMULATOR_DECISION: DesignDecision = {
  decision: 'Leer de la caché antes que de la base',
  why: 'Las redirecciones son casi todas lecturas y repetidas: la caché quita carga a la base y baja la latencia.',
  tradeoff: 'Un enlace borrado puede seguir funcionando hasta que vence su entrada en la caché.',
}
