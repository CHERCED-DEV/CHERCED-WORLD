import type { Metadata } from 'next'
import { RoutePage } from '@/components/ailab/route/RoutePage'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const [route, common] = await Promise.all([getDictionary(lang, 'route'), getDictionary(lang, 'common')])
  return pageMetadata({
    lang,
    path: '/ai-lab/ruta',
    title: t(route, 'route.meta.title'),
    description: t(route, 'route.meta.description'),
    common,
    ogImageFile: true,
  })
}

export default async function RouteTenMinutesPage({ params }: Props) {
  const lang = await resolveLang(params)
  return (
    <>
      <BackgroundIntensity value="subtle" />
      <RoutePage lang={lang} />
    </>
  )
}
