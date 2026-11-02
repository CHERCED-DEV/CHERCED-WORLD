import type { Metadata } from 'next'
import { BackgroundIntensity } from '@/components/motion'
import { HomeBanner } from '@/components/site/HomeBanner'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { getSite } from '@/lib/content'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const [site, common] = await Promise.all([getDictionary(lang, 'site'), getDictionary(lang, 'common')])
  return pageMetadata({
    lang,
    path: '/',
    title: t(site, 'meta.home.title'),
    description: t(site, 'meta.home.description'),
    common,
    absoluteTitle: true,
  })
}

export default async function HomePage({ params }: Props) {
  const lang = await resolveLang(params)
  const dict = await getDictionary(lang, 'site')
  const content = getSite()

  return (
    <>
      <BackgroundIntensity value="full" />
      <HomeBanner lang={lang} home={content.home} socials={content.socials} socialsLabel={t(dict, 'home.socials')} />
    </>
  )
}
