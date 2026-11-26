import Link from 'next/link'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Dashboard, SpecRow } from '@/lib/engineering/dashboard'
import { SPEC_STATUSES } from '@/lib/engineering/specs'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { dateTime, integer } from './format'
import { localized, specPath } from './links'
import styles from './Engineering.module.scss'

type Props = { lang: Locale; dict: Dictionary; dashboard: Dashboard }

export const SPECS_SECTION_ID = 'eng-specs'

export const SPEC_GROUP_SIZE = 10

export type SpecGroup = { from: string; to: string; specs: SpecRow[] }

export function specGroups(specs: readonly SpecRow[], size = SPEC_GROUP_SIZE): SpecGroup[] {
  const groups = new Map<number, SpecRow[]>()
  for (const spec of specs) {
    const key = Math.floor((Number(spec.number) - 1) / size)
    groups.set(key, [...(groups.get(key) ?? []), spec])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([key, list]) => ({ from: String(key * size + 1).padStart(3, '0'), to: String((key + 1) * size).padStart(3, '0'), specs: list }))
}

export function NoData({ dict }: { dict: Dictionary }) {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="cw-visually-hidden">{t(dict, 'engineering.noData')}</span>
    </>
  )
}

export function StatusBadge({ dict, status }: { dict: Dictionary; status: SpecRow['status'] }) {
  return (
    <span className={styles.status} data-status={status}>
      {t(dict, `engineering.status.${status}`)}
    </span>
  )
}

function Row({ lang, dict, spec }: { lang: Locale; dict: Dictionary; spec: SpecRow }) {
  return (
    <tr data-cw-eng-row={spec.number}>
      <th scope="row" className={styles.titleCell}>
        <Link className={styles.specLink} href={localized(lang, specPath(spec.number))} prefetch={false}>
          <strong>{spec.number}</strong> <span lang="es">{spec.title}</span>
        </Link>
      </th>
      <td>
        <StatusBadge dict={dict} status={spec.status} />
      </td>
      <td className={styles.num}>{integer(spec.requirements.length, lang)}</td>
      <td className={styles.num}>{integer(spec.trace.tested.length, lang)}</td>
      <td className={styles.num}>{integer(spec.commits.length, lang)}</td>
      <td className={styles.num}>{spec.days === null ? <NoData dict={dict} /> : integer(spec.days, lang)}</td>
    </tr>
  )
}

function Group({ lang, dict, group, open }: { lang: Locale; dict: Dictionary; group: SpecGroup; open: boolean }) {
  const label = t(dict, 'engineering.specs.group', { from: group.from, to: group.to, count: integer(group.specs.length, lang) })
  return (
    <details className={styles.group} open={open} data-cw-eng-group={group.from}>
      <summary>{label}</summary>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="cw-visually-hidden">{label}</caption>
          <thead>
            <tr>
              <th scope="col">{t(dict, 'engineering.specs.col.spec')}</th>
              <th scope="col">{t(dict, 'engineering.specs.col.status')}</th>
              <th scope="col" className={styles.num}>
                {t(dict, 'engineering.specs.col.requirements')}
              </th>
              <th scope="col" className={styles.num}>
                {t(dict, 'engineering.specs.col.tested')}
              </th>
              <th scope="col" className={styles.num}>
                {t(dict, 'engineering.specs.col.commits')}
              </th>
              <th scope="col" className={styles.num}>
                {t(dict, 'engineering.specs.col.days')}
              </th>
            </tr>
          </thead>
          <tbody>
            {group.specs.map((spec) => (
              <Row key={spec.dir} lang={lang} dict={dict} spec={spec} />
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export function SpecsTable({ lang, dict, dashboard }: Props) {
  const groups = specGroups(dashboard.specs)
  const counted = SPEC_STATUSES.filter((status) => dashboard.statusCounts[status] > 0)
  return (
    <GlassSurface as="section" id={SPECS_SECTION_ID} className={styles.panel} aria-labelledby="eng-specs-title" data-cw-eng-specs={dashboard.specs.length}>
      <h2 id="eng-specs-title" className={styles.h2}>
        {t(dict, 'engineering.specs.title')}
      </h2>
      <p>{t(dict, 'engineering.specs.intro')}</p>
      <p className={styles.headline}>{t(dict, 'engineering.specs.count', { count: integer(dashboard.specs.length, lang) })}</p>
      <ul className={styles.statusList} aria-label={t(dict, 'engineering.specs.col.status')}>
        {counted.map((status) => (
          <li key={status} className={styles.status} data-status={status} data-cw-eng-status-count={status}>
            {integer(dashboard.statusCounts[status], lang)} {t(dict, `engineering.status.${status}`)}
          </li>
        ))}
      </ul>
      <p data-cw-eng-history={dashboard.history ? dashboard.history.head : 'none'}>
        {dashboard.history
          ? t(dict, 'engineering.specs.history', { date: dateTime(dashboard.history.takenAt, lang), sha: dashboard.history.head, count: integer(dashboard.history.commits, lang) })
          : t(dict, 'engineering.specs.noHistory')}
      </p>
      <p className={styles.muted}>{t(dict, 'engineering.specs.rule')}</p>
      <div className={styles.groups}>
        {groups.map((group, index) => (
          <Group key={group.from} lang={lang} dict={dict} group={group} open={index === groups.length - 1} />
        ))}
      </div>
      <p className={styles.muted}>{t(dict, 'engineering.specs.titlesNote')}</p>
      <p className={styles.source}>
        <strong>{t(dict, 'engineering.source')}:</strong> {t(dict, 'engineering.specs.source')}
      </p>
    </GlassSurface>
  )
}
