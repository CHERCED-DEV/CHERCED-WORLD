import type { Dashboard } from '@/lib/engineering/dashboard'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { BUDGETS_SECTION_ID, BudgetsPanel } from './BudgetsPanel'
import { DELIVERY_SECTION_ID, DeliveryPanel } from './DeliveryPanel'
import { DEPLOY_SECTION_ID, DeployStrip } from './DeployStrip'
import { EVALS_SECTION_ID, EvalsPanel } from './EvalsPanel'
import { SPECS_SECTION_ID, SpecsTable } from './SpecsTable'
import { SPEND_SECTION_ID } from './spend-config'
import { SpendSection } from './SpendSection'
import { TESTS_SECTION_ID, TestsPanel } from './TestsPanel'
import styles from './Engineering.module.scss'

type Props = { lang: Locale; dict: Dictionary; dashboard: Dashboard; spend: { targetUsd: number; capUsd: number } }

export function engineeringSections(dict: Dictionary): Array<{ id: string; label: string }> {
  return [
    { id: DEPLOY_SECTION_ID, label: t(dict, 'engineering.deploy.title') },
    { id: SPECS_SECTION_ID, label: t(dict, 'engineering.specs.title') },
    { id: TESTS_SECTION_ID, label: t(dict, 'engineering.tests.title') },
    { id: DELIVERY_SECTION_ID, label: t(dict, 'engineering.delivery.title') },
    { id: EVALS_SECTION_ID, label: t(dict, 'engineering.evals.title') },
    { id: SPEND_SECTION_ID, label: t(dict, 'engineering.spend.title') },
    { id: BUDGETS_SECTION_ID, label: t(dict, 'engineering.budgets.title') },
  ]
}

export function EngineeringDashboard({ lang, dict, dashboard, spend }: Props) {
  return (
    <div className={styles.board} data-cw-engineering="">
      <header className={styles.header}>
        <h1 className={styles.h1}>{t(dict, 'engineering.title')}</h1>
        <p className={styles.lead}>{t(dict, 'engineering.lead')}</p>
        <p className={styles.muted}>{t(dict, 'engineering.timezone')}</p>
      </header>
      <DeployStrip lang={lang} dict={dict} dashboard={dashboard} />
      <SpecsTable lang={lang} dict={dict} dashboard={dashboard} />
      <TestsPanel lang={lang} dict={dict} dashboard={dashboard} />
      <DeliveryPanel lang={lang} dict={dict} dashboard={dashboard} />
      <EvalsPanel lang={lang} dict={dict} dashboard={dashboard} />
      <SpendSection lang={lang} dict={dict} targetUsd={spend.targetUsd} capUsd={spend.capUsd} />
      <BudgetsPanel lang={lang} dict={dict} dashboard={dashboard} />
    </div>
  )
}
