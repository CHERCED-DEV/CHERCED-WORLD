import { isLocale, locales } from '@/lib/i18n/config'
import { buildSearchIndex } from '@/lib/search/build-index'

export const dynamic = 'force-static'

export const dynamicParams = false

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function GET(_request: Request, context: RouteContext<'/api/search-index/[lang]'>) {
  const { lang } = await context.params
  if (!isLocale(lang)) return Response.json({ error: 'not_found' }, { status: 404 })
  return Response.json(await buildSearchIndex(lang))
}
