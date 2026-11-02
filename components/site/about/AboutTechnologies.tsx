import type { TechSkill } from '@/content/types'
import { SectionTitle } from '../SectionTitle'
import styles from './About.module.scss'
import { TechList, type TechItem } from './TechList'

export type AboutTechnologiesProps = {
  title: string
  tech: TechSkill[]
  levelLabel: (value: number) => string
  showMore: string
  showLess: string
}

export function AboutTechnologies({ title, tech, levelLabel, showMore, showLess }: AboutTechnologiesProps) {
  const items: TechItem[] = tech.map((skill) => ({
    id: skill.id,
    name: skill.name,
    icon: skill.icon,
    level: skill.progress,
    levelLabel: levelLabel(skill.progress),
  }))

  return (
    <section className={styles.section} aria-labelledby="about-technologies" data-cw-about="technologies">
      <SectionTitle id="about-technologies">{title}</SectionTitle>
      <TechList items={items} showMore={showMore} showLess={showLess} />
    </section>
  )
}
