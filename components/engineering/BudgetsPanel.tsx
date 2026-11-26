import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Dashboard } from '@/lib/engineering/dashboard'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { budgetLimit, budgetValue } from './budget-format'
import { shortDate } from './format'
import { repoFileUrl } from './links'
import styles from './Engineering.module.scss'

type Props = { lang: Locale; dict: Dictionary; dashboard: Dashboard }

export const BUDGETS_SECTION_ID = 'eng-budgets'

export function BudgetsPanel({ lang, dict, dashboard }: Props) {
  return (
    <GlassSurface as="section" id={BUDGETS_SECTION_ID} className={styles.panel} aria-labelledby="eng-budgets-title" data-cw-eng-budgets="">
      <h2 id="eng-budgets-title" className={styles.h2}>
        {t(dict, 'engineering.budgets.title')}
      </h2>
      <p>{t(dict, 'engineering.budgets.intro')}</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="cw-visually-hidden">{t(dict, 'engineering.budgets.title')}</caption>
          <thead>
            <tr>
              <th scope="col">{t(dict, 'engineering.budgets.col.budget')}</th>
              <th scope="col">{t(dict, 'engineering.budgets.col.limit')}</th>
              <th scope="col">{t(dict, 'engineering.budgets.col.guard')}</th>
              <th scope="col">{t(dict, 'engineering.budgets.col.latest')}</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.budgets.map(({ budget, latest, withinLimit }) => (
              <tr key={budget.id} data-cw-eng-budget={budget.id}>
                <th scope="row">{t(dict, `engineering.budgets.name.${budget.id}`)}</th>
                <td>{budgetLimit(budget, lang, dict)}</td>
                <td>
                  <ul className={styles.ids}>
                    {budget.guards.map((guard) => (
                      <li key={guard.file}>
                        <a className={styles.link} href={repoFileUrl(guard.file, dashboard.deploy.ref)}>
                          {guard.file}
                        </a>
                      </li>
                    ))}
                  </ul>
                </td>
                <td data-cw-eng-measurement={latest ? 'yes' : 'none'}>
                  {latest ? (
                    <>
                      {t(dict, 'engineering.budgets.measured', { value: budgetValue(budget, latest.value, lang), date: shortDate(latest.date, lang), page: latest.page })}
                      {withinLimit === false ? <strong> · {t(dict, 'engineering.budgets.over')}</strong> : null}
                    </>
                  ) : (
                    t(dict, 'engineering.budgets.none')
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.muted}>{t(dict, 'engineering.budgets.a11yNote')}</p>
      <p className={styles.source}>
        <strong>{t(dict, 'engineering.source')}:</strong> {t(dict, 'engineering.budgets.source')}
      </p>
    </GlassSurface>
  )
}
