'use client'

import { cx } from '@/components/ui/cx'
import { Icon } from '@/components/ui/Icon'
import type { AccountPanelCopy } from '@/content/account'
import type { ActionResult } from '@/lib/actions/result'
import styles from './Dashboard.module.scss'

export function ActionNotice({ result, copy, success }: { result: ActionResult<unknown> | null; copy: AccountPanelCopy; success: string }) {
  if (!result) return null
  const text = result.ok ? success : copy.actionErrors[result.error]
  return (
    <p
      role={result.ok ? 'status' : 'alert'}
      className={cx(styles.notice, !result.ok && styles.noticeError)}
      data-cw-panel-notice={result.ok ? 'ok' : result.error}
    >
      <Icon name={result.ok ? 'check' : 'alert'} size={16} />
      <span>{text}</span>
    </p>
  )
}
