'use client'

import { useId } from 'react'
import type { LabTranslate } from '@/components/ailab/shell/types'
import { DESPACHO_CASE, despachoEvidence } from '@/content/ailab/showcases/despacho'
import type { Locale } from '@/lib/i18n/config'
import { MadeUp } from './MadeUp'
import styles from './Showcases.module.scss'

export function DespachoShowcase({ lang, t }: { lang: Locale; t: LabTranslate }) {
  const uid = useId()
  const data = DESPACHO_CASE
  const ids = { title: `${uid}-title`, material: `${uid}-material`, facts: `${uid}-facts`, timeline: `${uid}-timeline` }

  return (
    <article className={styles.showcase} aria-labelledby={ids.title} data-cw-showcase="despacho">
      <header className={styles.intro}>
        <MadeUp text={t('ailab.a4.despacho.madeUp')} />
        <h5 id={ids.title} className={styles.title}>
          {data.title[lang]}
        </h5>
        <p className={styles.lead}>{data.summary[lang]}</p>
        <p className={styles.note}>{t('ailab.a4.despacho.pregenerated')}</p>
      </header>

      <div className={styles.columns}>
        <section className={styles.block} aria-labelledby={ids.material} data-cw-despacho="material">
          <h6 id={ids.material} className={styles.blockTitle}>
            {t('ailab.a4.despacho.material')}
          </h6>
          <ul className={styles.evidence}>
            {data.evidence.map((item) => (
              <li key={item.id} className={styles.evidenceItem} data-cw-evidence={item.id}>
                <span className={styles.code}>{item.id}</span>
                <span className={styles.evidenceBody}>
                  <span className={styles.evidenceTitle}>{item.title[lang]}</span>
                  <span className={styles.meta}>{t('ailab.a4.despacho.by', { who: item.by[lang], date: item.date[lang] })}</span>
                  {item.note ? <span className={styles.meta}>{item.note[lang]}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.block} aria-labelledby={ids.facts} data-cw-despacho="facts">
          <h6 id={ids.facts} className={styles.blockTitle}>
            {t('ailab.a4.despacho.facts')}
          </h6>
          <ol className={styles.facts}>
            {data.facts.map((fact) => (
              <li key={fact.id} className={styles.fact} data-cw-fact={fact.id} data-status={fact.status}>
                <p className={styles.factHead}>
                  <span className={styles.code}>{fact.id}</span>
                  <span className={styles.factText}>{fact.text[lang]}</span>
                </p>
                <p className={styles.tag} data-status={fact.status}>
                  <span className="cw-visually-hidden">{t('ailab.a4.despacho.status.label')}: </span>
                  {t(`ailab.a4.despacho.status.${fact.status}`)}
                </p>
                <ul className={styles.links}>
                  {fact.links.map((link) => (
                    <li key={`${link.evidence}-${link.relation}`} className={styles.link} data-relation={link.relation}>
                      <span className={styles.relation} data-relation={link.relation}>
                        {t(`ailab.a4.despacho.relation.${link.relation}`)}
                      </span>
                      <span>
                        <span className={styles.ref}>
                          {link.evidence} · {despachoEvidence(link.evidence).title[lang]}
                        </span>{' '}
                        <span className={styles.meta}>{link.note[lang]}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {fact.missing ? (
                  <p className={styles.missing} data-cw-fact-missing="">
                    <strong>{t('ailab.a4.despacho.missing')}</strong> {fact.missing[lang]}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className={styles.block} aria-labelledby={ids.timeline} data-cw-despacho="timeline">
        <h6 id={ids.timeline} className={styles.blockTitle}>
          {t('ailab.a4.despacho.timeline')}
        </h6>
        <ol className={styles.timeline}>
          {data.timeline.map((entry) =>
            entry.kind === 'gap' ? (
              <li key={entry.id} className={styles.moment} data-cw-timeline="gap">
                <span className={styles.date}>{entry.date[lang]}</span>
                <span className={styles.certainty} data-certainty="gap">
                  {t('ailab.a4.despacho.gap')}
                </span>
                <p className={styles.momentText}>{entry.note[lang]}</p>
              </li>
            ) : (
              <li key={entry.id} className={styles.moment} data-cw-timeline="event" data-certainty={entry.certainty}>
                <span className={styles.date}>{entry.date[lang]}</span>
                <span className={styles.certainty} data-certainty={entry.certainty}>
                  <span className="cw-visually-hidden">{t('ailab.a4.despacho.certainty.label')}: </span>
                  {t(`ailab.a4.despacho.certainty.${entry.certainty}`)}
                </span>
                <p className={styles.momentText}>{entry.event[lang]}</p>
                <p className={styles.meta}>
                  {t('ailab.a4.despacho.sources', { sources: entry.sources.join(', ') })}
                  {entry.note ? ` · ${entry.note[lang]}` : ''}
                </p>
              </li>
            ),
          )}
        </ol>
      </section>

      <p className={styles.limits} data-cw-despacho="limits">
        {t('ailab.a4.despacho.limits')}
      </p>
    </article>
  )
}
