import type { CSSProperties } from 'react'
import { Sweep } from '@/components/ui/Sweep'
import type { Locale } from '@/lib/i18n'
import styles from './About.module.scss'
import { CountUp } from './CountUp'
import { figureDigits, figureText, type Figure, type FigureId } from './figures'

export type FigureLabels = Record<FigureId, { label: string; note?: string }>

export const FIGURE_FLOATS = [1, 3, 2, 1] as const

export function digitsStyle(digits: string): CSSProperties {
  const count = digits.replace(/\D/g, '').length
  return { '--cw-digits': count, '--cw-separators': digits.length - count } as CSSProperties
}

export type AboutFiguresProps ={ lang: Locale; title: string; figures: Figure[]; labels: FigureLabels }

export function AboutFigures({ lang, title, figures, labels }: AboutFiguresProps) {
  if (figures.length === 0) return null

  return (
    <section className={styles.figuresSection} aria-labelledby="about-figures" data-cw-about="figures">
      <h2 id="about-figures" className="cw-visually-hidden">
        {title}
      </h2>
      <dl className={styles.figures}>
        {figures.map((figure, index) => {
          const { label, note } = labels[figure.id]
          return (
            <div
              key={figure.id}
              className={styles.figure}
              data-cw-glass="standard"
              data-cw-light=""
              data-cw-figure={figure.id}
              data-cw-float={FIGURE_FLOATS[index % FIGURE_FLOATS.length]}
            >
              <span className={styles.figureAccent} aria-hidden="true" />
              <dt className={styles.figureLabel}>
                {label}
                {note ? <span className={styles.figureNote}>{note}</span> : null}
              </dt>
              <dd className={styles.figureValue}>
                <span className={styles.figureDigits} style={digitsStyle(figureDigits(figure.value, lang))}>
                  <CountUp value={figure.value} lang={lang} />
                </span>
                {figure.plus ? (
                  <span className={styles.figurePlus} aria-hidden="true">
                    +
                  </span>
                ) : null}
                <span className="cw-visually-hidden">{figureText(figure, lang)}</span>
                <Sweep />
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
