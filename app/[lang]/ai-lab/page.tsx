import type { Metadata } from 'next'
import { LabPage } from '@/components/ailab/shell/LabPage'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

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
  return (
    <>
      <BackgroundIntensity value="subtle" />
      <LabPage lang={lang} />
    </>
  )
}
