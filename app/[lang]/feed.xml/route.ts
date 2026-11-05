import { FEED_CONTENT_TYPE } from '@/lib/blog/feed'
import { isLocale, locales } from '@/lib/i18n'
import { buildFeed } from './rss'

export const dynamic = 'force-static'

export const dynamicParams = false

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) return new Response('Not Found', { status: 404 })
  return new Response(await buildFeed(lang), { headers: { 'content-type': FEED_CONTENT_TYPE } })
}
