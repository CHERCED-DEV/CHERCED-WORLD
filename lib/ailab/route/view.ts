import type { RouteGuide } from '@/content/ailab/route/core'
import { isExternalHref, ROUTE_PROOFS, type RouteProof, type RouteStation } from '@/content/ailab/route/stations'
import { localizedPath, t, type Dictionary, type Locale } from '@/lib/i18n'
import { routeSections } from './registry'

export type RouteLinkView = { label: string; href: string; external: boolean }

export type RouteStationView = {
  id: string
  proof: RouteProof
  also: Array<{ proof: RouteProof; title: string }>
  core: boolean
  position: number | null
  title: string
  minutes: number
  goal: string
  steps: string[]
  action: RouteLinkView
  evidence: Array<{ id: string; text: string }>
  links: RouteLinkView[]
  spec: string
  tip: string | null
  offline: string | null
  breakIt: boolean
  recordedTrace: boolean
}

export type RouteSectionView = { proof: RouteProof; title: string; check: string; core: RouteStationView; more: RouteStationView[] }

export type RouteProofView = { proof: RouteProof; title: string }

export type RouteViewModel = { sections: RouteSectionView[]; order: string[]; stations: RouteStationView[]; proofs: RouteProofView[] }

export function routeHref(lang: Locale, href: string): { href: string; external: boolean } {
  return isExternalHref(href) ? { href, external: true } : { href: localizedPath(lang, href), external: false }
}

export function proofTitle(dict: Dictionary, proof: RouteProof): string {
  return t(dict, `route.proof.${proof}.title`)
}

function stationView(lang: Locale, dict: Dictionary, station: RouteStation, guide: RouteGuide | undefined, position: number | null): RouteStationView {
  return {
    id: station.id,
    proof: station.proof,
    also: (station.alsoProves ?? []).map((proof) => ({ proof, title: proofTitle(dict, proof) })),
    core: position !== null,
    position,
    title: station.title[lang],
    minutes: station.minutes,
    goal: guide?.goal?.[lang] ?? t(dict, `route.proof.${station.proof}.check`),
    steps: station.steps.map((step) => step[lang]),
    action: { label: guide?.action[lang] ?? t(dict, 'route.station.open'), ...routeHref(lang, station.href) },
    evidence: station.evidence.map((id) => ({ id, text: t(dict, `route.evidence.${id}`) })),
    links: (guide?.links ?? []).map((link) => ({ label: link.label[lang], ...routeHref(lang, link.href) })),
    spec: station.spec,
    tip: guide?.tip?.[lang] ?? null,
    offline: guide?.offline?.[lang] ?? null,
    breakIt: guide?.breakIt === true,
    recordedTrace: guide?.recordedTrace === true,
  }
}

export function routeViewModel(
  lang: Locale,
  dict: Dictionary,
  stations: readonly RouteStation[],
  core: Readonly<Record<RouteProof, string>>,
  guides: Readonly<Record<string, RouteGuide>> = {},
): RouteViewModel {
  const sections = routeSections(stations, core).map((section, index) => ({
    proof: section.proof,
    title: proofTitle(dict, section.proof),
    check: t(dict, `route.proof.${section.proof}.check`),
    core: stationView(lang, dict, section.core, guides[section.core.id], index + 1),
    more: section.more.map((station) => stationView(lang, dict, station, guides[station.id], null)),
  }))
  return {
    sections,
    order: sections.map((section) => section.core.id),
    stations: sections.flatMap((section) => [section.core, ...section.more]),
    proofs: ROUTE_PROOFS.map((proof) => ({ proof, title: proofTitle(dict, proof) })),
  }
}
