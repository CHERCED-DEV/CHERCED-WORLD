import Image from 'next/image'
import type { Project } from '@/content/types'
import { buttonClassName } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Icon } from '@/components/ui/Icon'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import styles from './CaseStudy.module.scss'
import { caseStudyLinks, caseStudySections, type CaseStudyLabels } from './projects'

export function CaseStudy({ project, lang, labels }: { project: Project; lang: Locale; labels: CaseStudyLabels }) {
  const sections = caseStudySections(project, lang, labels)
  const links = caseStudyLinks(project, labels)

  return (
    <article className={styles.page} aria-labelledby="case-title" data-cw-case={project.id}>
      <div className={styles.media}>
        <Image
          src={project.image.src}
          alt={project.image.alt[lang]}
          width={project.image.width}
          height={project.image.height}
          sizes="(min-width: 768px) 260px, 210px"
          preload
          className={styles.image}
        />
      </div>
      <SectionTitle as="h1" id="case-title" size="lg">
        {project.title}
      </SectionTitle>
      <GlassSurface variant="standard" className={styles.body}>
        {sections.map((section) => (
          <section key={section.id} className={styles.block} aria-labelledby={`case-${section.id}`} data-cw-case-section={section.id}>
            <h2 id={`case-${section.id}`} className={styles.heading}>
              {section.heading}
            </h2>
            <p className={styles.text}>{section.text}</p>
          </section>
        ))}
        {project.technologies.length > 0 ? (
          <section className={styles.block} aria-labelledby="case-technologies">
            <h2 id="case-technologies" className={styles.heading}>
              {labels.technologies}
            </h2>
            <ul className={styles.chips}>
              {project.technologies.map((name) => (
                <li key={name} className={styles.chip}>
                  {name}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {links.length > 0 ? (
          <nav className={styles.links} aria-label={labels.links}>
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName({ variant: link.id === 'live' ? 'solid' : 'glass', size: 'lg' })}
                data-cw-case-link={link.id}
              >
                {link.label}
                <Icon name="external" size={18} />
                <span className="cw-visually-hidden">{labels.newTab}</span>
              </a>
            ))}
          </nav>
        ) : null}
      </GlassSurface>
    </article>
  )
}
