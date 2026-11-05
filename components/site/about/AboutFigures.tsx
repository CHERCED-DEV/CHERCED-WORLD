import type { CSSProperties } from 'react'
import type { Locale } from '@/lib/i18n'
import styles from './About.module.scss'
import { CountUp } from './CountUp'
import { figureDigits, figureText, type Figure, type FigureId } from './figures'

export type FigureLabels = Record<FigureId, { label: string; note?: string }>

export type AboutFiguresProps = { lang: Locale; title: string; figures: Figure[]; labels: FigureLabels }

export function AboutFigures({ lang, title, figures, labels }: AboutFiguresProps) {
  if (figures.length === 0) return null

  return (
    <section className={styles.figuresSection} aria-labelledby="about-figures" data-cw-about="figures">
      <h2 id="about-figures" className="cw-visually-hidden">
        {title}
      </h2>
      <dl className={styles.figures}>
        {figures.map((figure) => {
          const { label, note } = labels[figure.id]
          return (
            <div
              key={figure.id}
              className={styles.figure}
              data-cw-glass="standard"
              data-cw-light=""
              data-cw-figure={figure.id}
            >
              <span className={styles.figureAccent} aria-hidden="true" />
              <dt className={styles.figureLabel}>
                {label}
                {note ? <span className={styles.figureNote}>{note}</span> : null}
              </dt>
              <dd className={styles.figureValue}>
                <span className={styles.figureDigits} style={{ '--cw-digits': figureDigits(figure.value, lang).length } as CSSProperties}>
                  <CountUp value={figure.value} lang={lang} />
                </span>
                {figure.plus ? (
                  <span className={styles.figurePlus} aria-hidden="true">
                    +
                  </span>
                ) : null}
                <span className="cw-visually-hidden">{figureText(figure, lang)}</span>
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
