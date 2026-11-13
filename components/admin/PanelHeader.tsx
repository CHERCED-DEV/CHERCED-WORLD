import Link from 'next/link'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { can, type PanelActor } from '@/lib/accounts/permissions'
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
  actor,
}: {
  text: AdminText
  unread: number
  pending: number
  now: Date
  actor: PanelActor
}) {
  const { lang, tr } = text
  const owner = actor.kind === 'owner'
  const all: (PanelTab & { visible: boolean })[] = [
    {
      href: localizedPath(lang, '/inbox'),
      label: tr('admin.nav.messages'),
      count: unread,
      countLabel: tr('admin.unread', { count: unread }),
      id: 'messages',
      visible: can(actor, 'messages'),
    },
    {
      href: localizedPath(lang, '/inbox/comments'),
      label: tr('admin.nav.comments'),
      count: pending,
      countLabel: tr('admin.pending', { count: pending }),
      id: 'comments',
      visible: can(actor, 'comments'),
    },
    { href: localizedPath(lang, '/inbox/blog'), label: tr('admin.nav.blog'), count: 0, countLabel: '', id: 'blog', visible: can(actor, 'posts') },
    { href: localizedPath(lang, '/inbox/people'), label: tr('admin.nav.people'), count: 0, countLabel: '', id: 'people', visible: owner },
    { href: localizedPath(lang, '/inbox/settings'), label: tr('admin.nav.settings'), count: 0, countLabel: '', id: 'settings', visible: owner },
  ]
  const tabs: PanelTab[] = all.filter((tab) => tab.visible).map(({ visible: _visible, ...tab }) => tab)

  return (
    <GlassSurface as="header" variant="standard" className={styles.panelHeader} data-cw-panel-header="">
      <Link href={localizedPath(lang, '/inbox')} prefetch={false} className={styles.panelTitle}>
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

