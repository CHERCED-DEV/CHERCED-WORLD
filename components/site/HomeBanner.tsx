import Image from 'next/image'
import type { SiteContent } from '@/content/types'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Separator } from '@/components/ui/Separator'
import type { Locale } from '@/lib/i18n'
import { homeSocials, isExternal } from './format'
import styles from './HomeBanner.module.scss'

const HOME_ICONS: Record<string, string> = {
  email: '/assets/icons/mailito.png',
  github: '/assets/icons/githubCircle.png',
  linkedin: '/assets/icons/linkedinCircle.png',
}

export type HomeBannerProps = {
  lang: Locale
  home: SiteContent['home']
  socials: SiteContent['socials']
  socialsLabel: string
}

export function HomeBanner({ lang, home, socials, socialsLabel }: HomeBannerProps) {
  const links = homeSocials(socials)

  return (
    <section className={styles.banner} aria-labelledby="home-title" data-cw-home-banner="">
      <GlassSurface variant="subtle" className={styles.card}>
        <p className={styles.greeting}>
          {home.greeting[lang]} <strong>{home.name}</strong>
        </p>
        <h1 id="home-title" className={styles.title}>
          {home.title[lang]}
        </h1>
        <Separator className={styles.separator} />
        {links.length > 0 ? (
          <nav aria-label={socialsLabel}>
            <ul className={styles.socials}>
              {links.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.href}
                    className={styles.social}
                    aria-label={social.label[lang]}
                    {...(isExternal(social.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <Image
                      src={HOME_ICONS[social.id] ?? '/assets/icons/gmailIcon.png'}
                      alt=""
                      width={30}
                      height={30}
                      unoptimized
                      className="cw-icon-img"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </GlassSurface>
    </section>
  )
}
