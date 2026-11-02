import { lang as rootLang } from 'next/root-params'
import { NotFoundView } from '@/components/shell'
import { defaultLocale, isLocale, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

export default async function NotFound() {
  const value = await rootLang()
  const lang = isLocale(value) ? value : defaultLocale
  const common = await getDictionary(lang, 'common')
  return <NotFoundView title={t(common, 'notFound.title')} ctaLabel={t(common, 'notFound.cta')} href={`/${lang}`} />
}
