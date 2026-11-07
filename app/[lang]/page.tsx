import type { Metadata } from 'next'
import { BackgroundIntensity } from '@/components/motion'
import { HomeView } from '@/components/site/home/HomeView'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { synergosShowcase } from '@/content/synergos-showcase'
import { getProjects, getSite } from '@/lib/content'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { jsonLdScript } from '@/lib/seo/person'
import { websiteJsonLd } from '@/lib/seo/website'

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
    ogImageFile: true,
    absoluteTitle: true,
  })
}

export default async function HomePage({ params }: Props) {
  const lang = await resolveLang(params)
  const [dict, home] = await Promise.all([getDictionary(lang, 'site'), getDictionary(lang, 'home')])

  return (
    <>
      <BackgroundIntensity value="full" />
      <HomeView
        lang={lang}
        site={getSite()}
        projects={getProjects()}
        labels={{
          socials: t(dict, 'home.socials'),
          previousTitle: t(dict, 'home.previousTitleLabel'),
          cue: t(home, 'hero.cue'),
          now: {
            title: t(home, 'now.title'),
            since: t(home, 'now.since'),
            caseStudy: t(home, 'now.caseStudy'),
            more: t(home, 'now.more'),
            showcase: synergosShowcase.copy.cta[lang],
          },
        }}
      />
      <script type="application/ld+json" data-cw-website="" dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteJsonLd(lang)) }} />
    </>
  )
}
