import type { CSSProperties } from 'react'
import { GlassSurface } from '@/components/ui/GlassSurface'
import styles from './About.module.scss'
import { CountUp } from './CountUp'
import type { Figure, FigureId } from './figures'

export type FigureLabels = Record<FigureId, { label: string; note?: string }>

export type AboutFiguresProps = { title: string; figures: Figure[]; labels: FigureLabels }

export function AboutFigures({ title, figures, labels }: AboutFiguresProps) {
  if (figures.length === 0) return null

  return (
    <section className={styles.figuresSection} aria-labelledby="about-figures" data-cw-about="figures">
      <h2 id="about-figures" className="cw-visually-hidden">
        {title}
      </h2>
      <dl className={styles.figures}>
        {figures.map((figure, index) => {
          const text = `${figure.value}${figure.plus ? '+' : ''}`
          const { label, note } = labels[figure.id]
          return (
            <GlassSurface
              key={figure.id}
              variant="standard"
              className={styles.figure}
              data-cw-figure={figure.id}
              style={{ '--cw-i': index } as CSSProperties}
            >
              <dt className={styles.figureLabel}>
                {label}
                {note ? <span className={styles.figureNote}>{note}</span> : null}
              </dt>
              <dd className={styles.figureValue}>
                <span className={styles.figureDigits} style={{ '--cw-digits': String(figure.value).length } as CSSProperties}>
                  <CountUp value={figure.value} />
                </span>
                {figure.plus ? (
                  <span className={styles.figurePlus} aria-hidden="true">
                    +
                  </span>
                ) : null}
                <span className="cw-visually-hidden">{text}</span>
              </dd>
            </GlassSurface>
          )
        })}
      </dl>
    </section>
  )
}
