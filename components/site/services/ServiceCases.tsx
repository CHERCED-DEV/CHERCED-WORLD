import Link from 'next/link'
import type { ServiceItem } from '@/content/types'
import { projectTitle } from '@/lib/content/project-title'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { localizedPath, type Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import type { ServiceCase } from './model'
import styles from './Services.module.scss'

export type ServiceCasesProps = { lang: Locale; title: string; cases: ServiceCase[]; items: ServiceItem[] }

export function ServiceCases({ lang, title, cases, items }: ServiceCasesProps) {
  if (cases.length === 0) return null
  const titles = new Map(items.map((item) => [item.id, item.title[lang]]))

  return (
    <section className={styles.block} aria-labelledby="services-cases" data-cw-services-block="cases">
      <SectionTitle id="services-cases">{title}</SectionTitle>
      <ul className={styles.cases}>
        {cases.map(({ project, services }) => (
          <GlassSurface
            key={project.id}
            as="li"
            variant="standard"
            grain
            edge
            light
            className={styles.case}
            data-cw-service-case={project.id}
          >
            <h3 className={styles.caseTitle}>
              <Link href={localizedPath(lang, `/portfolio/${project.id}`)} className={styles.caseLink}>
                {projectTitle(project, lang)}
              </Link>
            </h3>
            <p className={styles.caseSummary}>{project.summary[lang]}</p>
            <ul className={styles.caseServices}>
              {services.map((service) => (
                <li key={service}>{titles.get(service)}</li>
              ))}
            </ul>
          </GlassSurface>
        ))}
      </ul>
    </section>
  )
}
