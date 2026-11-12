import Link from 'next/link'
import type { NowContent } from '@/content/types'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks, GlowOrb, GridLines, Hairline } from '@/components/ui/graphics'
import { Reveal } from '@/components/ui/Reveal'
import { localizedPath, type Locale } from '@/lib/i18n'
import { splitAround } from '../home/now'
import { SectionTitle } from '../SectionTitle'
import { typeset } from '../typeset'
import { formatNowDate, nowBlocks, nowMottos, type NowBlockId, type NowLine } from './model'
import styles from './Now.module.scss'

export type NowLabels = Record<NowBlockId | 'title' | 'lead' | 'updated' | 'mottos', string>

export type NowViewProps = { lang: Locale; now: NowContent; labels: NowLabels }

const STAGGER = 70

function Lead({ text, href, locale }: { text: string; href?: string; locale: Locale }) {
  if (!href) return <strong className={styles.lead}>{typeset(text, locale, { keepHyphens: true })}</strong>
  return (
    <strong className={styles.lead}>
      <Link href={localizedPath(locale, href)} className={styles.leadLink} data-cw-now-link={href}>
        {typeset(text.slice(0, -1), locale, { keepHyphens: true })}
      </Link>
      {text.slice(-1)}
    </strong>
  )
}

function Line({ line, locale }: { line: NowLine; locale: Locale }) {
  return (
    <p className={styles.text} lang={line.lang}>
      {line.lead ? (
        <>
          <Lead text={line.lead} href={line.href} locale={locale} />{' '}
        </>
      ) : null}
      {line.lang ? line.rest : typeset(line.rest, locale, { keepHyphens: true })}
    </p>
  )
}

export function NowView({ lang, now, labels }: NowViewProps) {
  const blocks = nowBlocks(now, lang)
  const mottos = nowMottos(now, lang)
  const [updatedBefore, updatedAfter] = splitAround(labels.updated, 'date')

  return (
    <div className={styles.page} data-cw-now="">
      <header id="section-now" className={styles.hero}>
        <SectionTitle as="h1" id="now-title" size="lg">
          {labels.title}
        </SectionTitle>
        <p className={styles.updated} data-cw-now-updated="">
          <span className={styles.live} aria-hidden="true" />
          <span>
            {updatedBefore}
            <time dateTime={now.updatedAt}>{formatNowDate(now.updatedAt, lang)}</time>
            {updatedAfter}
          </span>
        </p>
        <p className={styles.intro}>{labels.lead}</p>
      </header>

      <div className={styles.board}>
        {blocks.map((block, index) => {
          const wide = block.lines.length > 1
          const headingId = `now-${block.id}`
          return (
            <Reveal key={block.id} className={cx(styles.cell, wide && styles.wide)} delay={index * STAGGER}>
              <GlassSurface
                as="section"
                id={`section-${block.id}`}
                className={styles.panel}
                aria-labelledby={headingId}
                edge
                grain
                depth
                light
                data-cw-now-block={block.id}
              >
                {wide ? <CornerMarks /> : null}
                <div className={styles.head}>
                  <h2 id={headingId} className={styles.heading}>
                    {labels[block.id]}
                  </h2>
                  <Hairline glint={wide} className={styles.headLine} />
                </div>
                {wide ? (
                  <ol className={styles.numbered}>
                    {block.lines.map((line, position) => (
                      <li key={position} className={styles.step}>
                        <Line line={line} locale={lang} />
                      </li>
                    ))}
                  </ol>
                ) : (
                  <ul className={styles.list}>
                    {block.lines.map((line, position) => (
                      <li key={position}>
                        <Line line={line} locale={lang} />
                      </li>
                    ))}
                  </ul>
                )}
              </GlassSurface>
            </Reveal>
          )
        })}
      </div>

      {mottos.length > 0 ? (
        <Reveal className={styles.cell} delay={blocks.length * STAGGER}>
          <GlassSurface
            as="section"
            id="section-mottos"
            variant="strong"
            className={styles.mottos}
            aria-labelledby="now-mottos"
            edge
            grain
            depth
            data-cw-now-block="mottos"
          >
            <GridLines fade="radial" />
            <GlowOrb size="sm" x="50%" y="0%" />
            <h2 id="now-mottos" className={styles.heading}>
              {labels.mottos}
            </h2>
            <ul className={styles.mottoList}>
              {mottos.map((motto) => (
                <li key={motto.text} className={styles.motto} lang={motto.lang} data-cw-now-motto="">
                  {motto.text}
                </li>
              ))}
            </ul>
          </GlassSurface>
        </Reveal>
      ) : null}
    </div>
  )
}
