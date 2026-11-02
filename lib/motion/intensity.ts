export type Intensity = 'full' | 'subtle'

export const DEFAULT_INTENSITY: Intensity = 'subtle'

type Claim = { id: number; value: Intensity }

const claims: Claim[] = []
const listeners = new Set<() => void>()
let nextId = 0

export function isIntensity(value: unknown): value is Intensity {
  return value === 'full' || value === 'subtle'
}

export function getIntensity(): Intensity {
  return claims.at(-1)?.value ?? DEFAULT_INTENSITY
}

export function getServerIntensity(): Intensity {
  return DEFAULT_INTENSITY
}

export function subscribeIntensity(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function update(change: () => void) {
  const before = getIntensity()
  change()
  if (getIntensity() !== before) for (const listener of [...listeners]) listener()
}

export function claimIntensity(value: Intensity): () => void {
  nextId += 1
  const claim: Claim = { id: nextId, value }
  update(() => claims.push(claim))
  let released = false
  return () => {
    if (released) return
    released = true
    update(() => {
      const index = claims.findIndex((entry) => entry.id === claim.id)
      if (index >= 0) claims.splice(index, 1)
    })
  }
}
