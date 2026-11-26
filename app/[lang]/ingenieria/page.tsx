import type { Metadata } from 'next'
import { EngineeringDashboard, engineeringSections } from '@/components/engineering/EngineeringDashboard'
import { ENGINEERING_PATH } from '@/components/engineering/links'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { SectionNav } from '@/components/site/section-nav/SectionNav'
import { loadDashboard } from '@/lib/engineering/load'
import { SPEND_CAP_USD, SPEND_TARGET_USD } from '@/lib/engineering/spend'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const [dict, common] = await Promise.all([getDictionary(lang, 'engineering'), getDictionary(lang, 'common')])
  return pageMetadata({
    lang,
    path: ENGINEERING_PATH,
    title: t(dict, 'engineering.title'),
    description: t(dict, 'engineering.meta.description'),
    common,
    ogImageFile: true,
  })
}

export default async function EngineeringPage({ params }: Props) {
  const lang = await resolveLang(params)
  const dict = await getDictionary(lang, 'engineering')
  return (
    <>
      <BackgroundIntensity value="subtle" />
      <SectionNav label={t(dict, 'engineering.sections')} sections={engineeringSections(dict)}>
        <EngineeringDashboard lang={lang} dict={dict} dashboard={loadDashboard()} spend={{ targetUsd: SPEND_TARGET_USD, capUsd: SPEND_CAP_USD }} />
      </SectionNav>
    </>
  )
}
