import '@/lib/data/mongo/register'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { adminText } from '@/components/admin/labels'
import { SetupView } from '@/components/admin/Views'
import { ensureSetupCode } from '@/lib/auth/setup'
import { getRepos } from '@/lib/data'
import { isLocale, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: Promise<{ lang: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  return { title: t(await getDictionary(lang, 'admin'), 'meta.setup.title') }
}

export default async function SetupPage({ params }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const { admin } = getRepos()
  const state = await ensureSetupCode(admin, new Date())
  if (state === 'configured') notFound()
  return <SetupView text={await adminText(lang)} />
}
