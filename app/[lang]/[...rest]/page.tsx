import type { Metadata } from 'next'
import { NotFoundView } from '@/components/shell'
import { defaultLocale, isLocale, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: Promise<{ lang: string; rest: string[] }> }

export const dynamic = 'force-dynamic'

async function resolve(params: Props['params']) {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : defaultLocale
  return { lang: locale, common: await getDictionary(locale, 'common') }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { common } = await resolve(params)
  return { title: t(common, 'notFound.title'), robots: { index: false, follow: true } }
}

export default async function UnknownRoute({ params }: Props) {
  const { lang, common } = await resolve(params)
  return <NotFoundView title={t(common, 'notFound.title')} ctaLabel={t(common, 'notFound.cta')} href={`/${lang}`} />
}
