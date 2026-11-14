import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { bookingLink } from '@/components/contact/booking'
import { ContactForm } from '@/components/contact/ContactForm'
import { contactErrorMessages, contactLabels } from '@/components/contact/labels'
import styles from '@/components/contact/PageSection.module.scss'
import { prefilledMessage, preselectedInterest } from '@/components/contact/preselect'
import { BackgroundIntensity } from '@/components/motion'
import { AvailabilityChip } from '@/components/ui/AvailabilityChip'
import { buttonClassName } from '@/components/ui/Button'
import { RecruitersEntry, RecruitersFallback } from '@/components/site/home/RecruitersEntry'
import { typeset } from '@/components/site/typeset'
import { CvActions } from '@/components/ui/CvLink'
import { EmailMenu } from '@/components/ui/EmailMenu'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Separator } from '@/components/ui/Separator'
import { cx } from '@/components/ui/cx'
import { publicEmail } from '@/content/site'
import { getSite, pick } from '@/lib/content'
import { alternates, isLocale, localizedPath, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { formRenderedAt } from '@/lib/security/request'

type Props = {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
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

export default async function ContactPage({ params, searchParams }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const [common, contact, renderedAt, query] = await Promise.all([
    getDictionary(lang, 'common'),
    getDictionary(lang, 'contact'),
    formRenderedAt(),
    searchParams,
  ])
  const site = getSite()
  const email = publicEmail(site)
  const linkedin = site.socials.find((social) => social.id === 'linkedin')

  return (
    <section className={cx('cw-container', styles.section)} aria-labelledby="contact-title">
      <BackgroundIntensity value="subtle" />
      <div className={styles.info}>
        <h1 id="contact-title" className={styles.title}>
          {pick(site.contact.title, lang)}
        </h1>
        <p className={styles.lead}>{typeset(pick(site.contact.description, lang), lang)}</p>
        <div className={styles.reach} data-cw-contact-reach="">
          <AvailabilityChip lang={lang} />
          {site.recruiters ? <RecruitersEntry lang={lang} content={site.recruiters} writeHref="#contact-form" withCv={false} /> : null}
          <div className={styles.reachActions}>
            <CvActions lang={lang} downloadVariant="solid" className={styles.cvActions} />
            <span className={styles.reachIcons}>
              {email ? (
                <EmailMenu
                  lang={lang}
                  email={email}
                  className={buttonClassName({ variant: 'glass', className: styles.mailButton })}
                  trigger={<Image src="/assets/icons/gmailIcon.png" alt="" width={24} height={24} unoptimized className="cw-icon-img" />}
                />
              ) : null}
              {linkedin?.href ? (
                <a
                  href={linkedin.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={linkedin.label[lang]}
                  className={buttonClassName({ variant: 'glass', className: styles.mailButton })}
                  data-cw-contact-linkedin=""
                >
                  <Image src="/assets/icons/linkedInIcon.png" alt="" width={24} height={24} unoptimized className="cw-icon-img" />
                </a>
              ) : null}
            </span>
          </div>
        </div>
        <Separator className={styles.reachSeparator} />
        {site.recruiters ? <RecruitersFallback lang={lang} content={site.recruiters} writeHref="#contact-form" withCv={false} compact /> : null}
      </div>
      <GlassSurface variant="standard" className={styles.card} id="contact-form">
        <ContactForm
          renderedAt={renderedAt}
          privacyHref={localizedPath(lang, '/privacy')}
          labels={contactLabels(common, contact)}
          errors={contactErrorMessages(common, contact)}
          interest={preselectedInterest(query.servicio)}
          message={prefilledMessage(lang, query.vacante)}
          booking={bookingLink(site.profile, lang)}
        />
      </GlassSurface>
    </section>
  )
}
