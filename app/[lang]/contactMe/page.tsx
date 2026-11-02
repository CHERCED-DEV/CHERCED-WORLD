import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ContactForm } from '@/components/contact/ContactForm'
import { contactLabels, formErrorMessages } from '@/components/contact/labels'
import styles from '@/components/contact/PageSection.module.scss'
import { BackgroundIntensity } from '@/components/motion'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Separator } from '@/components/ui/Separator'
import { cx } from '@/components/ui/cx'
import { getSite, pick } from '@/lib/content'
import { alternates, isLocale, localizedPath, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { formRenderedAt } from '@/lib/security/request'

type Props = { params: Promise<{ lang: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const contact = await getDictionary(lang, 'contact')
  const title = t(contact, 'meta.contact.title')
  const description = t(contact, 'meta.contact.description')
  return {
    title,
    description,
    alternates: alternates(localizedPath(lang, '/contactMe')),
    openGraph: { title, description },
  }
}

export default async function ContactPage({ params }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const [common, contact, renderedAt] = await Promise.all([
    getDictionary(lang, 'common'),
    getDictionary(lang, 'contact'),
    formRenderedAt(),
  ])
  const site = getSite()

  return (
    <section className={cx('cw-container', styles.section)} aria-labelledby="contact-title">
      <BackgroundIntensity value="subtle" />
      <div className={styles.info}>
        <h1 id="contact-title" className={styles.title}>
          {pick(site.contact.title, lang)}
        </h1>
        <p className={styles.lead}>{pick(site.contact.description, lang)}</p>
        <Separator />
      </div>
      <GlassSurface variant="standard" className={styles.card}>
        <ContactForm
          renderedAt={renderedAt}
          privacyHref={localizedPath(lang, '/privacy')}
          labels={contactLabels(common, contact)}
          errors={formErrorMessages(common)}
        />
      </GlassSurface>
    </section>
  )
}
