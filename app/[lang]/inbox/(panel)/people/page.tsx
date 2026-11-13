import '@/lib/data/mongo/register'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import styles from '@/components/admin/admin.module.scss'
import { ActionButton, ConfirmButton } from '@/components/admin/ActionButton'
import { guardPanel } from '@/components/admin/gate'
import { GrantForm, type GrantFormLabels } from '@/components/admin/GrantForm'
import { adminText, formatDateTime, resultLabels, type AdminText } from '@/components/admin/labels'
import { SessionExpired } from '@/components/admin/Views'
import { buttonClassName } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { normalizeEmail } from '@/lib/accounts/permissions'
import { deleteAccount, removeTeamGrant, setAccountBlocked } from '@/lib/actions/account'
import { signInMode } from '@/lib/auth/google'
import { getRepos } from '@/lib/data'
import { PERMISSIONS, type Permission } from '@/lib/data/types'
import { isLocale, localizedPath } from '@/lib/i18n'

type Props = {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = 'force-dynamic'

function grantLabels({ tr }: AdminText): GrantFormLabels {
  return {
    title: tr('admin.people.save'),
    email: tr('admin.people.email'),
    emailError: tr('admin.error.validation'),
    permissions: tr('admin.people.permissions'),
    options: { posts: tr('admin.permission.posts'), messages: tr('admin.permission.messages'), comments: tr('admin.permission.comments') },
    save: tr('admin.people.save'),
    saved: tr('admin.people.saved'),
    failed: tr('admin.error.unavailable'),
  }
}

function permissionList(text: AdminText, permissions: readonly Permission[]): string {
  return PERMISSIONS.filter((permission) => permissions.includes(permission)).map((permission) => text.tr(`admin.permission.${permission}`)).join(' · ')
}

export default async function PeoplePage({ params, searchParams }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const text = await adminText(lang)
  if (!(await guardPanel(lang, 'owner'))) return <SessionExpired text={text} />
  const { tr } = text
  const results = resultLabels(text)
  const repos = getRepos()
  const [grants, accounts] = await Promise.all([repos.accounts.listGrants(), repos.accounts.list()])
  const editing = (await searchParams).email
  const current = typeof editing === 'string' ? grants.find((grant) => grant.email === normalizeEmail(editing)) : undefined
  const base = localizedPath(lang, '/inbox/people')
  const mode = signInMode()

  return (
    <section className={styles.section} aria-labelledby="people-title" data-cw-people="">
      <header>
        <h2 id="people-title" className={styles.sectionTitle}>
          {tr('admin.people.title')}
        </h2>
        <p className={styles.muted}>{tr('admin.people.intro')}</p>
        <p className={styles.muted} data-cw-signin-mode={mode}>
          {tr(`admin.people.signIn.${mode}`)}
        </p>
      </header>

      <GrantForm key={current?.email ?? 'new'} labels={grantLabels(text)} email={current?.email} permissions={current?.permissions} />

      <section className={styles.section} aria-labelledby="team-title">
        <h3 id="team-title" className={styles.cardTitle}>
          {tr('admin.people.team')}
        </h3>
        {grants.length === 0 ? (
          <p className={styles.empty}>{tr('admin.people.teamEmpty')}</p>
        ) : (
          <ul className={styles.list} data-cw-team="">
            {grants.map((grant) => (
              <li key={grant.email}>
                <GlassSurface as="article" variant="subtle" className={styles.item} data-cw-grant={grant.email}>
                  <header className={styles.itemHeader}>
                    <h4 className={styles.itemTitle}>{grant.email}</h4>
                  </header>
                  <p className={styles.body}>{permissionList(text, grant.permissions)}</p>
                  <div className={styles.actions}>
                    <Link href={`${base}?email=${encodeURIComponent(grant.email)}#grant`} prefetch={false} className={buttonClassName({ size: 'sm' })}>
                      {tr('admin.people.edit')}
                    </Link>
                    <ActionButton action={removeTeamGrant.bind(null, grant.email)} label={tr('admin.people.revoke')} results={results} name="revoke" />
                  </div>
                </GlassSurface>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section} aria-labelledby="accounts-title">
        <h3 id="accounts-title" className={styles.cardTitle}>
          {tr('admin.people.accounts')}
        </h3>
        {accounts.length === 0 ? (
          <p className={styles.empty}>{tr('admin.people.accountsEmpty')}</p>
        ) : (
          <ul className={styles.list} data-cw-accounts="">
            {accounts.map((account) => (
              <li key={account.id}>
                <GlassSurface as="article" variant="subtle" className={styles.item} data-cw-account={account.email}>
                  <header className={styles.itemHeader}>
                    <h4 className={styles.itemTitle}>{account.name}</h4>
                    {account.blockedAt ? <span className={styles.badge}>{tr('admin.people.blocked')}</span> : null}
                  </header>
                  <dl className={styles.details}>
                    <dt>{tr('admin.field.email')}</dt>
                    <dd>{account.email}</dd>
                    <dt>{tr('admin.people.lastLogin')}</dt>
                    <dd>
                      <time dateTime={account.lastLoginAt.toISOString()}>{formatDateTime(account.lastLoginAt, lang)}</time>
                    </dd>
                  </dl>
                  <div className={styles.actions}>
                    <ActionButton
                      action={setAccountBlocked.bind(null, account.id, !account.blockedAt)}
                      label={tr(account.blockedAt ? 'admin.people.unblock' : 'admin.people.block')}
                      results={results}
                      name={account.blockedAt ? 'unblock' : 'block'}
                    />
                    <ConfirmButton
                      action={deleteAccount.bind(null, account.id)}
                      label={tr('admin.action.delete')}
                      results={results}
                      confirm={{ title: tr('admin.people.delete.title'), text: tr('admin.people.delete.text'), confirm: tr('admin.action.delete'), cancel: tr('admin.action.cancel') }}
                      name="delete"
                    />
                  </div>
                </GlassSurface>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
