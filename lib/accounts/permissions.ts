import { PERMISSIONS, type AccountRecord, type Permission, type TeamGrant } from '@/lib/data/types'

export type PanelActor =
  | { kind: 'owner' }
  | { kind: 'team'; account: AccountRecord; permissions: Permission[] }

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && (PERMISSIONS as readonly string[]).includes(value)
}

export function cleanPermissions(values: readonly unknown[]): Permission[] {
  return PERMISSIONS.filter((permission) => values.includes(permission))
}

export function teamPermissions(account: AccountRecord | null, grant: TeamGrant | null): Permission[] {
  if (!account || account.blockedAt || !grant) return []
  if (normalizeEmail(grant.email) !== normalizeEmail(account.email)) return []
  return cleanPermissions(grant.permissions)
}

export function can(actor: PanelActor | null, permission: Permission): boolean {
  if (!actor) return false
  return actor.kind === 'owner' || actor.permissions.includes(permission)
}

export function isOwner(actor: PanelActor | null): actor is { kind: 'owner' } {
  return actor?.kind === 'owner'
}

export const PANEL_PATHS: Record<Permission, string> = {
  messages: '/inbox',
  comments: '/inbox/comments',
  posts: '/inbox/blog',
}

export function firstPanelPath(actor: PanelActor): string {
  if (actor.kind === 'owner') return PANEL_PATHS.messages
  const first = (['messages', 'comments', 'posts'] as const).find((permission) => actor.permissions.includes(permission))
  return first ? PANEL_PATHS[first] : '/account'
}
