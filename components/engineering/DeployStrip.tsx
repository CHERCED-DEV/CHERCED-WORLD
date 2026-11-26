import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Dashboard } from '@/lib/engineering/dashboard'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { dateTime, integer, pluralKey } from './format'
import { commitUrl } from './links'
import styles from './Engineering.module.scss'

type Props = { lang: Locale; dict: Dictionary; dashboard: Dashboard }

export const DEPLOY_SECTION_ID = 'eng-deploy'

function testsLine(dashboard: Dashboard, lang: Locale, dict: Dictionary): string {
  const report = dashboard.vitest
  if (!report) return t(dict, 'engineering.deploy.noReport')
  const vars = { passed: integer(report.passed, lang), total: integer(report.total, lang) }
  const head = report.files === null ? t(dict, 'engineering.deploy.passedShort', vars) : t(dict, 'engineering.deploy.passed', { ...vars, files: integer(report.files, lang) })
  const extra = [
    report.failed > 0 ? t(dict, `engineering.deploy.failed.${pluralKey(report.failed, lang)}`, { count: integer(report.failed, lang) }) : null,
    report.skipped > 0 ? t(dict, `engineering.deploy.skipped.${pluralKey(report.skipped, lang)}`, { count: integer(report.skipped, lang) }) : null,
  ].filter(Boolean)
  return [head, ...extra].join(' ')
}

export function DeployStrip({ lang, dict, dashboard }: Props) {
  const { deploy, vitest } = dashboard
  return (
    <GlassSurface as="section" id={DEPLOY_SECTION_ID} className={styles.panel} aria-labelledby="eng-deploy-title" data-cw-eng-deploy="">
      <h2 id="eng-deploy-title" className={styles.h2}>
        {t(dict, 'engineering.deploy.title')}
      </h2>
      <dl className={styles.stats}>
        <div>
          <dt>{t(dict, 'engineering.deploy.commit')}</dt>
          <dd data-cw-eng-commit={deploy.sha ?? ''}>
            {deploy.sha && deploy.ref ? (
              <a className={styles.link} href={commitUrl(deploy.ref)}>
                <code>{deploy.sha}</code>
              </a>
            ) : (
              t(dict, 'engineering.deploy.noCommit')
            )}
          </dd>
        </div>
        <div>
          <dt>{t(dict, 'engineering.deploy.environment')}</dt>
          <dd data-cw-eng-env={deploy.environment ?? 'local'}>{deploy.environment ?? t(dict, 'engineering.deploy.local')}</dd>
        </div>
        <div>
          <dt>{t(dict, 'engineering.deploy.builtAt')}</dt>
          <dd>
            <time dateTime={deploy.builtAt}>{dateTime(deploy.builtAt, lang)}</time>
          </dd>
        </div>
      </dl>
      <p className={styles.headline} data-cw-eng-tests={vitest ? 'report' : 'none'}>
        {testsLine(dashboard, lang, dict)}
      </p>
      <p className={styles.source}>
        <strong>{t(dict, 'engineering.source')}:</strong> {t(dict, 'engineering.deploy.source')}
        {vitest ? <> {t(dict, 'engineering.deploy.ranAt', { date: dateTime(vitest.startedAt, lang) })}</> : null}
      </p>
    </GlassSurface>
  )
}
