import type { ServiceFaq as ServiceFaqItem } from '@/content/types'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import styles from './Services.module.scss'

export type ServiceFaqProps = { lang: Locale; title: string; faq: ServiceFaqItem[] }

export function ServiceFaq({ lang, title, faq }: ServiceFaqProps) {
  if (faq.length === 0) return null

  return (
    <section className={styles.block} aria-labelledby="services-faq" data-cw-services-block="faq">
      <SectionTitle id="services-faq">{title}</SectionTitle>
      <div className={styles.faq}>
        {faq.map((item) => (
          <details key={item.q[lang]} className={styles.faqItem} data-cw-glass="standard" data-cw-faq="">
            <summary className={styles.faqQuestion}>{item.q[lang]}</summary>
            <p className={styles.faqAnswer}>{item.a[lang]}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
