import Link from 'next/link'
import { localizedPath, type Locale } from '@/lib/i18n'
import styles from './Brain.module.scss'
import type { BrainLobe } from './brain'

export type LobeMetaLabels = { appliedWord: string; sourcesWord: string; projectsWord: string }

export type LobeMetaProps = { lobe: BrainLobe; lang: Locale; labels: LobeMetaLabels; sourceLabel: (id: string) => string }

export function LobeMeta({ lobe, lang, labels, sourceLabel }: LobeMetaProps) {
  if (lobe.applied.length === 0 && lobe.learned.length === 0 && lobe.projects.length === 0) return null
  return (
    <p className={styles.termMeta}>
      {lobe.applied.length > 0 ? (
        <span className={styles.metaLine} data-cw-meta="applied">
          <strong>{labels.appliedWord}:</strong> {lobe.applied.map(sourceLabel).join(' · ')}
        </span>
      ) : null}
      {lobe.learned.length > 0 ? (
        <span className={styles.metaLine} data-cw-meta="sources">
          <strong>{labels.sourcesWord}:</strong> {lobe.learned.map(sourceLabel).join(' · ')}
        </span>
      ) : null}
      {lobe.projects.length > 0 ? (
        <span className={styles.metaLine} data-cw-meta="projects">
          <strong>{labels.projectsWord}:</strong>{' '}
          {lobe.projects.map((project, index) => (
            <span key={project.id}>
              {index > 0 ? ' · ' : null}
              <Link href={localizedPath(lang, `/portfolio/${project.id}`)} className={styles.termLink}>
                {project.title}
              </Link>
            </span>
          ))}
        </span>
      ) : null}
    </p>
  )
}

export function LobePrinciples({ lobe, label, idPrefix }: { lobe: BrainLobe; label: string; idPrefix: string }) {
  if (!lobe.principles || lobe.principles.length === 0) return null
  const id = `${idPrefix}-principles-${lobe.id}`
  return (
    <div className={styles.principles} data-cw-principles="">
      <p id={id} className={styles.principlesLabel}>
        {label}
      </p>
      <ul className={styles.principleChips} aria-labelledby={id}>
        {lobe.principles.map((principle) => (
          <li key={principle} className={styles.principleChip} data-cw-principle="">
            {principle}
          </li>
        ))}
      </ul>
    </div>
  )
}
