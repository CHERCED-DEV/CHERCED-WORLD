import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { localizedPath } from '@/lib/i18n'
import styles from './admin.module.scss'
import { LoginForm, SetupForm } from './AuthForms'
import { adminErrors, loginLabels, setupLabels, type AdminText } from './labels'

export function LoginView({ text }: { text: AdminText }) {
  return (
    <section className={cx('cw-container', styles.authWrap)}>
      <LoginForm lang={text.lang} labels={loginLabels(text)} errors={adminErrors(text)} />
      <p className={styles.authAlt}>
        <a href={localizedPath(text.lang, '/account')} data-cw-team-login="">
          {text.tr('admin.login.team')}
        </a>
      </p>
    </section>
  )
}

export function SetupView({ text }: { text: AdminText }) {
  return (
    <section className={cx('cw-container', styles.authWrap)}>
      <SetupForm lang={text.lang} labels={setupLabels(text)} errors={adminErrors(text)} />
    </section>
  )
}

export function SessionExpired({ text }: { text: AdminText }) {
  return (
    <GlassSurface variant="subtle" className={styles.card} data-cw-session-ended="">
      <p>{text.tr('admin.sessionEnded')}</p>
      <a href={localizedPath(text.lang, '/inbox')} className={buttonClassName({ variant: 'solid', size: 'sm' })}>
        {text.tr('admin.sessionEnded.cta')}
      </a>
    </GlassSurface>
  )
}
