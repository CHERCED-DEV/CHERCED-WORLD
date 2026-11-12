import type { Metadata } from 'next'
import { labPageLabels } from '@/components/ailab/shell/labels'
import { LabPage, themeSectionId } from '@/components/ailab/shell/LabPage'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { SectionNav } from '@/components/site/section-nav/SectionNav'
import { labThemes } from '@/content/ailab/catalog'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

const SECTIONS_LABEL = { es: 'Secciones del AI Lab', en: 'AI Lab sections' }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const [ailab, common] = await Promise.all([getDictionary(lang, 'ailab'), getDictionary(lang, 'common')])
  return pageMetadata({
    lang,
    path: '/ai-lab',
    title: t(ailab, 'ailab.meta.title'),
    description: t(ailab, 'ailab.meta.description'),
    common,
    ogImageFile: true,
  })
}

export default async function AiLabPage({ params }: Props) {
  const lang = await resolveLang(params)
  const labels = labPageLabels(await getDictionary(lang, 'ailab'))
  return (
    <>
      <BackgroundIntensity value="subtle" />
      <SectionNav
        label={SECTIONS_LABEL[lang]}
        sections={labThemes().map((group) => ({ id: themeSectionId(group.theme), label: labels.themes[group.theme] }))}
      >
        <LabPage lang={lang} />
      </SectionNav>
    </>
  )
}
