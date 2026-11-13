import '@/lib/data/mongo/register'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AccountView } from '@/components/account/AccountView'
import { BackgroundIntensity } from '@/components/motion'
import { accountCopy, isAccountError } from '@/content/account'
import { firstPanelPath } from '@/lib/accounts/permissions'
import { getAccountState, getPanelActor } from '@/lib/auth/accounts'
import { getAdminSession } from '@/lib/auth/guard'
import { signInMode } from '@/lib/auth/google'
import { safeNext } from '@/lib/auth/oauth'
import { isLocale, localizedPath } from '@/lib/i18n'
import { logServerError } from '@/lib/security/log'

type Props = {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { lang } = await params
  const robots = { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
  if (!isLocale(lang)) return { robots }
  return { title: accountCopy[lang].metaTitle, robots }
}

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export default async function AccountPage({ params, searchParams }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const query = await searchParams
  const error = single(query.error)
  let state = null
  let owner = false
  let panelHref: string | null = null
  try {
    const [account, admin, actor] = await Promise.all([getAccountState(), getAdminSession(), getPanelActor()])
    state = account
    owner = Boolean(admin)
    panelHref = actor ? localizedPath(lang, firstPanelPath(actor)) : null
  } catch (cause) {
    logServerError('account.page', cause)
  }

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <AccountView
        lang={lang}
        copy={accountCopy[lang]}
        mode={signInMode()}
        next={safeNext(single(query.next), lang)}
        error={isAccountError(error) ? error : null}
        deleted={single(query.deleted) === '1'}
        owner={owner}
        panelHref={panelHref}
        account={state ? { name: state.account.name, email: state.account.email, permissions: state.permissions } : null}
      />
    </>
  )
}
