import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/lib/i18n'

export type LangParams = Promise<{ lang: string }>

export async function resolveLang(params: LangParams): Promise<Locale> {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return lang
}
