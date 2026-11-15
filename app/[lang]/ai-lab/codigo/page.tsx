import type { Metadata } from 'next'
import { CodeTour } from '@/components/ailab/code/CodeTour'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

const META = {
  es: { title: 'Recorrido por el código', description: 'Gemini explica piezas reales del portafolio de Camilo: qué hacen, por qué están escritas así y qué decisión reflejan, con enlaces a las líneas en GitHub.' },
  en: { title: 'A walk through the code', description: 'Gemini explains real pieces of Camilo’s portfolio: what they do, why they’re written that way and which decision they reflect, with links to the lines on GitHub.' },
} as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  return pageMetadata({ lang, path: '/ai-lab/codigo', title: META[lang].title, description: META[lang].description, common: await getDictionary(lang, 'common') })
}

export default async function CodeTourPage({ params }: Props) {
  const lang = await resolveLang(params)
  return (
    <>
      <BackgroundIntensity value="subtle" />
      <CodeTour lang={lang} />
    </>
  )
}
