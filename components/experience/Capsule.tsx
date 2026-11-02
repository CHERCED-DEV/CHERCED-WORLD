'use client'

import Image from 'next/image'
import { useEffect, useId, useState } from 'react'
import type { CapsuleEntry } from '@/content/types'
import { Dialog } from '@/components/ui/Dialog'
import { Icon } from '@/components/ui/Icon'
import { cx } from '@/components/ui/cx'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translate'
import styles from './Capsule.module.scss'
import { CAPSULE_CAPTURED_AT, CAPSULE_SHOTS, capsuleShotSrc, type CapsuleDevice } from './capsule-shots'
import type { ExperienceLabels } from './labels'
import { rememberCapsuleFound } from './preferences'

export type CapsuleProps = {
  lang: Locale
  labels: ExperienceLabels
  entries: CapsuleEntry[]
  open: boolean
  discovered: boolean
  onClose: () => void
}

const DEVICES: CapsuleDevice[] = ['desktop', 'mobile']

function formatDay(lang: Locale, value: string): string {
  return new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

function prefersMobile(): boolean {
  try {
    return window.matchMedia('(max-width: 767.98px)').matches
  } catch {
    return false
  }
}

export function Capsule({ lang, labels, entries, open, discovered, onClose }: CapsuleProps) {
  const titleId = useId()
  const introId = useId()
  const screensId = useId()
  const timelineId = useId()
  const [device, setDevice] = useState<CapsuleDevice>(() => (prefersMobile() ? 'mobile' : 'desktop'))

  useEffect(() => {
    if (open) rememberCapsuleFound()
  }, [open])

  const deviceLabel = (value: CapsuleDevice) => t(labels, value === 'desktop' ? 'capsule.desktop' : 'capsule.mobile')

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} describedBy={introId} className={styles.capsule}>
      <div className={styles.body} data-cw-capsule="">
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {t(labels, 'capsule.title')}
          </h2>
          <button type="button" className={styles.close} aria-label={t(labels, 'capsule.close')} onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>
        {discovered ? <p className={styles.found}>{t(labels, 'capsule.found')}</p> : null}
        <p id={introId} className={styles.intro}>
          {t(labels, 'capsule.intro', { date: formatDay(lang, CAPSULE_CAPTURED_AT) })}
        </p>

        <section aria-labelledby={screensId} className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 id={screensId} className={styles.subtitle}>
              {t(labels, 'capsule.screens')}
            </h3>
            <div role="group" aria-labelledby={screensId} className={styles.toggle}>
              {DEVICES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={device === value}
                  className={cx(styles.toggleButton, device === value && styles.toggleActive)}
                  onClick={() => setDevice(value)}
                >
                  {deviceLabel(value)}
                </button>
              ))}
            </div>
          </div>
          <ul className={cx(styles.shots, styles[device])}>
            {CAPSULE_SHOTS.map((shot) => {
              const alt = t(labels, 'capsule.shotAlt', { route: shot.route, device: deviceLabel(device).toLocaleLowerCase(lang) })
              return (
                <li key={shot.slug}>
                  <figure className={styles.figure}>
                    <div className={styles.frame} tabIndex={0} role="region" aria-label={alt}>
                      <Image
                        src={capsuleShotSrc(shot, device)}
                        alt={alt}
                        width={shot.size[device].width}
                        height={shot.size[device].height}
                        sizes={device === 'desktop' ? '(min-width: 992px) 480px, 100vw' : '(min-width: 768px) 240px, 50vw'}
                        loading="lazy"
                        unoptimized
                        className={styles.image}
                      />
                    </div>
                    <figcaption className={styles.caption}>
                      <code>{shot.route}</code>
                    </figcaption>
                  </figure>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby={timelineId} className={styles.section}>
          <h3 id={timelineId} className={styles.subtitle}>
            {t(labels, 'capsule.timeline')}
          </h3>
          <ol className={styles.timeline}>
            {entries.map((entry, index) => (
              <li key={`${entry.date}-${index}`} className={styles.entry}>
                <time dateTime={entry.date} className={styles.date}>
                  {formatDay(lang, entry.date)}
                </time>
                <q lang="en" className={styles.commit}>
                  {entry.message}
                </q>
                {entry.note ? <p className={styles.note}>{entry.note[lang]}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Dialog>
  )
}
