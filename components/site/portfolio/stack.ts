export const STACK_LAYERS = ['interface', 'language', 'framework', 'data', 'architecture', 'craft'] as const

export type StackLayer = (typeof STACK_LAYERS)[number]

export const LAYER_BY_TECHNOLOGY: Readonly<Record<string, StackLayer>> = {
  HTML: 'interface',
  CSS: 'interface',
  SASS: 'interface',
  CANVAS: 'interface',
  SWEETALERT2: 'interface',
  JAVASCRIPT: 'language',
  TYPESCRIPT: 'language',
  'C#': 'language',
  PYTHON: 'language',
  REACT: 'framework',
  'NEXT.JS': 'framework',
  'NEXT-ROUTER': 'framework',
  ANGULAR: 'framework',
  '.NET': 'framework',
  '.NET 8': 'framework',
  'ASP.NET CORE': 'framework',
  UMBRACO: 'framework',
  'UMBRACO 13': 'framework',
  'CLOUDFLARE WORKERS': 'framework',
  'AWS EVENTBRIDGE': 'framework',
  'NEXT AUTH': 'data',
  'NEXT REDUX': 'data',
  'APIREST THEMOVIEDB': 'data',
  'APIREST OWNBACKEND': 'data',
  'AZURE SERVICE BUS': 'data',
  'REDPANDA CONNECT': 'data',
  'MICRO-FRONTENDS': 'architecture',
  'WEB COMPONENTS': 'architecture',
  NX: 'architecture',
  'EVENT-DRIVEN ARCHITECTURE': 'architecture',
  ADR: 'architecture',
  MCP: 'architecture',
  FIGMA: 'craft',
  WEBPACK: 'craft',
  DOCKER: 'craft',
  'GITHUB ACTIONS': 'craft',
  'GIT WORKTREES': 'craft',
  'SPEC KIT': 'craft',
  'CLAUDE CODE': 'craft',
  'AI CODING AGENTS': 'craft',
  'AI AGENTS': 'craft',
  EVALS: 'craft',
}

export function layerOf(technology: string): StackLayer | null {
  return Object.prototype.hasOwnProperty.call(LAYER_BY_TECHNOLOGY, technology) ? LAYER_BY_TECHNOLOGY[technology]! : null
}

export type StackGroup = { layer: StackLayer; technologies: string[] }

export function stackGroups(technologies: readonly string[]): StackGroup[] {
  const buckets = new Map<StackLayer, string[]>()
  for (const technology of technologies) {
    const layer = layerOf(technology) ?? 'craft'
    const list = buckets.get(layer) ?? []
    if (!list.includes(technology)) list.push(technology)
    buckets.set(layer, list)
  }
  return STACK_LAYERS.flatMap((layer) => {
    const list = buckets.get(layer)
    return list && list.length > 0 ? [{ layer, technologies: list }] : []
  })
}
