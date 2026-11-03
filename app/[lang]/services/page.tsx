import type { Metadata } from 'next'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { ServicesView } from '@/components/site/services/ServicesView'
import { getSite } from '@/lib/content'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const [site, common] = await Promise.all([getDictionary(lang, 'site'), getDictionary(lang, 'common')])
  return pageMetadata({
    lang,
    path: '/services',
    title: t(site, 'meta.services.title'),
    description: t(site, 'meta.services.description'),
    common,
  })
}

export default async function ServicesPage({ params }: Props) {
  const lang = await resolveLang(params)
  const dict = await getDictionary(lang, 'site')

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <ServicesView
        lang={lang}
        services={getSite().services}
        labels={{
          title: t(dict, 'services.title'),
          explore: t(dict, 'services.explore'),
          offer: t(dict, 'services.offer'),
          cta: t(dict, 'services.cta'),
          contact: t(dict, 'services.contact'),
        }}
      />
    </>
  )
}
