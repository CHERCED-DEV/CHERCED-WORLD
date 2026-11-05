import type { JSX } from 'react'
import { getCapsule, getSite } from '@/lib/content'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/server'
import { publicEmail } from '@/lib/search/build-index'
import { pageDocs } from '@/lib/search/pages'
import { ExperienceClient } from './ExperienceClient'
import { uiLabels } from './labels'

export type ExperienceRootProps = { lang: Locale }

export async function ExperienceRoot({ lang }: ExperienceRootProps): Promise<JSX.Element> {
  const [experience, common] = await Promise.all([getDictionary(lang, 'experience'), getDictionary(lang, 'common')])
  const site = getSite()
  return (
    <ExperienceClient
      lang={lang}
      labels={uiLabels(experience, common)}
      pages={pageDocs(lang, common)}
      email={publicEmail(site)}
      cv={site.profile?.cv.href ?? null}
      areas={(site.about.skills.lobes ?? []).map((lobe) => lobe.id)}
      capsule={getCapsule()}
    />
  )
}
