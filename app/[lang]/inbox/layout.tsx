import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { BackgroundIntensity } from '@/components/motion'
import { isLocale, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { children: ReactNode; params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { lang } = await params
  const robots = { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
  if (!isLocale(lang)) return { robots }
  const admin = await getDictionary(lang, 'admin')
  return { title: t(admin, 'meta.inbox.title'), robots }
}

export default function InboxLayout({ children }: Props) {
  return (
    <>
      <BackgroundIntensity value="subtle" />
      {children}
    </>
  )
}
