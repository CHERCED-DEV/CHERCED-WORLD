import '@/lib/data/mongo/register'
import { notFound } from 'next/navigation'
import styles from '@/components/admin/admin.module.scss'
import { ChangePasswordForm, LogoutButton } from '@/components/admin/AuthForms'
import { adminErrors, adminText, changePasswordLabels } from '@/components/admin/labels'
import { SessionExpired } from '@/components/admin/Views'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { guardPanel } from '@/components/admin/gate'
import { isLocale } from '@/lib/i18n'

type Props = { params: Promise<{ lang: string }> }

export const dynamic = 'force-dynamic'

export default async function SettingsPage({ params }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const text = await adminText(lang)
  const actor = await guardPanel(lang, 'owner')
  if (!actor) return <SessionExpired text={text} />
  const { tr } = text

  return (
    <section className={styles.section} aria-labelledby="settings-title">
      <h2 id="settings-title" className={styles.sectionTitle}>
        {tr('admin.settings.title')}
      </h2>
      <ChangePasswordForm labels={changePasswordLabels(text)} errors={adminErrors(text)} />
      <GlassSurface variant="subtle" className={styles.card}>
        <h3 className={styles.cardTitle}>{tr('admin.session.title')}</h3>
        <p className={styles.muted}>{tr('admin.session.text')}</p>
        <LogoutButton lang={lang} label={tr('admin.logout')} />
      </GlassSurface>
    </section>
  )
}
