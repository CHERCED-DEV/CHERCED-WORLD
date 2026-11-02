import Image from 'next/image'
import Link from 'next/link'
import type { SocialId, SocialLink } from '@/content/types'
import { cx } from '@/components/ui/cx'
import { GlowOrb, GridLines, Hairline } from '@/components/ui/graphics'
import type { Locale } from '@/lib/i18n/config'
import { BackToTop } from './BackToTop'
import { copyrightYears, type ShellLabels } from './nav'
import styles from './SiteFooter.module.scss'

export const SOCIAL_ICONS: Record<SocialId, string> = {
  linkedin: '/assets/icons/linkedInIcon.png',
  instagram: '/assets/icons/instagramIcon.png',
  github: '/assets/icons/githubCircle.png',
  email: '/assets/icons/gmailIcon.png',
  facebook: '/assets/icons/facebookIcon.png',
}

export type SiteFooterProps = { lang: Locale; socials: SocialLink[]; labels: ShellLabels }

export function SiteFooter({ lang, socials, labels }: SiteFooterProps) {
  const visible = socials.filter((social): social is SocialLink & { href: string } => social.href !== null)

  return (
    <footer id="footer" className={styles.footer} data-cw-glass="standard">
      <GridLines fade="top" />
      <GlowOrb size="md" x="50%" y="0%" />
      <Hairline glint className={styles.edgeLine} />
      <div className={cx('cw-container', styles.inner)}>
        <BackToTop label={labels.backToTop} />
        <nav aria-label={labels.social}>
          <ul className={styles.socials}>
            {visible.map((social) => {
              const external = !social.href.startsWith('mailto:')
              return (
                <li key={social.id}>
                  <a
                    href={social.href}
                    className={styles.social}
                    aria-label={social.label[lang]}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <Image src={SOCIAL_ICONS[social.id]} alt="" width={30} height={30} unoptimized className="cw-icon-img" />
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        <Hairline className={styles.divider} />
        <p className={styles.copyright}>
          <strong>
            © {copyrightYears()} {labels.author}.
          </strong>{' '}
          {labels.rights}
        </p>
        <Link href={`/${lang}/privacy`} className={styles.privacy}>
          {labels.privacy}
        </Link>
      </div>
    </footer>
  )
}
