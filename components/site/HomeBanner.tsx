import Image from 'next/image'
import { Fragment, type CSSProperties, type ReactNode } from 'react'
import type { SiteContent } from '@/content/types'
import { AvailabilityChip } from '@/components/ui/AvailabilityChip'
import { CvActions } from '@/components/ui/CvLink'
import { cx } from '@/components/ui/cx'
import { EmailMenu } from '@/components/ui/EmailMenu'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks, GridLines, Scanline } from '@/components/ui/graphics'
import { Separator } from '@/components/ui/Separator'
import type { Locale } from '@/lib/i18n'
import { homeSocials, isExternal } from './format'
import enter from './home/Enter.module.scss'
import { HeroOrbit } from './home/HeroOrbit'
import { keepSeparators } from './home/now'
import { WINK_TIMING, winkEnd, winkScript, winkWords, type WinkWord } from './home/wink'
import { WinkPlayer } from './home/WinkPlayer'
import styles from './HomeBanner.module.scss'

const HOME_ICONS: Record<string, string> = {
  email: '/assets/icons/mailito.png',
  github: '/assets/icons/githubCircle.png',
  linkedin: '/assets/icons/linkedinCircle.png',
}

const BANNER_SCOPE = '[data-cw-home-banner]'

export type HomeBannerProps = {
  lang: Locale
  home: SiteContent['home']
  socials: SiteContent['socials']
  socialsLabel: string
  previousTitleLabel: string
  extra?: ReactNode
}

function step(index: number): CSSProperties {
  return { '--cw-home-step': index } as CSSProperties
}

function bannerVars(wink: boolean): CSSProperties {
  const sweep = { '--cw-banner-sweep-at': `${winkEnd()}ms` }
  if (!wink) return sweep as CSSProperties
  return {
    '--cw-wink-strike-at': `${WINK_TIMING.strikeAt}ms`,
    '--cw-wink-strike-ms': `${WINK_TIMING.strikeMs}ms`,
    ...sweep,
  } as CSSProperties
}

function wordStyle(word: WinkWord): CSSProperties {
  return { '--cw-wink-delay': `${word.delay}ms`, '--cw-wink-duration': `${word.duration}ms` } as CSSProperties
}

function keepHyphenated(text: string): ReactNode[] {
  return text.split(/(\S+-\S+)/u).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className={styles.nowrap}>
        {part}
      </span>
    ) : (
      part
    ),
  )
}

function SocialIcon({ id }: { id: string }) {
  return (
    <Image
      src={HOME_ICONS[id] ?? '/assets/icons/gmailIcon.png'}
      alt=""
      width={30}
      height={30}
      unoptimized
      className="cw-icon-img"
    />
  )
}

export function HomeBanner({ lang, home, socials, socialsLabel, previousTitleLabel, extra }: HomeBannerProps) {
  const links = homeSocials(socials)
  const previous = home.previousTitle?.[lang]
  const subtitle = home.subtitle?.[lang]
  const words = winkWords(home.title[lang])

  return (
    <section
      className={styles.banner}
      aria-labelledby="home-title"
      data-cw-home-banner=""
      style={bannerVars(Boolean(previous))}
    >
      {previous ? <script dangerouslySetInnerHTML={{ __html: winkScript }} /> : null}
      <HeroOrbit />
      <GlassSurface variant="subtle" edge grain depth light className={styles.card}>
        <GridLines fade="radial" />
        <Scanline axis="x" edge="bottom" delay={1400} />
        <CornerMarks inset={-12} size={18} />
        <p className={cx(styles.greeting, enter.enter)} style={step(0)}>
          <span className={styles.greetingText}>
            {home.greeting[lang]} <strong>{home.name}</strong>
          </span>
        </p>
        {previous ? (
          <p className={cx(styles.previous, enter.enter)} style={step(0.75)} data-cw-home-previous="">
            <span className="cw-visually-hidden">{`${previousTitleLabel} `}</span>
            <s className={styles.previousText}>
              {previous}
              <span className={styles.strike} aria-hidden="true" data-cw-wink-strike="" />
            </s>
          </p>
        ) : null}
        <h1 id="home-title" className={cx(styles.title, enter.enter, enter.title)} style={step(1.5)}>
          {words.map((word, index) => (
            <Fragment key={`${index}-${word.text}`}>
              {index > 0 ? ' ' : null}
              <span
                className={styles.word}
                style={wordStyle(word)}
                data-cw-wink-word=""
                data-cw-wink-last={index === words.length - 1 ? '' : undefined}
              >
                {word.text}
              </span>
            </Fragment>
          ))}
        </h1>
        {subtitle ? (
          <p className={cx(styles.subtitle, enter.enter)} style={step(2.25)} data-cw-home-subtitle="">
            {keepHyphenated(keepSeparators(subtitle))}
          </p>
        ) : null}
        <div className={cx(styles.rule, enter.enter, enter.rule)} style={step(2.75)}>
          <Separator className={styles.separator} />
        </div>
        <div className={styles.actions}>
          <div className={enter.enter} style={step(3.25)}>
            <CvActions lang={lang} downloadVariant="solid" className={styles.cvActions} />
          </div>
          {links.length > 0 ? (
            <nav aria-label={socialsLabel}>
              <ul className={styles.socials}>
                {links.map((social, index) => (
                  <li key={social.id} className={enter.enter} style={step(3.5 + index * 0.25)}>
                    {social.href.startsWith('mailto:') ? (
                      <EmailMenu
                        lang={lang}
                        email={social.href.slice('mailto:'.length)}
                        trigger={<SocialIcon id={social.id} />}
                        className={styles.social}
                      />
                    ) : (
                      <a
                        href={social.href}
                        className={styles.social}
                        aria-label={social.label[lang]}
                        {...(isExternal(social.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        <SocialIcon id={social.id} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
        <div className={cx(styles.availability, enter.enter)} style={step(4.5)}>
          <AvailabilityChip lang={lang} className={styles.chip} />
          {extra}
        </div>
        <span className={styles.sweep} aria-hidden="true" data-cw-sweep="" data-cw-home-sweep="" />
      </GlassSurface>
      {previous ? <WinkPlayer scope={BANNER_SCOPE} /> : null}
    </section>
  )
}
