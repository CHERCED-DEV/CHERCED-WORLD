import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { specPath } from '@/components/engineering/links'
import { SpecDetail } from '@/components/engineering/SpecDetail'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { loadDashboard } from '@/lib/engineering/load'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Params = Promise<{ lang: string; spec: string }>

type Props = { params: Params }

export const dynamicParams = false

export function generateStaticParams(): Array<{ spec: string }> {
  return [...new Set(loadDashboard().specs.map((spec) => spec.number))].map((spec) => ({ spec }))
}

function findSpec(number: string) {
  return loadDashboard().specs.find((spec) => spec.number === number) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const { spec: number } = await params
  const spec = findSpec(number)
  if (!spec) return {}
  const [dict, common] = await Promise.all([getDictionary(lang, 'engineering'), getDictionary(lang, 'common')])
  return pageMetadata({
    lang,
    path: specPath(spec.number),
    title: t(dict, 'engineering.detail.metaTitle', { number: spec.number, title: spec.title }),
    description: t(dict, 'engineering.detail.metaDescription', { number: spec.number }),
    common,
  })
}

export default async function EngineeringSpecPage({ params }: Props) {
  const lang = await resolveLang(params)
  const { spec: number } = await params
  const spec = findSpec(number)
  if (!spec) notFound()
  const dict = await getDictionary(lang, 'engineering')
  return (
    <>
      <BackgroundIntensity value="subtle" />
      <SpecDetail lang={lang} dict={dict} spec={spec} dashboard={loadDashboard()} />
    </>
  )
}
