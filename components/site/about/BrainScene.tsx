import Image from 'next/image'
import type { Project, SiteContent } from '@/content/types'
import type { Locale } from '@/lib/i18n'
import styles from './Brain.module.scss'
import { BrainMap, type BrainLabels } from './BrainMap'
import { brainData, lobeAnchor } from './brain'
import { LevelBar } from './LevelBar'
import { LobeMeta, LobePrinciples } from './LobeParts'
import { monogram } from './monogram'
import { terminalTable } from './terminalTable'

export type BrainSceneLabels = {
  map: Omit<BrainLabels, 'levels'>
  level: (value: number) => string
  present: string
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
  const { map } = labels
  const sourceLabel = (id: string) => data.sources.find((source) => source.id === id)?.label ?? id

  return (
    <BrainMap data={data} labels={{ ...map, levels }} lang={lang} terminal={terminalTable(lang)}>
      <div className={styles.fallback} data-cw-brain-fallback="">
        {data.lobes.map((lobe) => (
          <section key={lobe.id} className={styles.fallbackLobe} data-cw-glass="standard" data-cw-lobe-list={lobe.id} aria-labelledby={lobeAnchor(lobe.id)}>
            <h3 id={lobeAnchor(lobe.id)} className={styles.fallbackTitle}>
              {lobe.name}
            </h3>
            <ul className={styles.fallbackSkills}>
              {lobe.skills.map((skill) => (
                <li key={skill.id} className={styles.fallbackSkill} data-cw-brain-skill={skill.id}>
                  {skill.icon ? (
                    <Image src={skill.icon} alt="" width={22} height={22} unoptimized={skill.icon.endsWith('.svg')} className={styles.termIcon} />
                  ) : (
                    <span className={`${styles.termIcon} ${styles.termMonogram}`} data-cw-monogram={monogram(skill.name)} aria-hidden="true" />
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
            <LobePrinciples lobe={lobe} label={map.principles} idPrefix="list" />
            {lobe.learning ? (
              <p className={styles.termLearning} data-cw-learning="">
                {lobe.learning}
              </p>
            ) : null}
            <LobeMeta lobe={lobe} lang={lang} labels={map} sourceLabel={sourceLabel} />
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
    </BrainMap>
  )
}
