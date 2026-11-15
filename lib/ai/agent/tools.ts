import { createGlassBox, isIndexedDoc, type GlassBox } from '@/lib/ailab/search/glassbox'
import type { Locale } from '@/lib/i18n/config'
import type { SearchIndex } from '@/lib/search/types'
import { AGENT_FRAGMENT_MAX, AGENT_SEARCH_LIMIT } from './config'
import { parseDecision, parseDiagram, type DesignDecision, type Diagram } from './design'
import type { PageContext } from './page-context'

export const SEARCH_TOOL = 'buscar_en_el_sitio'

export const OPEN_TOOL = 'abrir_pagina'

export const SOURCE_TOOL = 'mostrar_fuente'

export const DIAGRAM_TOOL = 'actualizar_diagrama'

export const DECISION_TOOL = 'registrar_decision'

export const PAGE_TOOL = 'pagina_actual'

export const HIGHLIGHT_TOOL = 'resaltar_seccion'

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
      {
        name: SOURCE_TOOL,
        description:
          'Muestra en pantalla la fuente de lo que estás diciendo: un caso, una decisión, un post o una página del sitio. Úsala en el modo entrevista cada vez que te apoyes en algo publicado. La ruta debe salir del mapa o de una búsqueda.',
        parameters: {
          type: 'OBJECT',
          properties: { ruta: { type: 'STRING', description: 'Ruta de la fuente, por ejemplo /es/portfolio/12.' } },
          required: ['ruta'],
        },
      },
      {
        name: DIAGRAM_TOOL,
        description:
          'Dibuja en pantalla el diagrama de arquitectura completo, en la pista de diseño de sistemas. Manda siempre el diagrama entero, no solo el cambio: máximo 30 nodos y 5 grupos.',
        parameters: {
          type: 'OBJECT',
          properties: {
            nodos: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, etiqueta: { type: 'STRING' }, tipo: { type: 'STRING', enum: ['cliente', 'servicio', 'datos', 'cola', 'cache', 'externo'] } }, required: ['id', 'etiqueta', 'tipo'] } },
            conexiones: { type: 'ARRAY', items: { type: 'OBJECT', properties: { de: { type: 'STRING' }, a: { type: 'STRING' }, etiqueta: { type: 'STRING' } }, required: ['de', 'a'] } },
            grupos: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, etiqueta: { type: 'STRING' }, nodos: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['id', 'etiqueta', 'nodos'] } },
          },
          required: ['nodos'],
        },
      },
      {
        name: DECISION_TOOL,
        description: 'Registra una decisión de diseño como tarjeta: qué se decidió, por qué y qué se sacrifica.',
        parameters: {
          type: 'OBJECT',
          properties: { decision: { type: 'STRING' }, por_que: { type: 'STRING' }, sacrificio: { type: 'STRING' } },
          required: ['decision', 'por_que', 'sacrificio'],
        },
      },
      {
        name: PAGE_TOOL,
        description: 'Dice en qué página del sitio está el visitante ahora: ruta, título y las secciones que se pueden señalar. Úsala cuando pregunte por "esta página" o antes de resaltar algo.',
      },
      {
        name: HIGHLIGHT_TOOL,
        description: 'Hace scroll a una sección de la página actual y la resalta un momento. Solo con un id que devolvió pagina_actual.',
        parameters: { type: 'OBJECT', properties: { id: { type: 'STRING', description: 'Id de la sección.' } }, required: ['id'] },
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
  page?: { read: () => PageContext; highlight: (id: unknown) => boolean }
}

export type AgentScoredHit = AgentSearchHit & { score: number }

export type AgentSource = { path: string; title: string }

export type AgentToolEffect =
  | { kind: 'search'; query: string; hits: AgentScoredHit[] }
  | { kind: 'open'; path: string }
  | ({ kind: 'source' } & AgentSource)
  | { kind: 'diagram'; diagram: Diagram }
  | { kind: 'decision'; decision: DesignDecision }
  | null

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

export function sourceTitle(index: SearchIndex, path: string): string {
  const bare = pathOf(path) ?? path
  const doc = index.docs.find((item) => pathOf(item.url) === bare)
  if (doc) return doc.title
  const fact = [...Object.values(index.facts.pages), ...index.facts.projects, ...index.facts.posts].find((item) => pathOf(item.url) === bare)
  return fact?.title ?? bare
}

export function searchSiteScored(box: GlassBox, query: string): AgentScoredHit[] {
  return box
    .search(query, { limit: AGENT_SEARCH_LIMIT })
    .results.filter((result) => isIndexedDoc(result.doc))
    .map((result) => ({
      titulo: result.doc.title,
      ruta: result.doc.url,
      tipo: result.doc.kind,
      texto: result.doc.text.slice(0, AGENT_FRAGMENT_MAX),
      score: Math.round(result.score * 100) / 100,
    }))
}

export function searchSite(box: GlassBox, query: string): AgentSearchHit[] {
  return searchSiteScored(box, query).map(({ score: _score, ...hit }) => hit)
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
      const hits = query ? searchSiteScored(search, query) : []
      const resultados = hits.map(({ score: _score, ...hit }) => hit)
      return {
        response: { id: call.id, name: call.name, response: { resultados, total: resultados.length } },
        effect: { kind: 'search', query, hits },
      }
    }
    if (call.name === OPEN_TOOL) {
      const path = safeSitePath(call.args.ruta, index, origin)
      if (!path) return { response: { id: call.id, name: call.name, response: { ok: false, motivo: 'ruta_desconocida' } }, effect: null }
      context.navigate(path)
      return { response: { id: call.id, name: call.name, response: { ok: true, ruta: path } }, effect: { kind: 'open', path } }
    }
    if (call.name === SOURCE_TOOL) {
      const path = safeSitePath(call.args.ruta, index, origin)
      if (!path) return { response: { id: call.id, name: call.name, response: { ok: false, motivo: 'fuente_desconocida' } }, effect: null }
      const title = sourceTitle(index, path)
      return { response: { id: call.id, name: call.name, response: { ok: true, ruta: path, titulo: title } }, effect: { kind: 'source', path, title } }
    }
    if (call.name === DIAGRAM_TOOL) {
      const parsed = parseDiagram(call.args)
      if (!parsed.ok) return { response: { id: call.id, name: call.name, response: { ok: false, error: parsed.error } }, effect: null }
      return { response: { id: call.id, name: call.name, response: { ok: true, nodos: parsed.diagram.nodos.length } }, effect: { kind: 'diagram', diagram: parsed.diagram } }
    }
    if (call.name === DECISION_TOOL) {
      const decision = parseDecision(call.args)
      if (!decision) return { response: { id: call.id, name: call.name, response: { ok: false, error: 'decision_incompleta' } }, effect: null }
      return { response: { id: call.id, name: call.name, response: { ok: true } }, effect: { kind: 'decision', decision } }
    }
    if (call.name === PAGE_TOOL) {
      if (!context.page) return { response: { id: call.id, name: call.name, response: { ok: false, motivo: 'sin_pagina' } }, effect: null }
      const page = context.page.read()
      return { response: { id: call.id, name: call.name, response: { ok: true, ruta: page.path, titulo: page.title, secciones: page.sections } }, effect: null }
    }
    if (call.name === HIGHLIGHT_TOOL) {
      const ok = context.page ? context.page.highlight(call.args.id) : false
      return { response: { id: call.id, name: call.name, response: ok ? { ok: true } : { ok: false, motivo: 'seccion_desconocida' } }, effect: null }
    }
    return { response: { id: call.id, name: call.name, response: { error: 'herramienta_desconocida' } }, effect: null }
  }
}
