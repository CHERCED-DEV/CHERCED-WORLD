import type { ServiceAudience } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks } from '@/components/ui/graphics'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import styles from './Services.module.scss'

export type ServiceAudiencesProps = { lang: Locale; title: string; audiences: ServiceAudience[] }

export function ServiceAudiences({ lang, title, audiences }: ServiceAudiencesProps) {
  return (
    <section className={styles.block} aria-labelledby="services-audiences" data-cw-services-block="audiences">
      <SectionTitle id="services-audiences">{title}</SectionTitle>
      <ul className={styles.audiences}>
        {audiences.map((audience) => (
          <GlassSurface
            key={audience.id}
            as="li"
            variant="standard"
            grain
            edge
            className={styles.audience}
            data-cw-audience={audience.id}
          >
            <CornerMarks size={12} inset={10} accent />
            <h3 className={styles.audienceTitle}>{audience.title[lang]}</h3>
            <p className={styles.audienceText}>{audience.text[lang]}</p>
          </GlassSurface>
        ))}
      </ul>
    </section>
  )
}
