import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { SiteContent } from '@/content/types'
import { buttonClassName } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { localizedPath, type Locale } from '@/lib/i18n'
import { splitLead } from '../format'
import { SectionTitle } from '../SectionTitle'
import { ServiceIcon } from './ServiceIcon'
import styles from './Services.module.scss'

export type ServicesLabels = { title: string; explore: string; offer: string; cta: string; contact: string }

export type ServicesViewProps = {
  lang: Locale
  services: SiteContent['services']
  labels: ServicesLabels
}

export function ServicesView({ lang, services, labels }: ServicesViewProps) {
  const { lead, body } = splitLead(services.intro[lang])

  return (
    <div className={styles.page}>
      <section className={styles.intro} aria-labelledby="services-title">
        <SectionTitle as="h1" id="services-title">
          {lead ?? labels.title}
        </SectionTitle>
        <GlassSurface variant="standard" className={styles.introCard}>
          <p className={styles.prose}>{body}</p>
          <Link href={localizedPath(lang, '/portfolio')} className={buttonClassName({ variant: 'solid', size: 'lg' })}>
            {labels.explore}
          </Link>
        </GlassSurface>
      </section>
      <section className={styles.offer} aria-labelledby="services-offer">
        <h2 id="services-offer" className="cw-visually-hidden">
          {labels.offer}
        </h2>
        <ol className={styles.cards}>
          {services.items.map((item, index) => (
            <GlassSurface
              as="li"
              key={item.id}
              variant="standard"
              className={styles.card}
              data-cw-service={item.id}
              style={{ '--cw-i': index } as CSSProperties}
            >
              <span className={styles.cardTile}>
                <ServiceIcon id={item.id} />
              </span>
              <div className={styles.cardBody}>
                <p className={styles.cardIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className={styles.cardTitle}>{item.title[lang]}</h3>
                <p className={styles.cardText}>{item.description[lang]}</p>
              </div>
            </GlassSurface>
          ))}
        </ol>
      </section>
      <section className={styles.ctaSection} aria-labelledby="services-cta">
        <GlassSurface variant="strong" className={styles.cta}>
          <h2 id="services-cta" className={styles.ctaTitle}>
            {labels.cta}
          </h2>
          <Link
            href={localizedPath(lang, '/contactMe')}
            className={buttonClassName({ variant: 'glass', size: 'lg' })}
            data-cw-services-contact=""
          >
            {labels.contact}
          </Link>
        </GlassSurface>
      </section>
    </div>
  )
}
