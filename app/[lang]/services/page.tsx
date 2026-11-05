import type { Metadata } from 'next'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { serviceCases } from '@/components/site/services/model'
import { ServicesView } from '@/components/site/services/ServicesView'
import { getProjects, getSite } from '@/lib/content'
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
    ogImageFile: true,
  })
}

export default async function ServicesPage({ params }: Props) {
  const lang = await resolveLang(params)
  const dict = await getDictionary(lang, 'site')
  const { services } = getSite()

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <ServicesView
        lang={lang}
        services={services}
        cases={serviceCases(
          getProjects(),
          services.items.map((item) => item.id),
        )}
        labels={{
          title: t(dict, 'services.title'),
          audiences: t(dict, 'services.audiences'),
          forWho: t(dict, 'services.forWho'),
          deliverables: t(dict, 'services.deliverables'),
          flip: t(dict, 'services.flip'),
          flipBack: t(dict, 'services.flipBack'),
          want: t(dict, 'services.want'),
          try: t(dict, 'services.try'),
          principles: t(dict, 'services.principles'),
          cases: t(dict, 'services.cases'),
          faq: t(dict, 'services.faq'),
        }}
      />
    </>
  )
}
