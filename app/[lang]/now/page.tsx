import type { Metadata } from 'next'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { nowBlocks, nowMottos } from '@/components/site/now/model'
import { NowView } from '@/components/site/now/NowView'
import { localizeSections } from '@/components/site/section-nav/model'
import { SectionNav } from '@/components/site/section-nav/SectionNav'
import { now } from '@/content/now'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

const SECTIONS_LABEL = { es: 'Secciones de Ahora', en: 'Now sections' }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const [site, common] = await Promise.all([getDictionary(lang, 'site'), getDictionary(lang, 'common')])
  return pageMetadata({
    lang,
    path: '/now',
    title: t(site, 'nowPage.title'),
    description: t(site, 'meta.now.description'),
    common,
    ogImageFile: true,
  })
}

export default async function NowPage({ params }: Props) {
  const lang = await resolveLang(params)
  const dict = await getDictionary(lang, 'site')

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <SectionNav
        label={SECTIONS_LABEL[lang]}
        sections={localizeSections(
          [
            { id: 'section-now', label: t(dict, 'nowPage.title') },
            ...nowBlocks(now, lang).map((block) => ({ id: `section-${block.id}`, label: t(dict, `nowPage.${block.id}`) })),
            ...(nowMottos(now, lang).length > 0 ? [{ id: 'section-mottos', label: t(dict, 'nowPage.mottos') }] : []),
          ],
          lang,
        )}
      />
      <NowView
        lang={lang}
        now={now}
        labels={{
          title: t(dict, 'nowPage.title'),
          lead: t(dict, 'meta.now.description'),
          updated: t(dict, 'nowPage.updated'),
          building: t(dict, 'nowPage.building'),
          learning: t(dict, 'nowPage.learning'),
          preparing: t(dict, 'nowPage.preparing'),
          offKeyboard: t(dict, 'nowPage.offKeyboard'),
          mottos: t(dict, 'nowPage.mottos'),
        }}
      />
    </>
  )
}
