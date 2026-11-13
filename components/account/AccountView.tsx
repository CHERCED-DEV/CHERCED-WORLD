import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Icon } from '@/components/ui/Icon'
import type { AccountCopy, AccountError } from '@/content/account'
import { deleteOwnAccount, signOutAccount } from '@/lib/actions/account'
import type { SignInMode } from '@/lib/auth/google'
import type { Permission } from '@/lib/data/types'
import { localizedPath, type Locale } from '@/lib/i18n'
import styles from './Account.module.scss'

export type AccountViewProps = {
  lang: Locale
  copy: AccountCopy
  mode: SignInMode
  next: string
  error: AccountError | null
  deleted: boolean
  owner: boolean
  panelHref: string | null
  account: { name: string; email: string; permissions: Permission[] } | null
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.5 5.8c4.4-4 6.8-10 6.8-17.2z" />
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  )
}

function Notice({ tone, children }: { tone: 'error' | 'ok'; children: string }) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={cx(styles.notice, tone === 'error' && styles.noticeError)} data-cw-account-notice={tone}>
      <Icon name={tone === 'error' ? 'alert' : 'check'} size={18} />
      <span>{children}</span>
    </p>
  )
}

function SignedOut({ lang, copy, mode, next }: Pick<AccountViewProps, 'lang' | 'copy' | 'mode' | 'next'>) {
  const googleHref = `/api/auth/google?${new URLSearchParams({ lang, next }).toString()}`
  return (
    <>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.lede}>{copy.intro}</p>
      <ul className={styles.benefits}>
        {copy.benefits.map((benefit) => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>
      {mode === 'google' ? (
        <a href={googleHref} className={cx(buttonClassName({ variant: 'solid', size: 'lg' }), styles.google)} data-cw-google-signin="">
          <GoogleMark />
          {copy.google}
        </a>
      ) : null}
      {mode === 'off' ? <p className={styles.muted}>{copy.off}</p> : null}
      {mode === 'local' ? (
        <form method="post" action="/api/auth/local" className={styles.local} data-cw-local-signin="">
          <p className={styles.localTitle}>{copy.localTitle}</p>
          <p className={styles.muted}>{copy.localNote}</p>
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="next" value={next} />
          <div className={styles.field}>
            <label htmlFor="account-local-name">{copy.localName}</label>
            <input id="account-local-name" name="name" type="text" autoComplete="off" maxLength={80} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="account-local-email">{copy.localEmail}</label>
            <input id="account-local-email" name="email" type="email" autoComplete="off" maxLength={254} required />
          </div>
          <button type="submit" className={cx(buttonClassName({ variant: 'solid' }), styles.google)}>
            <GoogleMark />
            {copy.localSubmit}
          </button>
        </form>
      ) : null}
      <p className={styles.small}>
        {copy.privacy}{' '}
        <a href={localizedPath(lang, '/privacy')}>{copy.privacyLink}</a>.
      </p>
      <p className={styles.small}>
        <a href={localizedPath(lang, '/inbox')} data-cw-owner-login="">
          {copy.ownerLink}
        </a>
      </p>
    </>
  )
}

function SignedIn({ lang, copy, panelHref, account }: Pick<AccountViewProps, 'lang' | 'copy' | 'panelHref'> & { account: NonNullable<AccountViewProps['account']> }) {
  return (
    <>
      <h1 className={styles.title}>{copy.signedInTitle}</h1>
      <p className={styles.name} data-cw-account-name="">
        {account.name}
      </p>
      <dl className={styles.details}>
        <dt>{copy.email}</dt>
        <dd>{account.email}</dd>
        <dt>{copy.permissions}</dt>
        <dd>{account.permissions.length > 0 ? account.permissions.map((permission) => copy.permissionNames[permission]).join(' · ') : copy.noPermissions}</dd>
      </dl>
      <div className={styles.actions}>
        {panelHref ? (
          <a href={panelHref} className={buttonClassName({ variant: 'solid' })} data-cw-account-panel="">
            {copy.panel}
          </a>
        ) : null}
        <form action={signOutAccount}>
          <input type="hidden" name="lang" value={lang} />
          <button type="submit" className={buttonClassName({})} data-cw-account-signout="">
            {copy.signOut}
          </button>
        </form>
      </div>
      <details className={styles.danger}>
        <summary>{copy.deleteSummary}</summary>
        <p>{copy.deleteText}</p>
        <form action={deleteOwnAccount}>
          <input type="hidden" name="lang" value={lang} />
          <button type="submit" className={buttonClassName({ variant: 'ghost', size: 'sm' })} data-cw-account-delete="">
            {copy.deleteConfirm}
          </button>
        </form>
      </details>
    </>
  )
}

export function AccountView({ lang, copy, mode, next, error, deleted, owner, panelHref, account }: AccountViewProps) {
  return (
    <section className={cx('cw-container', styles.wrap)} data-cw-account-page={account ? 'signed-in' : 'signed-out'}>
      {owner && !account ? (
        <GlassSurface variant="subtle" className={styles.owner} data-cw-account-owner="">
          <p className={styles.ownerTitle}>{copy.ownerTitle}</p>
          <p className={styles.muted}>{copy.ownerText}</p>
          {panelHref ? (
            <a href={panelHref} className={buttonClassName({ variant: 'solid', size: 'sm' })}>
              {copy.panel}
            </a>
          ) : null}
        </GlassSurface>
      ) : null}
      <GlassSurface variant="standard" className={styles.card}>
        {error ? <Notice tone="error">{copy.errors[error]}</Notice> : null}
        {deleted ? <Notice tone="ok">{copy.deleted}</Notice> : null}
        {account ? (
          <SignedIn lang={lang} copy={copy} panelHref={panelHref} account={account} />
        ) : (
          <SignedOut lang={lang} copy={copy} mode={mode} next={next} />
        )}
      </GlassSurface>
    </section>
  )
}
