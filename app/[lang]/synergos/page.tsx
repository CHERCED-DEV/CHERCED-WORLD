import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { caseEvidenceLabels } from '@/components/site/portfolio/labels'
import { SynergosView } from '@/components/site/synergos/SynergosView'
import { synergosShowcase, SYNERGOS_BUILD_CASE_ID, SYNERGOS_CASE_ID, SYNERGOS_PATH } from '@/content/synergos-showcase'
import { getProject } from '@/lib/content'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { jsonLdScript } from '@/lib/seo/person'
import { synergosJsonLd } from '@/lib/seo/synergos'

type Props = { params: LangParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const common = await getDictionary(lang, 'common')
  return pageMetadata({
    lang,
    path: SYNERGOS_PATH,
    title: synergosShowcase.copy.title[lang],
    description: synergosShowcase.copy.description[lang],
    common,
    ogImageFile: true,
  })
}

export default async function SynergosPage({ params }: Props) {
  const lang = await resolveLang(params)
  const project = getProject(SYNERGOS_CASE_ID)
  if (!project) notFound()
  const dict = await getDictionary(lang, 'site')

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <SynergosView
        lang={lang}
        project={project}
        build={getProject(SYNERGOS_BUILD_CASE_ID)}
        labels={{
          newTab: t(dict, 'a11y.newTab'),
          github: t(dict, 'project.github'),
          diagram: caseEvidenceLabels(dict).diagram,
        }}
      />
      <script type="application/ld+json" data-cw-synergos-ld="" dangerouslySetInnerHTML={{ __html: jsonLdScript(synergosJsonLd(lang)) }} />
    </>
  )
}
