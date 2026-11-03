import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { SiteContent } from '@/content/types'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Separator } from '@/components/ui/Separator'
import type { Locale } from '@/lib/i18n'
import { homeSocials, isExternal } from './format'
import enter from './home/Enter.module.scss'
import { HeroOrbit } from './home/HeroOrbit'
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

function step(index: number): CSSProperties {
  return { '--cw-home-step': index } as CSSProperties
}

export function HomeBanner({ lang, home, socials, socialsLabel }: HomeBannerProps) {
  const links = homeSocials(socials)

  return (
    <section className={styles.banner} aria-labelledby="home-title" data-cw-home-banner="">
      <HeroOrbit />
      <GlassSurface variant="subtle" className={styles.card}>
        <p className={cx(styles.greeting, enter.enter)} style={step(0)}>
          <span className={styles.greetingText}>
            {home.greeting[lang]} <strong>{home.name}</strong>
          </span>
        </p>
        <h1 id="home-title" className={cx(styles.title, enter.enter, enter.title)} style={step(1)}>
          {home.title[lang]}
        </h1>
        <div className={cx(styles.rule, enter.enter, enter.rule)} style={step(2)}>
          <Separator className={styles.separator} />
        </div>
        {links.length > 0 ? (
          <nav aria-label={socialsLabel}>
            <ul className={styles.socials}>
              {links.map((social, index) => (
                <li key={social.id} className={enter.enter} style={step(3 + index * 0.5)}>
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
