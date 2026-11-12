import type { Metadata } from 'next'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { localizeSections } from '@/components/site/section-nav/model'
import { SectionNav } from '@/components/site/section-nav/SectionNav'
import { serviceCases } from '@/components/site/services/model'
import { ServicesView } from '@/components/site/services/ServicesView'
import { getProjects, getSite } from '@/lib/content'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

const SECTIONS_LABEL = { es: 'Secciones de Servicios', en: 'Services sections' }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const [site, common] = await Promise.all([getDictionary(lang, 'site'), getDictionary(lang, 'common')])
  return pageMetadata({
    lang,
    path: '/services',
    title: t(site, 'meta.services.searchTitle'),
    description: t(site, 'meta.services.description'),
    common,
    ogImageFile: true,
  })
}

export default async function ServicesPage({ params }: Props) {
  const lang = await resolveLang(params)
  const dict = await getDictionary(lang, 'site')
  const { services } = getSite()
  const cases = serviceCases(
    getProjects(),
    services.items.map((item) => item.id),
  )

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <SectionNav
        label={SECTIONS_LABEL[lang]}
        sections={localizeSections(
          [
            { id: 'section-hero', label: { es: 'Resumen', en: 'Overview' } },
            { id: 'section-audiences', label: t(dict, 'services.audiences') },
            { id: 'section-services', label: { es: 'Servicios', en: 'Services' } },
            { id: 'section-process', label: { es: 'Proceso', en: 'Process' } },
            ...(cases.length > 0 ? [{ id: 'section-cases', label: t(dict, 'services.cases') }] : []),
            ...(services.faq.length > 0 ? [{ id: 'section-faq', label: { es: 'Preguntas', en: 'Questions' } }] : []),
            { id: 'section-cta', label: { es: 'Hablemos', en: "Let's talk" } },
          ],
          lang,
        )}
      >
        <ServicesView
          lang={lang}
          services={services}
          cases={cases}
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
      </SectionNav>
    </>
  )
}
