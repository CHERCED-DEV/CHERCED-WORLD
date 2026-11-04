import Image from 'next/image'
import Link from 'next/link'
import type { Project, SiteContent } from '@/content/types'
import { localizedPath, type Locale } from '@/lib/i18n'
import styles from './Brain.module.scss'
import { BrainMap, type BrainLabels } from './BrainMap'
import { brainData } from './brain'
import { LevelBar } from './LevelBar'
import { monogram } from './monogram'

export type BrainSceneLabels = {
  map: Omit<BrainLabels, 'levels'>
  level: (value: number) => string
  present: string
  skillsSummary: string
}

export type BrainSceneProps = {
  lang: Locale
  about: SiteContent['about']
  projects: readonly Project[]
  labels: BrainSceneLabels
}

export function BrainScene({ lang, about, projects, labels }: BrainSceneProps) {
  const data = brainData(about, projects, lang, labels.present)
  const levels = Object.fromEntries(data.lobes.flatMap((lobe) => lobe.skills.map((skill) => [skill.id, labels.level(skill.level)])))
  const { map, skillsSummary } = labels
  const wordsLead = about.skills.description[lang].trim()
  const words = about.skills.bullets.map((bullet) => bullet[lang].trim()).filter((bullet) => bullet.length > 0)
  const lobeWords = data.lobes.filter((lobe) => lobe.words)
  const sourceLabel = (id: string) => data.sources.find((source) => source.id === id)?.label ?? id

  return (
    <>
      <BrainMap data={data} labels={{ ...map, levels }} lang={lang} />
      <div className={styles.fallback} data-cw-brain-fallback="">
        {data.lobes.map((lobe) => (
          <section key={lobe.id} className={styles.fallbackLobe} data-cw-glass="standard" data-cw-lobe-list={lobe.id} aria-labelledby={`lobe-${lobe.id}`}>
            <h3 id={`lobe-${lobe.id}`} className={styles.fallbackTitle}>
              {lobe.name}
            </h3>
            <ul className={styles.fallbackSkills}>
              {lobe.skills.map((skill) => (
                <li key={skill.id} className={styles.fallbackSkill} data-cw-brain-skill={skill.id}>
                  {skill.icon ? (
                    <Image src={skill.icon} alt="" width={22} height={22} unoptimized={skill.icon.endsWith('.svg')} className={styles.termIcon} />
                  ) : (
                    <span className={`${styles.termIcon} ${styles.termMonogram}`} aria-hidden="true">
                      {monogram(skill.name)}
                    </span>
                  )}
                  <span className={styles.termName}>{skill.name}</span>
                  {skill.used ? (
                    <span className={styles.usedChip} data-cw-used="">
                      {skill.used}
                    </span>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  <LevelBar value={skill.level} label={levels[skill.id] ?? `${skill.level}%`} />
                </li>
              ))}
            </ul>
            {lobe.learning ? (
              <p className={styles.termLearning} data-cw-learning="">
                {lobe.learning}
              </p>
            ) : null}
            {lobe.sources.length > 0 || lobe.projects.length > 0 ? (
              <p className={styles.termMeta}>
                {lobe.sources.length > 0 ? (
                  <span className={styles.metaLine} data-cw-meta="sources">
                    <strong>{map.sourcesWord}:</strong> {lobe.sources.map(sourceLabel).join(' · ')}
                  </span>
                ) : null}
                {lobe.projects.length > 0 ? (
                  <span className={styles.metaLine} data-cw-meta="projects">
                    <strong>{map.projectsWord}:</strong>{' '}
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
            ) : null}
          </section>
        ))}
        <section className={`${styles.fallbackLobe} ${styles.fallbackSources}`} data-cw-glass="standard" aria-labelledby="brain-sources">
          <h3 id="brain-sources" className={styles.fallbackTitle}>
            {map.sources}
          </h3>
          <dl className={styles.fallbackSourceList}>
            {data.sources.map((source) => (
              <div key={source.id} data-cw-source-item={source.id}>
                <dt>
                  {source.label} · {source.title}
                </dt>
                {source.detail || source.period ? (
                  <dd>
                    {source.detail}
                    {source.period ? `${source.detail ? ' ' : ''}(${source.period})` : null}
                  </dd>
                ) : null}
              </div>
            ))}
          </dl>
          <a className={styles.termLink} href={map.platzi.href} target="_blank" rel="noopener noreferrer" data-cw-platzi="">
            {map.platzi.label}
            <span className="cw-visually-hidden">{map.platzi.newTab}</span>
          </a>
        </section>
      </div>
      {wordsLead || words.length > 0 || lobeWords.length > 0 ? (
        <details className={styles.words} data-cw-glass="standard" data-cw-words="">
          <summary className={styles.wordsSummary}>{skillsSummary}</summary>
          {lobeWords.map((lobe) => (
            <section key={lobe.id} className={styles.wordsLobe} data-cw-words-lobe={lobe.id} aria-labelledby={`words-${lobe.id}`}>
              <h3 id={`words-${lobe.id}`} className={styles.wordsTitle}>
                {lobe.name}
              </h3>
              <p className={styles.wordsText}>{lobe.words}</p>
            </section>
          ))}
          {wordsLead ? <p className={styles.wordsText}>{wordsLead}</p> : null}
          {words.length > 0 ? (
            <ul className={styles.wordsList}>
              {words.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </details>
      ) : null}
    </>
  )
}
