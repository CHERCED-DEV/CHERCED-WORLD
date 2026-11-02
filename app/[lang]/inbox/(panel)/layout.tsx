import '@/lib/data/mongo/register'
import { notFound, redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import styles from '@/components/admin/admin.module.scss'
import { adminText } from '@/components/admin/labels'
import { PanelHeader } from '@/components/admin/PanelHeader'
import { LoginView } from '@/components/admin/Views'
import { cx } from '@/components/ui/cx'
import { requireAdmin, UnauthorizedError } from '@/lib/auth/guard'
import { getRepos } from '@/lib/data'
import { isLocale, localizedPath } from '@/lib/i18n'

type Props = { children: ReactNode; params: Promise<{ lang: string }> }

export const dynamic = 'force-dynamic'

async function hasSession(): Promise<boolean> {
  try {
    await requireAdmin()
    return true
  } catch (error) {
    if (error instanceof UnauthorizedError) return false
    throw error
  }
}

export default async function PanelLayout({ children, params }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const repos = getRepos()
  const text = await adminText(lang)

  if (!(await hasSession())) {
    if (!(await repos.admin.getCredential())) redirect(localizedPath(lang, '/inbox/setup'))
    return <LoginView text={text} />
  }

  const now = new Date()
  const [unread, pending] = await Promise.all([repos.messages.countUnread(), repos.comments.countPending()])

  return (
    <div className={cx('cw-container', styles.shell)} data-cw-panel="">
      <PanelHeader text={text} unread={unread} pending={pending} now={now} />
      {children}
    </div>
  )
}
