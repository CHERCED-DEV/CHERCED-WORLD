import Link from 'next/link'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Dashboard, SpecRow } from '@/lib/engineering/dashboard'
import type { RequirementTrace } from '@/lib/engineering/tests'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { dateTime, integer, pluralKey, shortDate } from './format'
import { commitUrl, ENGINEERING_PATH, localized, repoFileUrl } from './links'
import { StatusBadge } from './SpecsTable'
import styles from './Engineering.module.scss'

type Props = { lang: Locale; dict: Dictionary; spec: SpecRow; dashboard: Dashboard }

export function testsByFile(tested: RequirementTrace['tested']): Array<{ file: string; ids: string[] }> {
  const byFile = new Map<string, string[]>()
  for (const { id, files } of tested) for (const file of files) byFile.set(file, [...(byFile.get(file) ?? []), id])
  return [...byFile.entries()].map(([file, ids]) => ({ file, ids })).sort((a, b) => b.ids.length - a.ids.length || a.file.localeCompare(b.file))
}

function Timeline({ lang, dict, spec }: Omit<Props, 'dashboard'>) {
  return (
    <GlassSurface as="section" className={styles.panel} aria-labelledby="eng-spec-timeline">
      <h2 id="eng-spec-timeline" className={styles.h2}>
        {t(dict, 'engineering.detail.timeline')}
      </h2>
      <dl className={styles.stats}>
        <div>
          <dt>{t(dict, 'engineering.detail.createdLabel')}</dt>
          <dd>{spec.created ? <time dateTime={spec.created}>{shortDate(spec.created, lang)}</time> : t(dict, 'engineering.detail.notCreated')}</dd>
        </div>
        <div>
          <dt>{t(dict, 'engineering.detail.firstFeatLabel')}</dt>
          <dd>
            {spec.firstFeat ? (
              <>
                <time dateTime={spec.firstFeat.date}>{shortDate(spec.firstFeat.date, lang)}</time> ·{' '}
                <a className={styles.link} href={commitUrl(spec.firstFeat.sha)}>
                  <code>{spec.firstFeat.sha}</code>
                </a>
              </>
            ) : (
              t(dict, 'engineering.detail.noFeat')
            )}
          </dd>
        </div>
      </dl>
      <p className={styles.headline} data-cw-eng-days={spec.days ?? ''}>
        {spec.days === null ? t(dict, 'engineering.detail.noDays') : t(dict, `engineering.detail.days.${pluralKey(spec.days, lang)}`, { count: integer(spec.days, lang) })}
      </p>
      <p className={styles.muted}>{t(dict, 'engineering.detail.daysRule')}</p>
    </GlassSurface>
  )
}

function Commits({ lang, dict, spec }: Omit<Props, 'dashboard'>) {
  return (
    <GlassSurface as="section" className={styles.panel} aria-labelledby="eng-spec-commits">
      <h2 id="eng-spec-commits" className={styles.h2}>
        {t(dict, 'engineering.detail.commits', { count: integer(spec.commits.length, lang) })}
      </h2>
      {spec.commits.length ? (
        <ol className={styles.commits} lang="es" data-cw-eng-commits="">
          {spec.commits.map((commit) => (
            <li key={commit.sha}>
              <a className={styles.link} href={commitUrl(commit.sha)}>
                <code>{commit.sha}</code>
              </a>
              <time dateTime={commit.date}>{shortDate(commit.date, lang)}</time>
              {commit.subject}
            </li>
          ))}
        </ol>
      ) : (
        <p data-cw-eng-no-commits="">{t(dict, 'engineering.detail.noCommits')}</p>
      )}
    </GlassSurface>
  )
}

function Requirements({ lang, dict, spec, dashboard }: Props) {
  const { tested, untested } = spec.trace
  return (
    <GlassSurface as="section" className={styles.panel} aria-labelledby="eng-spec-requirements">
      <h2 id="eng-spec-requirements" className={styles.h2}>
        {spec.requirements.length
          ? t(dict, 'engineering.detail.requirements', { tested: integer(tested.length, lang), total: integer(spec.requirements.length, lang) })
          : t(dict, 'engineering.detail.noRequirements')}
      </h2>
      {tested.length ? (
        <>
          <h3 className={styles.h4}>{t(dict, 'engineering.detail.byFile')}</h3>
          <ul className={styles.ids} data-cw-eng-tested="">
            {testsByFile(tested).map(({ file, ids }) => (
              <li key={file}>
                <a className={styles.link} href={repoFileUrl(file, dashboard.deploy.ref)}>
                  {file}
                </a>
                : <code>{ids.join(', ')}</code>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {untested.length ? (
        <>
          <h3 className={styles.h4}>{t(dict, 'engineering.detail.untested', { count: integer(untested.length, lang) })}</h3>
          <p data-cw-eng-untested="">
            <code>{untested.join(', ')}</code>
          </p>
        </>
      ) : null}
      {spec.requirements.length ? <p className={styles.muted}>{t(dict, 'engineering.tests.notCoverage')}</p> : null}
    </GlassSurface>
  )
}

export function SpecDetail({ lang, dict, spec, dashboard }: Props) {
  return (
    <div className={styles.board} data-cw-engineering="" data-cw-eng-spec={spec.number}>
      <header className={styles.header}>
        <Link className={styles.back} href={localized(lang, ENGINEERING_PATH)}>
          ← {t(dict, 'engineering.detail.back')}
        </Link>
        <h1 className={styles.h1}>
          {spec.number} — <span lang="es">{spec.title}</span>
        </h1>
        <p>
          <StatusBadge dict={dict} status={spec.status} />
        </p>
        {spec.statusText ? (
          <p className={styles.quote}>
            <strong>{t(dict, 'engineering.detail.statusLine')}:</strong> <span lang="es">{spec.statusText}</span>
          </p>
        ) : (
          <p className={styles.quote}>{t(dict, 'engineering.detail.noStatusLine')}</p>
        )}
        {spec.main ? (
          <p className={styles.wrap}>
            <a className={styles.link} href={repoFileUrl(spec.main, dashboard.deploy.ref)}>
              {t(dict, 'engineering.detail.link')}
            </a>{' '}
            <code>{spec.main}</code>
          </p>
        ) : null}
      </header>
      <Timeline lang={lang} dict={dict} spec={spec} />
      <Commits lang={lang} dict={dict} spec={spec} />
      <Requirements lang={lang} dict={dict} spec={spec} dashboard={dashboard} />
      <p className={styles.source}>
        <strong>{t(dict, 'engineering.source')}:</strong> {t(dict, 'engineering.specs.source')}{' '}
        {dashboard.history
          ? t(dict, 'engineering.specs.history', { date: dateTime(dashboard.history.takenAt, lang), sha: dashboard.history.head, count: integer(dashboard.history.commits, lang) })
          : t(dict, 'engineering.specs.noHistory')}
      </p>
    </div>
  )
}
