export type AgentViewer = { kind: 'author'; name: string } | { kind: 'account'; name: string } | { kind: 'anonymous' }

export const ANONYMOUS_VIEWER: AgentViewer = { kind: 'anonymous' }

export const VIEWER_NAME_MAX = 40

export function firstName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? ''
  const clean = first.replace(/[^\p{L}\p{M}'-]/gu, '').slice(0, VIEWER_NAME_MAX)
  return clean ? clean.charAt(0).toLocaleUpperCase('es') + clean.slice(1) : ''
}

export function isAgentViewer(value: unknown): value is AgentViewer {
  if (!value || typeof value !== 'object') return false
  const viewer = value as Record<string, unknown>
  if (viewer.kind === 'anonymous') return true
  return (viewer.kind === 'author' || viewer.kind === 'account') && typeof viewer.name === 'string'
}

export type ViewerSources = {
  isAdmin: () => Promise<boolean>
  account: () => Promise<{ name: string; email: string } | null>
  authorEmail: string | null
}

export async function resolveViewer(sources: ViewerSources): Promise<AgentViewer> {
  try {
    const account = await sources.account()
    const author = sources.authorEmail?.trim().toLowerCase() || null
    if (account && author && account.email.trim().toLowerCase() === author) return { kind: 'author', name: firstName(account.name) || 'Camilo' }
    if (await sources.isAdmin()) return { kind: 'author', name: account ? firstName(account.name) || 'Camilo' : 'Camilo' }
    if (account) {
      const name = firstName(account.name)
      return name ? { kind: 'account', name } : ANONYMOUS_VIEWER
    }
  } catch {
    return ANONYMOUS_VIEWER
  }
  return ANONYMOUS_VIEWER
}
