import type { RouteGuide } from '@/content/ailab/route/core'
import { isExternalHref, isInternalHref, ROUTE_PROOFS, routeStationSchema, type RouteProof, type RouteStation } from '@/content/ailab/route/stations'

export const ROUTE_BUDGET_MINUTES = 10

export type RouteRegistryEnv = {
  pages: ReadonlySet<string>
  anchors: ReadonlySet<string>
  evidence: ReadonlySet<string>
  specs: ReadonlySet<string>
}

export type RouteSectionGroup = { proof: RouteProof; core: RouteStation; more: RouteStation[] }

export function splitHref(href: string): { path: string; hash: string } {
  const index = href.indexOf('#')
  const path = index === -1 ? href : href.slice(0, index)
  const bare = path.length > 1 ? path.replace(/\/+$/, '') : path
  return { path: bare || '/', hash: index === -1 ? '' : href.slice(index + 1) }
}

export function internalHrefProblem(href: string, env: Pick<RouteRegistryEnv, 'pages' | 'anchors'>): string | null {
  const { path, hash } = splitHref(href)
  if (!env.pages.has(path)) return `la página ${path} no existe`
  if (hash && !env.anchors.has(`${path}#${hash}`)) return `el ancla #${hash} no existe en ${path}`
  return null
}

export function routeSections(stations: readonly RouteStation[], core: Readonly<Record<RouteProof, string>>): RouteSectionGroup[] {
  return ROUTE_PROOFS.flatMap((proof) => {
    const main = stations.find((station) => station.id === core[proof] && station.proof === proof)
    if (!main) return []
    return [{ proof, core: main, more: stations.filter((station) => station.proof === proof && station.id !== main.id) }]
  })
}

export function coreMinutes(stations: readonly RouteStation[], core: Readonly<Record<RouteProof, string>>): number {
  return routeSections(stations, core).reduce((sum, section) => sum + section.core.minutes, 0)
}

function linkProblem(href: string, env: RouteRegistryEnv): string | null {
  if (isExternalHref(href)) return null
  if (!isInternalHref(href)) return 'no es un href interno sin idioma ni de github.com/CHERCED-DEV/'
  return internalHrefProblem(href, env)
}

export function routeRegistryProblems(
  stations: readonly RouteStation[],
  core: Readonly<Record<RouteProof, string>>,
  env: RouteRegistryEnv,
  guides: Readonly<Record<string, RouteGuide>> = {},
): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  for (const station of stations) {
    const label = station.id || '(sin id)'
    const parsed = routeStationSchema.safeParse(station)
    if (!parsed.success) for (const issue of parsed.error.issues) problems.push(`${label}: ${issue.path.join('.') || 'estación'}: ${issue.message}`)
    if (ids.has(station.id)) problems.push(`${label}: id repetido`)
    ids.add(station.id)
    if (typeof station.href === 'string' && isInternalHref(station.href)) {
      const problem = internalHrefProblem(station.href, env)
      if (problem) problems.push(`${label}: href ${station.href}: ${problem}`)
    }
    for (const id of station.evidence ?? []) if (!env.evidence.has(id)) problems.push(`${label}: la evidencia ${id} no tiene texto en ES y EN en route.json`)
    if (!env.specs.has(station.spec)) problems.push(`${label}: la spec ${station.spec} no existe en specs/`)
  }
  for (const proof of ROUTE_PROOFS) {
    if (!stations.some((station) => station.proof === proof)) problems.push(`prueba ${proof}: no tiene ninguna estación`)
    const id = core[proof]
    const station = stations.find((item) => item.id === id)
    if (!station) problems.push(`prueba ${proof}: la estación núcleo ${id} no está en el registro`)
    else if (station.proof !== proof) problems.push(`prueba ${proof}: la estación núcleo ${id} es de la prueba ${station.proof}`)
  }
  const minutes = coreMinutes(stations, core)
  if (minutes > ROUTE_BUDGET_MINUTES) problems.push(`ruta núcleo: suma ${minutes} minutos y el tope es ${ROUTE_BUDGET_MINUTES}`)
  for (const [id, guide] of Object.entries(guides)) {
    if (!ids.has(id)) problems.push(`guía ${id}: no hay una estación con ese id`)
    for (const link of guide.links ?? []) {
      const problem = linkProblem(link.href, env)
      if (problem) problems.push(`guía ${id}: enlace ${link.href}: ${problem}`)
    }
  }
  return problems
}
