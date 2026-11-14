import { createGlassBox, isIndexedDoc, type GlassBox } from '@/lib/ailab/search/glassbox'
import type { Locale } from '@/lib/i18n/config'
import type { SearchIndex } from '@/lib/search/types'
import { AGENT_FRAGMENT_MAX, AGENT_SEARCH_LIMIT } from './config'

export const SEARCH_TOOL = 'buscar_en_el_sitio'

export const OPEN_TOOL = 'abrir_pagina'

export const AGENT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: SEARCH_TOOL,
        description:
          'Busca en el contenido público del sitio (proyectos, posts, servicios, carrera, habilidades, Synergos y el AI Lab). Devuelve fragmentos con su título y su ruta. Úsala antes de responder detalles que no estén en el mapa.',
        parameters: {
          type: 'OBJECT',
          properties: { consulta: { type: 'STRING', description: 'Palabras clave de lo que el visitante quiere saber.' } },
          required: ['consulta'],
        },
      },
      {
        name: OPEN_TOOL,
        description:
          'Lleva al visitante a una página del sitio. Úsala solo cuando el visitante pida ver algo. La ruta debe salir del mapa del sitio o de una búsqueda.',
        parameters: {
          type: 'OBJECT',
          properties: { ruta: { type: 'STRING', description: 'Ruta del sitio, por ejemplo /es/portfolio/12.' } },
          required: ['ruta'],
        },
      },
    ],
  },
] as const

export type AgentToolCall = { id: string; name: string; args: Record<string, unknown> }

export type AgentToolResponse = { id: string; name: string; response: Record<string, unknown> }

export type AgentSearchHit = { titulo: string; ruta: string; tipo: string; texto: string }

export type AgentToolContext = {
  lang: Locale
  index: () => Promise<SearchIndex>
  navigate: (path: string) => void
}

export type AgentToolEffect = { kind: 'search'; query: string; hits: AgentSearchHit[] } | { kind: 'open'; path: string } | null

function text(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function pathOf(url: string): string | null {
  if (!url.startsWith('/') || url.startsWith('//')) return null
  return url.split('#')[0]!.split('?')[0]!.replace(/\/+$/, '') || '/'
}

export const EXTRA_SECTIONS = ['/ai-lab', '/synergos', '/blog/catalog'] as const

export function sitePaths(index: SearchIndex): Set<string> {
  const paths = new Set<string>([`/${index.lang}`, ...EXTRA_SECTIONS.map((section) => `/${index.lang}${section}`)])
  const architecture = index.facts.architecture ? pathOf(index.facts.architecture.url) : null
  if (architecture) paths.add(architecture)
  for (const doc of index.docs) {
    const path = pathOf(doc.url)
    if (path) paths.add(path)
  }
  for (const page of Object.values(index.facts.pages)) {
    const path = pathOf(page.url)
    if (path) paths.add(path)
  }
  for (const project of index.facts.projects) {
    const path = pathOf(project.url)
    if (path) paths.add(path)
  }
  for (const post of index.facts.posts) {
    const path = pathOf(post.url)
    if (path) paths.add(path)
  }
  return paths
}

export function safeSitePath(requested: unknown, index: SearchIndex, origin?: string): string | null {
  let value = text(requested, 300)
  if (!value) return null
  if (origin && value.startsWith(origin)) value = value.slice(origin.length) || '/'
  const path = pathOf(value)
  if (!path || !sitePaths(index).has(path)) return null
  const hash = value.includes('#') ? value.slice(value.indexOf('#')) : ''
  return /^#[\w-]{1,80}$/.test(hash) ? `${path}${hash}` : path
}

export function searchSite(box: GlassBox, query: string): AgentSearchHit[] {
  return box
    .search(query, { limit: AGENT_SEARCH_LIMIT })
    .results.filter((result) => isIndexedDoc(result.doc))
    .map((result) => ({
      titulo: result.doc.title,
      ruta: result.doc.url,
      tipo: result.doc.kind,
      texto: result.doc.text.slice(0, AGENT_FRAGMENT_MAX),
    }))
}

export function createToolRunner(context: AgentToolContext, origin?: string) {
  let box: GlassBox | null = null
  let loaded: SearchIndex | null = null
  async function ready(): Promise<{ box: GlassBox; index: SearchIndex }> {
    if (!loaded || !box) {
      loaded = await context.index()
      box = createGlassBox(loaded)
    }
    return { box, index: loaded }
  }
  return async function run(call: AgentToolCall): Promise<{ response: AgentToolResponse; effect: AgentToolEffect }> {
    const { box: search, index } = await ready()
    if (call.name === SEARCH_TOOL) {
      const query = text(call.args.consulta)
      const hits = query ? searchSite(search, query) : []
      return {
        response: { id: call.id, name: call.name, response: { resultados: hits, total: hits.length } },
        effect: { kind: 'search', query, hits },
      }
    }
    if (call.name === OPEN_TOOL) {
      const path = safeSitePath(call.args.ruta, index, origin)
      if (!path) return { response: { id: call.id, name: call.name, response: { ok: false, motivo: 'ruta_desconocida' } }, effect: null }
      context.navigate(path)
      return { response: { id: call.id, name: call.name, response: { ok: true, ruta: path } }, effect: { kind: 'open', path } }
    }
    return { response: { id: call.id, name: call.name, response: { error: 'herramienta_desconocida' } }, effect: null }
  }
}
