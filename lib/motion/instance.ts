let owner: symbol | null = null

export function acquireBackground(): (() => void) | null {
  if (owner !== null) return null
  const token = Symbol('cw-background')
  owner = token
  return () => {
    if (owner === token) owner = null
  }
}

export function hasBackgroundOwner(): boolean {
  return owner !== null
}
