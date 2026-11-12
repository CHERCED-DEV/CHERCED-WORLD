import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translate'
import { funDictionary } from './dictionary'
import { NoTocarButton } from './NoTocarButton'

export function NoTocar({ lang }: { lang: Locale }) {
  return <NoTocarButton lang={lang} label={t(funDictionary(lang), 'fun.button')} />
}
