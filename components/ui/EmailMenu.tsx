import type { ReactNode } from 'react'
import type { Locale } from '@/lib/i18n/config'
import { EmailMenuButton, type EmailMenuLabels, type EmailMenuPlacement } from './EmailMenuButton'
import { sharedText } from './sharedText'

export type EmailMenuProps = {
  lang: Locale
  email: string
  trigger: ReactNode
  className?: string
  placement?: EmailMenuPlacement
}

export function emailMenuLabels(lang: Locale, email: string): EmailMenuLabels {
  return {
    menu: sharedText(lang, 'common', 'email.menu'),
    write: sharedText(lang, 'common', 'email.write'),
    copy: sharedText(lang, 'common', 'email.copy'),
    copied: sharedText(lang, 'common', 'email.copied'),
    copyFailed: sharedText(lang, 'experience', 'palette.copyFailed', { email }),
  }
}

export function EmailMenu({ lang, email, trigger, className, placement }: EmailMenuProps) {
  return (
    <EmailMenuButton
      email={email}
      labels={emailMenuLabels(lang, email)}
      trigger={trigger}
      className={className}
      placement={placement}
    />
  )
}
