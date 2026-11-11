import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { NotFoundView } from '@/components/shell'
import { t } from '@/lib/i18n'
import { requestLocale } from '@/lib/i18n/request'
import { getDictionary } from '@/lib/i18n/server'
import { MISSING_HEADER, missingSection } from '@/lib/missing'
import RootLayout, { generateMetadata as siteMetadata, viewport as siteViewport } from './[lang]/layout'

export const viewport: Viewport = siteViewport

export async function generateMetadata(): Promise<Metadata> {
  const lang = await requestLocale()
  const [site, common] = await Promise.all([siteMetadata({ params: Promise.resolve({ lang }) }), getDictionary(lang, 'common')])
  return { ...site, title: { absolute: t(common, 'meta.titleTemplate').replace('%s', t(common, 'notFound.title')) } }
}

export default async function GlobalNotFound() {
  const [lang, list] = await Promise.all([requestLocale(), headers()])
  const common = await getDictionary(lang, 'common')
  const section = missingSection(list.get(MISSING_HEADER))
  return (
    <RootLayout params={Promise.resolve({ lang })}>
      <NotFoundView
        title={t(common, 'notFound.title')}
        ctaLabel={t(common, 'notFound.cta')}
        href={`/${lang}`}
        secondary={section ? { label: t(common, `notFound.${section}`), href: `/${lang}/${section}` } : undefined}
      />
    </RootLayout>
  )
}
