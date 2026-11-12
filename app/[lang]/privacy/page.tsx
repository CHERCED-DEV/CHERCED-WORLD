import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import styles from '@/components/contact/PageSection.module.scss'
import { BackgroundIntensity } from '@/components/motion'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Separator } from '@/components/ui/Separator'
import { getSite, pick } from '@/lib/content'
import { pageMetadata } from '@/components/site/metadata'
import { isLocale, localizedPath, t, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: Promise<{ lang: string }> }

function formatDay(value: string, lang: Locale): string {
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(date)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const [privacy, common] = await Promise.all([getDictionary(lang, 'privacy'), getDictionary(lang, 'common')])
  return pageMetadata({
    lang,
    path: '/privacy',
    title: t(privacy, 'meta.privacy.title'),
    description: t(privacy, 'meta.privacy.description'),
    common,
  })
}

export default async function PrivacyPage({ params }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const privacy = await getDictionary(lang, 'privacy')
  const policy = getSite().privacy

  return (
    <section className={cx('cw-container', styles.section, styles.narrow)} aria-labelledby="privacy-title">
      <BackgroundIntensity value="subtle" />
      <div className={styles.info}>
        <h1 id="privacy-title" className={styles.title}>
          {t(privacy, 'privacy.title')}
        </h1>
        <p className={styles.meta}>
          <time dateTime={policy.updatedAt}>{t(privacy, 'privacy.updatedAt', { date: formatDay(policy.updatedAt, lang) })}</time>
        </p>
        <Separator />
      </div>
      <GlassSurface as="article" variant="standard" className={cx(styles.card, styles.prose)}>
        {policy.sections.map((section) => (
          <section key={pick(section.heading, 'es')}>
            <h2>{pick(section.heading, lang)}</h2>
            <p>{pick(section.body, lang)}</p>
          </section>
        ))}
        <section>
          <h2>{t(privacy, 'privacy.technical.heading')}</h2>
          <p>{t(privacy, 'privacy.technical.body')}</p>
        </section>
        <Link href={localizedPath(lang, '/contactMe')} className={buttonClassName({ variant: 'glass', className: styles.cta })}>
          {t(privacy, 'privacy.contactCta')}
        </Link>
      </GlassSurface>
    </section>
  )
}
