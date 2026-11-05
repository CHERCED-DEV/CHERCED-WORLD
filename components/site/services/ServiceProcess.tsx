import type { CSSProperties } from 'react'
import type { ServicesContent } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Reveal } from '@/components/ui/Reveal'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import { stepParts } from './model'
import styles from './Services.module.scss'

export type ServiceProcessProps = {
  lang: Locale
  process: ServicesContent['process']
  principlesTitle: string
}

export function ServiceProcess({ lang, process, principlesTitle }: ServiceProcessProps) {
  return (
    <section className={styles.block} aria-labelledby="services-process" data-cw-services-block="process">
      <SectionTitle id="services-process">{process.title[lang]}</SectionTitle>
      <GlassSurface variant="standard" grain depth edge className={styles.process}>
        <Reveal as="ol" className={styles.steps} data-cw-steps="">
          {process.steps.map((step, index) => {
            const { name, text } = stepParts(step[lang])
            return (
              <li key={step[lang]} className={styles.step} style={{ '--_i': index } as CSSProperties} data-cw-step="">
                {name ? (
                  <>
                    <strong className={styles.stepName}>{name}</strong>
                    <span className="cw-visually-hidden"> — </span>
                  </>
                ) : null}
                <span className={styles.stepText}>{text}</span>
                <span className={styles.stepGlow} aria-hidden="true" data-cw-step-glow="" />
                {index < process.steps.length - 1 ? <span className={styles.stepFill} aria-hidden="true" data-cw-step-fill="" /> : null}
              </li>
            )
          })}
        </Reveal>
        <div className={styles.principles} data-cw-principles="">
          <h3 className={styles.principlesTitle}>{principlesTitle}</h3>
          <ul className={styles.principleList}>
            {process.principles.map((principle) => (
              <li key={principle[lang]}>{principle[lang]}</li>
            ))}
          </ul>
        </div>
      </GlassSurface>
    </section>
  )
}
