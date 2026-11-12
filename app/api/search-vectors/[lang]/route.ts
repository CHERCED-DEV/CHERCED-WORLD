import { buildMeaningVectors } from '@/lib/ailab/search/meaning-build'
import { isLocale, locales } from '@/lib/i18n/config'

export const dynamic = 'force-static'

export const dynamicParams = false

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function GET(_request: Request, context: RouteContext<'/api/search-vectors/[lang]'>) {
  const { lang } = await context.params
  if (!isLocale(lang)) return Response.json({ error: 'not_found' }, { status: 404 })
  return Response.json(await buildMeaningVectors(lang))
}
