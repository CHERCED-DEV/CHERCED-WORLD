import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Dashboard } from '@/lib/engineering/dashboard'
import { TEST_KINDS } from '@/lib/engineering/tests'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { dateTime, integer } from './format'
import styles from './Engineering.module.scss'

type Props = { lang: Locale; dict: Dictionary; dashboard: Dashboard }

export const TESTS_SECTION_ID = 'eng-tests'

export function TestsPanel({ lang, dict, dashboard }: Props) {
  const { tests } = dashboard
  return (
    <GlassSurface as="section" id={TESTS_SECTION_ID} className={styles.panel} aria-labelledby="eng-tests-title" data-cw-eng-tests-panel="">
      <h2 id="eng-tests-title" className={styles.h2}>
        {t(dict, 'engineering.tests.title')}
      </h2>
      <h3 className={styles.h4}>{t(dict, 'engineering.tests.files')}</h3>
      <dl className={styles.stats}>
        {TEST_KINDS.map((kind) => (
          <div key={kind} data-cw-eng-kind={kind}>
            <dt>{t(dict, `engineering.tests.kind.${kind}`)}</dt>
            <dd className={styles.big}>{integer(tests.byKind[kind], lang)}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.muted}>{t(dict, 'engineering.tests.runs')}</p>
      <p className={styles.headline} data-cw-eng-trace={`${tests.tested}/${tests.requirements}`}>
        {t(dict, 'engineering.tests.trace', { tested: integer(tests.tested, lang), total: integer(tests.requirements, lang) })}
      </p>
      <p>{t(dict, 'engineering.tests.notCoverage')}</p>
      <p className={styles.source}>
        <strong>{t(dict, 'engineering.source')}:</strong>{' '}
        {t(dict, 'engineering.tests.source', { method: t(dict, `engineering.tests.method.${tests.source}`), date: dateTime(dashboard.builtAt, lang) })}
      </p>
    </GlassSurface>
  )
}
