import { z } from 'zod'
import { NEW_PIECE, UI_PIECE_IDS } from '@/content/ailab/ui-pieces'
import type { Locale } from '@/lib/i18n/config'

export const SHOT_MAX_NODES = 40

export const SHOT_GRID = 32

export const SHOT_IMAGE_MAX_CHARS = 4_000_000

export const SHOT_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const SHOT_FILE_MAX_BYTES = 5 * 1024 * 1024

const cell = z.number().transform((value) => Math.min(SHOT_GRID, Math.max(0, Math.round(value))))

const box = z
  .object({ x: cell, y: cell, an: cell, al: cell })
  .transform((value) => {
    const x = Math.min(value.x, SHOT_GRID - 1)
    const y = Math.min(value.y, SHOT_GRID - 1)
    return { x, y, an: Math.max(1, Math.min(value.an, SHOT_GRID - x)), al: Math.max(1, Math.min(value.al, SHOT_GRID - y)) }
  })

const node = z.object({
  id: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,39}$/),
  nombre: z.string().trim().min(1).max(60),
  pieza: z.string().refine((value) => value === NEW_PIECE || UI_PIECE_IDS.includes(value), 'pieza desconocida'),
  padre: z.string().trim().max(40),
  props: z.string().trim().max(160),
  caja: box,
})

export const shotSchema = z
  .object({
    resumen: z.string().trim().min(1).max(400),
    nodos: z.array(node).min(1).max(SHOT_MAX_NODES),
    huecos: z.array(z.object({ que: z.string().trim().min(1).max(100), por_que: z.string().trim().max(240) })).max(10),
  })
  .superRefine((value, context) => {
    const ids = new Set<string>()
    for (const item of value.nodos) {
      if (ids.has(item.id)) context.addIssue({ code: 'custom', message: `id repetido: ${item.id}` })
      ids.add(item.id)
    }
    const parents = new Map(value.nodos.map((item) => [item.id, item.padre]))
    for (const item of value.nodos) {
      if (item.padre && (!ids.has(item.padre) || item.padre === item.id)) context.addIssue({ code: 'custom', message: `padre inválido: ${item.id}` })
      let current = item.padre
      for (let steps = 0; current && steps <= SHOT_MAX_NODES; steps += 1) {
        if (current === item.id) {
          context.addIssue({ code: 'custom', message: `ciclo en ${item.id}` })
          break
        }
        current = parents.get(current) ?? ''
      }
    }
  })

export type ShotResult = z.infer<typeof shotSchema>

export type ShotNode = ShotResult['nodos'][number]

export type ShotTreeNode = ShotNode & { hijos: ShotTreeNode[] }

export function shotTree(result: Pick<ShotResult, 'nodos'>): ShotTreeNode[] {
  const byId = new Map<string, ShotTreeNode>(result.nodos.map((item) => [item.id, { ...item, hijos: [] }]))
  const roots: ShotTreeNode[] = []
  for (const item of byId.values()) {
    const parent = item.padre ? byId.get(item.padre) : undefined
    if (parent) parent.hijos.push(item)
    else roots.push(item)
  }
  return roots
}

const SAMPLE = {
  es: {
    resumen: 'Un panel de administración: encabezado con la cuenta, navegación lateral y una lista de usuarios con filtros y una acción por fila.',
    nombres: ['Encabezado', 'Logo', 'Cuenta', 'Navegación lateral', 'Contenido', 'Título «Usuarios»', 'Filtros', 'Tabla de usuarios', 'Acción «Manejar»'],
    props: ['', 'iniciales sobre círculo', 'variant="ghost" con avatar', 'vertical, activa «Usuarios»', '', 'nivel 1', 'tipo, estado, validación y fecha', 'columnas ordenables', 'variant="ghost" size="sm"'],
    huecos: [
      { que: 'Tabla de datos', por_que: 'El sitio no tiene una tabla con encabezados y columnas ordenables; hoy las listas son tarjetas o filas sueltas.' },
      { que: 'Avatar con insignia', por_que: 'No hay una pieza de avatar con contador; la cuenta se muestra como texto y enlace.' },
    ],
  },
  en: {
    resumen: 'An admin panel: a header with the account, side navigation and a user list with filters and one action per row.',
    nombres: ['Header', 'Logo', 'Account', 'Side navigation', 'Content', 'Title “Users”', 'Filters', 'Users table', 'Action “Manage”'],
    props: ['', 'initials on a circle', 'variant="ghost" with avatar', 'vertical, “Users” active', '', 'level 1', 'type, status, validation and date', 'sortable columns', 'variant="ghost" size="sm"'],
    huecos: [
      { que: 'Data table', por_que: 'The site has no table with headers and sortable columns; lists today are cards or loose rows.' },
      { que: 'Avatar with badge', por_que: 'There is no avatar piece with a counter; the account shows as text and a link.' },
    ],
  },
} as const

const SAMPLE_NODES = [
  { id: 'encabezado', pieza: 'panel-header', padre: '', caja: { x: 0, y: 0, an: 32, al: 5 } },
  { id: 'logo', pieza: 'icon', padre: 'encabezado', caja: { x: 1, y: 1, an: 3, al: 3 } },
  { id: 'cuenta', pieza: 'button', padre: 'encabezado', caja: { x: 25, y: 1, an: 6, al: 3 } },
  { id: 'navegacion', pieza: 'nav-tabs', padre: '', caja: { x: 0, y: 5, an: 7, al: 27 } },
  { id: 'contenido', pieza: 'glass-surface', padre: '', caja: { x: 7, y: 5, an: 25, al: 27 } },
  { id: 'titulo', pieza: 'section-title', padre: 'contenido', caja: { x: 8, y: 7, an: 8, al: 2 } },
  { id: 'filtros', pieza: 'filter-bar', padre: 'contenido', caja: { x: 8, y: 10, an: 18, al: 2 } },
  { id: 'tabla', pieza: NEW_PIECE, padre: 'contenido', caja: { x: 8, y: 13, an: 23, al: 8 } },
  { id: 'accion', pieza: 'button', padre: 'tabla', caja: { x: 28, y: 13, an: 3, al: 8 } },
] as const

export function simulatedShot(lang: Locale): ShotResult {
  const copy = SAMPLE[lang]
  return shotSchema.parse({
    resumen: copy.resumen,
    nodos: SAMPLE_NODES.map((item, at) => ({ ...item, caja: { ...item.caja }, nombre: copy.nombres[at], props: copy.props[at] })),
    huecos: copy.huecos.map((gap) => ({ ...gap })),
  })
}
