'use client'

import '@/styles/globals.scss'
import { useParams } from 'next/navigation'
import en from '@/content/i18n/en/common.json'
import es from '@/content/i18n/es/common.json'
import { ErrorView } from '@/components/shell/ErrorView'
import { defaultLocale, isLocale } from '@/lib/i18n/config'
import { montserrat } from '@/styles/fonts'

const texts = {
  es: { title: es['error.title'], retry: es['error.cta'], home: es['notFound.cta'] },
  en: { title: en['error.title'], retry: en['error.cta'], home: en['notFound.cta'] },
}

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  const params = useParams<{ lang?: string }>()
  const lang = isLocale(params?.lang) ? params.lang : defaultLocale
  const copy = texts[lang]

  return (
    <html lang={lang} className={montserrat.variable}>
      <body>
        <title>{copy.title}</title>
        <ErrorView title={copy.title} retryLabel={copy.retry} onRetry={retry} homeLabel={copy.home} homeHref={`/${lang}`} />
      </body>
    </html>
  )
}
