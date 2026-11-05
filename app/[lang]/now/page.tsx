import type { Metadata } from 'next'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { NowView } from '@/components/site/now/NowView'
import { now } from '@/content/now'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

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
