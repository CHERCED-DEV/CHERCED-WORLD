import '@/lib/data/mongo/register'
import { notFound, redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import styles from '@/components/admin/admin.module.scss'
import { adminText } from '@/components/admin/labels'
import { PanelHeader } from '@/components/admin/PanelHeader'
import { LoginView } from '@/components/admin/Views'
import { cx } from '@/components/ui/cx'
import { can } from '@/lib/accounts/permissions'
import { getPanelActor } from '@/lib/auth/accounts'
import { getRepos } from '@/lib/data'
import { isLocale, localizedPath } from '@/lib/i18n'

type Props = { children: ReactNode; params: Promise<{ lang: string }> }

export const dynamic = 'force-dynamic'

export default async function PanelLayout({ children, params }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const repos = getRepos()
  const text = await adminText(lang)

  const actor = await getPanelActor()
  if (!actor) {
    if (!(await repos.admin.getCredential())) redirect(localizedPath(lang, '/inbox/setup'))
    return <LoginView text={text} />
  }

  const now = new Date()
  const [unread, pending] = await Promise.all([
    can(actor, 'messages') ? repos.messages.countUnread() : Promise.resolve(0),
    can(actor, 'comments') ? repos.comments.countPending() : Promise.resolve(0),
  ])

  return (
    <div className={cx('cw-container', styles.shell)} data-cw-panel="" data-cw-panel-actor={actor.kind}>
      <PanelHeader text={text} unread={unread} pending={pending} now={now} actor={actor} />
      {children}
    </div>
  )
}
