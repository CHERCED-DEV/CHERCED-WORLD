import Link from 'next/link'
import type { ReactNode } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { fill } from '@/lib/ailab/route/progress'
import type { RouteLinkView, RouteStationView } from '@/lib/ailab/route/view'
import type { StationCardLabels } from './labels'
import styles from './StationCard.module.scss'

type Props = {
  station: RouteStationView
  total: number
  labels: StationCardLabels
  mark?: ReactNode
  extra?: ReactNode
  fallback?: ReactNode
}

function Destination({ link, className, external, open }: { link: RouteLinkView; className?: string; external: string; open?: string }) {
  if (link.external) {
    return (
      <a href={link.href} className={className} target="_blank" rel="noopener noreferrer" data-cw-route-open={open}>
        {link.label}
        <span className="cw-visually-hidden"> {external}</span>
      </a>
    )
  }
  return (
    <Link href={link.href} className={className} prefetch={false} data-cw-route-open={open}>
      {link.label}
    </Link>
  )
}

export function StationCard({ station, total, labels, mark, extra, fallback }: Props) {
  const anchor = `estacion-${station.id}`
  const meta = [
    station.position !== null ? fill(labels.count, { n: station.position, total }) : null,
    fill(labels.minutes, { minutes: station.minutes }),
    fill(labels.spec, { spec: station.spec }),
  ].filter(Boolean)
  return (
    <GlassSurface
      as="article"
      id={anchor}
      className={styles.card}
      aria-labelledby={`${anchor}-title`}
      data-cw-route-station={station.id}
      data-cw-route-core={station.core ? '' : undefined}
      edge
      grain
    >
      <header className={styles.head}>
        <p className={styles.meta}>{meta.join(' · ')}</p>
        <h3 id={`${anchor}-title`} className={styles.title} tabIndex={-1}>
          {station.title}
        </h3>
        {station.also.length ? (
          <ul className={styles.tags}>
            {station.also.map((item) => (
              <li key={item.proof} className={styles.tag} data-cw-route-also={item.proof}>
                {fill(labels.also, { n: item.proof, title: item.title })}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className={styles.body}>
        <h4 className={styles.label}>{labels.goal}</h4>
        <p className={styles.goal}>{station.goal}</p>

        <h4 className={styles.label}>{labels.steps}</h4>
        <ol className={styles.steps}>
          {station.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {station.tip ? <p className={styles.tip}>{station.tip}</p> : null}

        <p className={styles.action}>
          <Destination link={station.action} className={buttonClassName({ variant: 'solid' })} external={labels.external} open={station.id} />
        </p>

        <h4 className={styles.label}>{labels.evidence}</h4>
        <ul className={styles.evidence} data-cw-route-evidence="">
          {station.evidence.map((item) => (
            <li key={item.id} data-cw-route-evidence-id={item.id}>
              {item.text}
            </li>
          ))}
        </ul>

        {station.links.length ? (
          <>
            <h4 className={styles.label}>{labels.links}</h4>
            <ul className={styles.links} data-cw-route-links="">
              {station.links.map((link) => (
                <li key={link.href}>
                  <Destination link={link} className={styles.link} external={labels.external} />
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {extra}

        {station.offline ? (
          <aside className={styles.offline} aria-label={labels.offline} data-cw-route-offline="">
            <h4 className={styles.label}>{labels.offline}</h4>
            <p>{station.offline}</p>
            {fallback}
          </aside>
        ) : null}
      </div>

      {mark}
    </GlassSurface>
  )
}
