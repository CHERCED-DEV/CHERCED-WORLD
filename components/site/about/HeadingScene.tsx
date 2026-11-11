import type { HeadingContent } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import { typeset } from '../typeset'
import aboutStyles from './About.module.scss'
import styles from './Heading.module.scss'

export type HeadingSceneProps = { id: string; lang: Locale; content: HeadingContent; mapLabel: string }

function number(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export function HeadingScene({ id, lang, content, mapLabel }: HeadingSceneProps) {
  return (
    <section
      id={id}
      className={`${aboutStyles.section} ${aboutStyles.scene}`}
      aria-labelledby="about-heading"
      data-cw-about="heading"
      data-cw-scene="heading"
    >
      <SectionTitle id="about-heading">{content.title[lang]}</SectionTitle>
      <p className={styles.intro}>{typeset(content.intro[lang], lang)}</p>
      <nav className={styles.map} aria-label={mapLabel} data-cw-heading-map="">
        <GlassSurface variant="strong" grain depth edge className={styles.hub}>
          <p className={styles.hubLabel}>{content.hub[lang]}</p>
          <ul className={styles.today}>
            {content.today.map((item) => (
              <li key={item.en} className={styles.todayItem}>
                {item[lang]}
              </li>
            ))}
          </ul>
        </GlassSurface>
        <ol className={styles.routes}>
          {content.directions.map((direction, index) => (
            <li key={direction.id} className={styles.route}>
              <a href={`#heading-${direction.id}`} className={styles.routeLink} data-cw-heading-route={direction.id}>
                <span className={styles.routeNumber} aria-hidden="true">
                  {number(index)}
                </span>
                <span>{direction.title[lang]}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <ul className={styles.cards}>
        {content.directions.map((direction, index) => (
          <li key={direction.id} id={`heading-${direction.id}`} className={styles.cardItem} data-cw-heading-direction={direction.id}>
            <GlassSurface variant="strong" grain depth edge light className={styles.card}>
              <p className={styles.cardNumber} aria-hidden="true">
                {number(index)}
              </p>
              <h3 className={styles.cardTitle}>{direction.title[lang]}</h3>
              <p className={styles.cardText}>{typeset(direction.text[lang], lang)}</p>
            </GlassSurface>
          </li>
        ))}
      </ul>
    </section>
  )
}
