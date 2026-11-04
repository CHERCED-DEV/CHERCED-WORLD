import Image from 'next/image'
import { cx } from '@/components/ui/cx'
import { Hairline } from '@/components/ui/graphics'
import { Icon } from '@/components/ui/Icon'
import type { Locale } from '@/lib/i18n/config'
import { BackLink } from './BackLink'
import controls from './controls.module.scss'
import { LangSwitch } from './LangSwitch'
import { MailboxLink } from './MailboxLink'
import { FLOAT_MENU_ID, type NavItem, type ShellLabels } from './nav'
import { NavLinks } from './NavLinks'
import { PaletteTrigger } from './PaletteTrigger'
import { SelfLink } from './SelfLink'
import styles from './SiteHeader.module.scss'
import { ThemeToggle } from './ThemeToggle'

export type SiteHeaderProps = { lang: Locale; items: NavItem[]; labels: ShellLabels }

export function SiteHeader({ lang, items, labels }: SiteHeaderProps) {
  return (
    <header id="header" className={styles.header} data-cw-glass="standard">
      <div className={cx('cw-container', styles.inner)}>
        <div className={styles.start}>
          <SelfLink href={`/${lang}`} className={styles.logo} aria-label={labels.home}>
            <Image src="/assets/icons/brandLogo.png" alt="" width={44} height={44} priority unoptimized />
          </SelfLink>
          <BackLink label={labels.back} />
        </div>
        <NavLinks lang={lang} items={items} label={labels.nav} variant="bar" />
        <div className={styles.actions}>
          <PaletteTrigger label={labels.palette} hint={labels.paletteHint} />
          <LangSwitch lang={lang} label={labels.lang} className={styles.desktopOnly} />
          <MailboxLink lang={lang} labels={{ name: labels.mailbox, one: labels.mailboxOne, many: labels.mailboxMany }} />
          <ThemeToggle label={labels.themeDark} />
          <button
            type="button"
            popoverTarget={FLOAT_MENU_ID}
            className={cx(controls.iconButton, styles.menuButton)}
            aria-label={labels.menuOpen}
            data-cw-menu-button=""
          >
            <Icon name="menu" />
          </button>
        </div>
      </div>
      <Hairline glint className={styles.edgeLine} />
    </header>
  )
}
