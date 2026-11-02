import Link from 'next/link'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { localizedPath } from '@/lib/i18n'
import styles from './admin.module.scss'
import { LogoutButton } from './AuthForms'
import { NavTabs, type PanelTab } from './NavTabs'
import { Updates } from './Updates'
import { updatesLabels, type AdminText } from './labels'

export function PanelHeader({
  text,
  unread,
  pending,
  now,
}: {
  text: AdminText
  unread: number
  pending: number
  now: Date
}) {
  const { lang, tr } = text
  const tabs: PanelTab[] = [
    {
      href: localizedPath(lang, '/inbox'),
      label: tr('admin.nav.messages'),
      count: unread,
      countLabel: tr('admin.unread', { count: unread }),
      id: 'messages',
    },
    {
      href: localizedPath(lang, '/inbox/comments'),
      label: tr('admin.nav.comments'),
      count: pending,
      countLabel: tr('admin.pending', { count: pending }),
      id: 'comments',
    },
    { href: localizedPath(lang, '/inbox/settings'), label: tr('admin.nav.settings'), count: 0, countLabel: '', id: 'settings' },
  ]

  return (
    <GlassSurface as="header" variant="standard" className={styles.panelHeader} data-cw-panel-header="">
      <Link href={localizedPath(lang, '/inbox')} className={styles.panelTitle}>
        {tr('admin.panel.title')}
      </Link>
      <NavTabs tabs={tabs} label={tr('admin.nav.label')} />
      <div className={styles.headerEnd}>
        <Updates initialNow={now.toISOString()} unread={unread} pending={pending} labels={updatesLabels(text)} />
        <LogoutButton lang={lang} label={tr('admin.logout')} />
      </div>
    </GlassSurface>
  )
}
