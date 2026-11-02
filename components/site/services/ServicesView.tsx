import Image from 'next/image'
import Link from 'next/link'
import type { SiteContent } from '@/content/types'
import { buttonClassName } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { localizedPath, type Locale } from '@/lib/i18n'
import { splitLead } from '../format'
import { SectionTitle } from '../SectionTitle'
import styles from './Services.module.scss'

export type ServicesViewProps = {
  lang: Locale
  services: SiteContent['services']
  labels: { title: string; explore: string; offer: string }
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
        <ul className={styles.cards}>
          {services.items.map((item) => (
            <GlassSurface as="li" key={item.id} variant="standard" className={styles.card} data-cw-service={item.id}>
              <div className={styles.cardHead}>
                <Image src={item.icon} alt="" width={36} height={32} unoptimized className={styles.cardIcon} />
                <h3 className={styles.cardTitle}>{item.title[lang]}</h3>
              </div>
              <p className={styles.cardText}>{item.description[lang]}</p>
            </GlassSurface>
          ))}
        </ul>
      </section>
    </div>
  )
}
