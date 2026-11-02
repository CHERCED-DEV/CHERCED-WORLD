import '@/styles/globals.scss'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { ExperienceRoot } from '@/components/experience'
import { Background, Intro } from '@/components/motion'
import { FloatMenu, navItems, shellLabels, SiteFooter, SiteHeader, themeScript } from '@/components/shell'
import { ToastProvider } from '@/components/ui/Toast'
import { getSite } from '@/lib/content'
import { isLocale, locales, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { getSiteUrl } from '@/lib/site-url'
import { montserrat } from '@/styles/fonts'

type LayoutProps = { children: ReactNode; params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: Omit<LayoutProps, 'children'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const common = await getDictionary(lang, 'common')
  const siteName = t(common, 'brand.name')
  return {
    metadataBase: getSiteUrl(),
    title: { default: t(common, 'meta.title'), template: `%s | ${t(common, 'meta.title')}` },
    description: t(common, 'meta.description'),
    applicationName: siteName,
    authors: [{ name: t(common, 'brand.author') }],
    icons: { icon: '/assets/icons/brandLogo.png', apple: '/assets/icons/brandLogoX2.png' },
    openGraph: {
      type: 'website',
      siteName,
      locale: lang === 'es' ? 'es_CO' : 'en_US',
      images: [{ url: '/assets/icons/brandLogoX2.png', width: 202, height: 202, alt: t(common, 'brand.logoAlt') }],
    },
  }
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
}

export default async function RootLayout({ children, params }: LayoutProps) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const common = await getDictionary(lang, 'common')
  const labels = shellLabels(common)
  const items = navItems(common)

  return (
    <html lang={lang} className={montserrat.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="cw-skip-link" href="#main">
          {t(common, 'a11y.skipToContent')}
        </a>
        <Background />
        <Intro name={t(common, 'intro.name')} role={t(common, 'intro.role')} skipLabel={t(common, 'intro.skip')} />
        <ToastProvider closeLabel={t(common, 'toast.close')}>
          <SiteHeader lang={lang} items={items} labels={labels} />
          <FloatMenu lang={lang} items={items} labels={{ nav: labels.nav, close: labels.menuClose, lang: labels.lang }} />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter lang={lang} socials={getSite().socials} labels={labels} />
          <ExperienceRoot lang={lang} />
        </ToastProvider>
      </body>
    </html>
  )
}
