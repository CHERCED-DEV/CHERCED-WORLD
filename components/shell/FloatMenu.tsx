'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { Locale } from '@/lib/i18n/config'
import styles from './FloatMenu.module.scss'
import { LangSwitch } from './LangSwitch'
import { FLOAT_MENU_ID, type NavItem } from './nav'
import { NavLinks } from './NavLinks'

export type FloatMenuProps = {
  lang: Locale
  items: NavItem[]
  labels: { nav: string; close: string; lang: string }
}

export function FloatMenu({ lang, items, labels }: FloatMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const menu = ref.current
    if (!menu) return
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === 'open') menu.querySelector<HTMLElement>('nav a[href]')?.focus()
    }
    menu.addEventListener('toggle', onToggle)
    return () => menu.removeEventListener('toggle', onToggle)
  }, [])

  const close = () => {
    const menu = ref.current
    if (menu?.matches(':popover-open')) menu.hidePopover()
  }

  return (
    <div id={FLOAT_MENU_ID} ref={ref} popover="auto" className={styles.menu} data-cw-glass="strong" data-cw-float-menu="">
      <div className={styles.top}>
        <button
          type="button"
          popoverTarget={FLOAT_MENU_ID}
          popoverTargetAction="hide"
          className={styles.close}
          aria-label={labels.close}
        >
          <Icon name="close" />
        </button>
      </div>
      <NavLinks lang={lang} items={items} label={labels.nav} variant="menu" onNavigate={close} />
      <LangSwitch lang={lang} label={labels.lang} />
      <Image
        src="/assets/icons/brandLogoX2.png"
        alt=""
        width={150}
        height={150}
        unoptimized
        className={styles.logo}
      />
    </div>
  )
}
