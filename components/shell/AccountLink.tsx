'use client'

import { useSyncExternalStore } from 'react'
import { cx } from '@/components/ui/cx'
import { Icon } from '@/components/ui/Icon'
import { hasAuthorHint } from '@/lib/auth/author-hint'
import { hasReaderHint } from '@/lib/auth/reader-hint'
import type { Locale } from '@/lib/i18n/config'
import controls from './controls.module.scss'
import { SelfLink } from './SelfLink'

function subscribeToNothing(): () => void {
  return () => {}
}

function readSignedIn(): boolean {
  return hasReaderHint(document.cookie) || hasAuthorHint(document.cookie)
}

export function AccountLink({ lang, labels }: { lang: Locale; labels: { signIn: string; account: string } }) {
  const signedIn = useSyncExternalStore(subscribeToNothing, readSignedIn, () => false)
  const label = signedIn ? labels.account : labels.signIn
  return (
    <SelfLink
      href={`/${lang}/account`}
      prefetch={false}
      className={cx(controls.iconButton, controls.account)}
      aria-label={label}
      title={label}
      data-cw-account-link=""
      data-cw-signed-in={signedIn ? '' : undefined}
    >
      <Icon name="user" />
    </SelfLink>
  )
}
