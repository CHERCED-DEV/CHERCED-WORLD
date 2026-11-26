import { z } from 'zod'
import type { Localized } from '@/content/types'

export type RouteProof = 1 | 2 | 3 | 4

export type RouteStation = {
  id: string
  proof: RouteProof
  alsoProves?: readonly RouteProof[]
  title: Localized
  minutes: number
  steps: Localized[]
  href: string
  evidence: string[]
  spec: string
}

export const ROUTE_PROOFS: readonly RouteProof[] = [1, 2, 3, 4]

export const ROUTE_REPO_PREFIX = 'https://github.com/CHERCED-DEV/'

export const ROUTE_STEPS_MIN = 2

export const ROUTE_STEPS_MAX = 4

export const ROUTE_STATION_MINUTES_MAX = 10

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isExternalHref(href: string): boolean {
  return href.startsWith(ROUTE_REPO_PREFIX)
}

export function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//') && !/^\/(es|en)(\/|#|\?|$)/.test(href) && !/[\s?]/.test(href)
}

const localized = z.object({ es: z.string().trim().min(1), en: z.string().trim().min(1) })

const proof = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])

export const routeStationSchema: z.ZodType<RouteStation> = z
  .object({
    id: z.string().max(40).regex(SLUG, 'id en minúsculas con guiones'),
    proof,
    alsoProves: z.array(proof).readonly().optional(),
    title: localized,
    minutes: z.number().int().min(1).max(ROUTE_STATION_MINUTES_MAX),
    steps: z.array(localized).min(ROUTE_STEPS_MIN).max(ROUTE_STEPS_MAX),
    href: z.string().refine((href) => isInternalHref(href) || isExternalHref(href), {
      message: `href interno sin idioma (/ai-lab#lab-v5) o de ${ROUTE_REPO_PREFIX}`,
    }),
    evidence: z.array(z.string().regex(SLUG, 'id de evidencia en minúsculas con guiones')).min(1),
    spec: z.string().regex(/^\d{3}$/, 'spec de tres dígitos, como 030'),
  })
  .superRefine((station, ctx) => {
    const also = station.alsoProves ?? []
    if (also.includes(station.proof)) ctx.addIssue({ code: 'custom', path: ['alsoProves'], message: 'alsoProves no puede repetir proof' })
    if (new Set(also).size !== also.length) ctx.addIssue({ code: 'custom', path: ['alsoProves'], message: 'alsoProves repite una prueba' })
    if (new Set(station.evidence).size !== station.evidence.length) ctx.addIssue({ code: 'custom', path: ['evidence'], message: 'evidence repite un id' })
  })
