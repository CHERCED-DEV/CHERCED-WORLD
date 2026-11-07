import Link from 'next/link'
import type { ServiceId, ServicesContent } from '@/content/types'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { GridLines } from '@/components/ui/graphics'
import { localizedPath, type Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import { typeset } from '../typeset'
import { serviceNumber, wantHref, type ServiceCase } from './model'
import { ServiceAudiences } from './ServiceAudiences'
import { type ServiceCardLabels } from './ServiceCard'
import { ServiceCases } from './ServiceCases'
import { ServiceFaq } from './ServiceFaq'
import { ServiceProcess } from './ServiceProcess'
import { ServiceStack } from './ServiceStack'
import styles from './Services.module.scss'

export type ServicesLabels = ServiceCardLabels & {
  title: string
  audiences: string
  principles: string
  cases: string
  faq: string
}

export type ServicesViewProps = {
  lang: Locale
  services: ServicesContent
  cases: ServiceCase[]
  labels: ServicesLabels
  tryHrefs?: Partial<Record<ServiceId, string>>
}

export function ServicesView({ lang, services, cases, labels, tryHrefs = {} }: ServicesViewProps) {
  const contact = localizedPath(lang, '/contactMe')
  const cardLabels: ServiceCardLabels = {
    forWho: labels.forWho,
    deliverables: labels.deliverables,
    flip: labels.flip,
    flipBack: labels.flipBack,
    want: labels.want,
    try: labels.try,
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="services-title" data-cw-services-block="hero">
        <SectionTitle as="h1" id="services-title" size="lg">
          {services.hero.title[lang]}
        </SectionTitle>
        <GlassSurface variant="standard" edge light className={styles.heroCard}>
          <GridLines fade="radial" />
          <p className={styles.prose}>{typeset(services.hero.intro[lang], lang)}</p>
          <Link
            href={contact}
            className={buttonClassName({ variant: 'solid', size: 'lg', className: styles.wrapButton })}
            data-cw-services-hero-cta=""
          >
            {services.hero.cta[lang]}
          </Link>
        </GlassSurface>
      </section>

      <ServiceAudiences lang={lang} title={labels.audiences} audiences={services.audiences} />

      <section className={styles.block} aria-labelledby="services-offer" data-cw-services-block="services">
        <SectionTitle id="services-offer">{labels.title}</SectionTitle>
        <ServiceStack
          cards={services.items.map((item, index) => ({
            id: item.id,
            lang,
            number: serviceNumber(index),
            title: item.title[lang],
            forWho: item.forWho[lang],
            description: item.description[lang],
            example: item.example?.[lang],
            deliverables: item.deliverables.map((deliverable) => deliverable[lang]),
            wantHref: wantHref(lang, item.id),
            tryHref: tryHrefs[item.id],
            labels: cardLabels,
          }))}
        />
      </section>

      <ServiceProcess lang={lang} process={services.process} principlesTitle={labels.principles} />

      <ServiceCases lang={lang} title={labels.cases} cases={cases} items={services.items} />

      <ServiceFaq lang={lang} title={labels.faq} faq={services.faq} />

      <section className={cx(styles.block, styles.ctaSection)} aria-labelledby="services-cta" data-cw-services-block="cta">
        <GlassSurface variant="strong" grain depth edge light className={styles.cta}>
          <span className={styles.ctaAccent} aria-hidden="true" />
          <div className={styles.ctaCopy}>
            <h2 id="services-cta" className={styles.ctaTitle}>
              {services.cta.title[lang]}
            </h2>
            <p className={styles.ctaText}>{services.cta.text[lang]}</p>
          </div>
          <Link
            href={contact}
            className={buttonClassName({ variant: 'glass', size: 'lg', className: styles.wrapButton })}
            data-cw-services-contact=""
          >
            {services.cta.button[lang]}
          </Link>
        </GlassSurface>
      </section>
    </div>
  )
}
