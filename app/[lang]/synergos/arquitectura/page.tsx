import type { Metadata } from 'next'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { ArchitectureView } from '@/components/site/synergos/arquitectura/ArchitectureView'
import { architecture, SYNERGOS_ARCHITECTURE_PATH } from '@/content/synergos-architecture'
import { getDictionary } from '@/lib/i18n/server'
import { architectureJsonLd } from '@/lib/seo/synergos-architecture'
import { jsonLdScript } from '@/lib/seo/person'

type Props = { params: LangParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  return pageMetadata({ lang, path: SYNERGOS_ARCHITECTURE_PATH, title: architecture.copy.title[lang], description: architecture.copy.description[lang], common: await getDictionary(lang, 'common'), ogImageFile: true })
}

export default async function ArchitecturePage({ params }: Props) {
  const lang = await resolveLang(params)
  return <><BackgroundIntensity value="subtle" /><ArchitectureView lang={lang} /><script type="application/ld+json" data-cw-architecture-ld="" dangerouslySetInnerHTML={{ __html: jsonLdScript(architectureJsonLd(lang)) }} /></>
}
