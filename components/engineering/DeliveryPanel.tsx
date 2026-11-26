import { GlassSurface } from '@/components/ui/GlassSurface'
import { DEPLOY_DAYS, WEEKS, type Dashboard } from '@/lib/engineering/dashboard'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { dateTime, integer, shortDate } from './format'
import { WeeklyBars } from './WeeklyBars'
import styles from './Engineering.module.scss'

type Props = { lang: Locale; dict: Dictionary; dashboard: Dashboard }

export const DELIVERY_SECTION_ID = 'eng-delivery'

function Deployments({ lang, dict, dashboard }: Props) {
  const deployments = dashboard.deployments
  if (!deployments) return <p data-cw-eng-deploys="none">{t(dict, 'engineering.delivery.noDeploys')}</p>
  return (
    <>
      {deployments.environments.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table} data-cw-eng-deploys={deployments.environments.length}>
            <caption className="cw-visually-hidden">{t(dict, 'engineering.delivery.deploys', { days: integer(deployments.days, lang) })}</caption>
            <thead>
              <tr>
                <th scope="col">{t(dict, 'engineering.delivery.environment')}</th>
                <th scope="col" className={styles.num}>
                  {t(dict, 'engineering.delivery.total')}
                </th>
                <th scope="col">{t(dict, 'engineering.delivery.states')}</th>
                <th scope="col">{t(dict, 'engineering.delivery.latest')}</th>
              </tr>
            </thead>
            <tbody>
              {deployments.environments.map((row) => (
                <tr key={row.environment}>
                  <th scope="row">{row.environment}</th>
                  <td className={styles.num}>{integer(row.total, lang)}</td>
                  <td>{row.byState.map((state) => `${state.state} ${integer(state.count, lang)}`).join(' · ')}</td>
                  <td>{row.latest ? `${shortDate(row.latest.date, lang)} · ${row.latest.sha}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p data-cw-eng-deploys="0">{t(dict, 'engineering.delivery.noDeploysYet')}</p>
      )}
      <p className={styles.source}>
        <strong>{t(dict, 'engineering.source')}:</strong> {t(dict, 'engineering.delivery.deploysSource', { date: dateTime(deployments.takenAt, lang) })}
      </p>
    </>
  )
}

export function DeliveryPanel({ lang, dict, dashboard }: Props) {
  return (
    <GlassSurface as="section" id={DELIVERY_SECTION_ID} className={styles.panel} aria-labelledby="eng-delivery-title" data-cw-eng-delivery="">
      <h2 id="eng-delivery-title" className={styles.h2}>
        {t(dict, 'engineering.delivery.title')}
      </h2>
      <div className={styles.split}>
        <div>
          <h3 className={styles.h4}>{t(dict, 'engineering.delivery.weekly', { weeks: integer(WEEKS, lang) })}</h3>
          {dashboard.weekly && dashboard.history ? (
            <>
              <WeeklyBars lang={lang} dict={dict} weeks={dashboard.weekly} id="eng-weekly" />
              <p className={styles.source}>
                <strong>{t(dict, 'engineering.source')}:</strong> {t(dict, 'engineering.delivery.weeklySource', { date: dateTime(dashboard.history.takenAt, lang) })}
              </p>
            </>
          ) : (
            <p data-cw-eng-weekly="none">{t(dict, 'engineering.delivery.noWeekly')}</p>
          )}
        </div>
        <div>
          <h3 className={styles.h4}>{t(dict, 'engineering.delivery.deploys', { days: integer(dashboard.deployments?.days ?? DEPLOY_DAYS, lang) })}</h3>
          <Deployments lang={lang} dict={dict} dashboard={dashboard} />
        </div>
      </div>
    </GlassSurface>
  )
}
