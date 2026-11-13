import 'server-only'
import { redirect } from 'next/navigation'
import { can, firstPanelPath, type PanelActor } from '@/lib/accounts/permissions'
import { getPanelActor } from '@/lib/auth/accounts'
import type { Permission } from '@/lib/data/types'
import { localizedPath, type Locale } from '@/lib/i18n'

export async function guardPanel(lang: Locale, need: Permission | 'owner'): Promise<PanelActor | null> {
  const actor = await getPanelActor()
  if (!actor) return null
  const allowed = need === 'owner' ? actor.kind === 'owner' : can(actor, need)
  if (!allowed) redirect(localizedPath(lang, firstPanelPath(actor)))
  return actor
}
