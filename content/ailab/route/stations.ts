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
