import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { AccountCopy } from '@/content/account'
import type { DashboardData } from '@/lib/accounts/dashboard'
import { deleteOwnAccount, signOutAccount } from '@/lib/actions/account'
import { withdrawProfile } from '@/lib/actions/profile'
import type { Locale } from '@/lib/i18n'
import { Avatar } from './Avatar'
import { CommentDelete } from './CommentDelete'
import { ConsentGate } from './ConsentGate'
import { ConversationsCard } from './ConversationsCard'
import styles from './Dashboard.module.scss'
import { PhotoCard } from './PhotoCard'
import { PreferencesCard } from './PreferencesCard'
import { ProfileCard } from './ProfileCard'

type Props = { lang: Locale; copy: AccountCopy; panelHref: string | null; data: DashboardData }

const LOCKED_ID = 'cw-account-consent'

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match))
}

function Hero({ lang, copy, panelHref, data }: Props) {
  const { account } = data
  return (
    <GlassSurface as="header" variant="standard" className={styles.hero} data-cw-account-hero="">
      <Avatar src={data.avatarSrc} name={account.name} size="lg" />
      <div className={styles.identity}>
        <p className={styles.eyebrow}>{copy.signedInTitle}</p>
        <h1 className={styles.heroName} data-cw-account-name="">
          {account.name}
        </h1>
        <p className={styles.heroEmail}>{account.email}</p>
        <dl className={styles.meta}>
          <div>
            <dt>{copy.dashboard.since}</dt>
            <dd>
              <time dateTime={account.sinceTime}>{account.since}</time>
            </dd>
          </div>
          <div>
            <dt>{copy.dashboard.lastLogin}</dt>
            <dd>
              <time dateTime={account.lastLoginTime}>{account.lastLogin}</time>
            </dd>
          </div>
          <div>
            <dt>{copy.permissions}</dt>
            <dd>
              {account.permissions.length > 0
                ? account.permissions.map((permission) => copy.permissionNames[permission]).join(' · ')
                : copy.noPermissions}
            </dd>
          </div>
        </dl>
      </div>
      <div className={styles.heroActions}>
        {panelHref ? (
          <a href={panelHref} className={buttonClassName({ variant: 'solid', size: 'sm' })} data-cw-account-panel="">
            {copy.panel}
          </a>
        ) : null}
        <form action={signOutAccount}>
          <input type="hidden" name="lang" value={lang} />
          <button type="submit" className={buttonClassName({ size: 'sm' })} data-cw-account-signout="">
            {copy.signOut}
          </button>
        </form>
      </div>
    </GlassSurface>
  )
}

function Activity({ copy, data }: Pick<Props, 'copy' | 'data'>) {
  const text = copy.dashboard
  return (
    <GlassSurface as="section" variant="standard" className={styles.card} aria-labelledby="cw-account-activity" data-cw-activity-card="">
      <header className={styles.cardHeader}>
        <h2 id="cw-account-activity" className={styles.cardTitle}>
          {text.activityTitle}
        </h2>
      </header>
      <h3 className={styles.subTitle}>{text.commentsTitle}</h3>
      {data.comments.length === 0 ? (
        <p className={styles.muted}>{text.commentsEmpty}</p>
      ) : (
        <ul className={styles.items} data-cw-own-comments="">
          {data.comments.map((comment) => (
            <li key={comment.id} className={styles.item} data-cw-own-comment={comment.id}>
              <div className={styles.itemHead}>
                <a href={comment.postHref} className={styles.itemTitle}>
                  {comment.postTitle}
                </a>
                <span className={styles.badge} data-status={comment.status}>
                  {text.commentStatus[comment.status]}
                </span>
              </div>
              <p className={styles.itemBody}>{comment.comment}</p>
              {comment.reply ? (
                <blockquote className={styles.reply}>
                  <span>{text.reply}</span>
                  {comment.reply}
                </blockquote>
              ) : null}
              <div className={styles.itemFoot}>
                <time dateTime={comment.dateTime}>{comment.date}</time>
                <CommentDelete id={comment.id} copy={text} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {data.guestPosts ? (
        <>
          <h3 className={styles.subTitle}>{text.postsTitle}</h3>
          {data.guestPosts.length === 0 ? (
            <p className={styles.muted}>{text.postsEmpty}</p>
          ) : (
            <ul className={styles.items} data-cw-guest-posts="">
              {data.guestPosts.map((post) => (
                <li key={post.id} className={styles.item} data-cw-guest-post={post.status}>
                  <div className={styles.itemHead}>
                    {post.url ? (
                      <a href={post.url} className={styles.itemTitle}>
                        {post.title}
                      </a>
                    ) : (
                      <span className={styles.itemTitle}>{post.title}</span>
                    )}
                    <span className={styles.badge} data-status={post.status}>
                      {text.postStatus[post.status]}
                    </span>
                  </div>
                  <div className={styles.itemFoot}>
                    <time dateTime={post.dateTime}>{post.date}</time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </GlassSurface>
  )
}

function Consents({ lang, copy, data }: Pick<Props, 'lang' | 'copy' | 'data'>) {
  const text = copy.dashboard
  return (
    <GlassSurface as="section" variant="standard" className={styles.card} aria-labelledby="cw-account-consents" data-cw-consents-card="">
      <header className={styles.cardHeader}>
        <h2 id="cw-account-consents" className={styles.cardTitle}>
          {text.consentsTitle}
        </h2>
      </header>
      <p className={styles.muted}>{text.consentsIntro}</p>
      <ul className={styles.consents}>
        {data.consents.map((consent) => (
          <li key={consent.kind} data-cw-consent={consent.kind}>
            <span className={styles.consentName}>{text.consentNames[consent.kind]}</span>
            <span className={styles.purpose}>
              {consent.count !== null ? (
                fill(text.consentCount, { count: consent.count, date: consent.date })
              ) : (
                <>
                  <time dateTime={consent.dateTime}>{consent.date}</time>
                  {consent.version ? ` · ${fill(text.consentVersion, { version: consent.version })}` : null}
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      {data.consented ? (
        <details className={styles.danger}>
          <summary>{text.withdraw}</summary>
          <p>{text.withdrawText}</p>
          <form action={withdrawProfile}>
            <input type="hidden" name="lang" value={lang} />
            <button type="submit" className={buttonClassName({ variant: 'ghost', size: 'sm' })} data-cw-profile-withdraw="">
              {text.withdrawConfirm}
            </button>
          </form>
        </details>
      ) : (
        <p className={styles.purpose}>{text.consentNone}</p>
      )}
    </GlassSurface>
  )
}

function YourData({ lang, copy }: Pick<Props, 'lang' | 'copy'>) {
  return (
    <GlassSurface as="section" variant="standard" className={styles.card} aria-labelledby="cw-account-data" data-cw-data-card="">
      <header className={styles.cardHeader}>
        <h2 id="cw-account-data" className={styles.cardTitle}>
          {copy.dashboard.dataTitle}
        </h2>
      </header>
      <p className={styles.muted}>{copy.dashboard.dataIntro}</p>
      <div className={styles.row}>
        <a href="/api/account/export" download className={buttonClassName({ size: 'sm' })} data-cw-account-export="">
          {copy.dashboard.download}
        </a>
      </div>
      <details className={styles.danger}>
        <summary>{copy.deleteSummary}</summary>
        <p>{copy.deleteText}</p>
        <form action={deleteOwnAccount}>
          <input type="hidden" name="lang" value={lang} />
          <button type="submit" className={buttonClassName({ variant: 'ghost', size: 'sm' })} data-cw-account-delete="">
            {copy.deleteConfirm}
          </button>
        </form>
      </details>
    </GlassSurface>
  )
}

export function AccountDashboard({ lang, copy, panelHref, data }: Props) {
  const locked = !data.consented
  return (
    <div className={styles.dashboard} data-cw-account-dashboard="">
      <Hero lang={lang} copy={copy} panelHref={panelHref} data={data} />
      {locked ? <ConsentGate lang={lang} copy={copy.dashboard} id={LOCKED_ID} privacy={copy.privacyLink} /> : null}
      <div className={styles.columns}>
        <div className={cx(styles.column, styles.main)}>
          <ProfileCard lang={lang} copy={copy.dashboard} profile={data.profile} locked={locked} lockedId={LOCKED_ID} />
          <Activity copy={copy} data={data} />
          <ConversationsCard lang={lang} consent={data.labConsent} conversations={data.conversations} />
        </div>
        <div className={styles.column}>
          <PhotoCard
            copy={copy.dashboard}
            name={data.account.name}
            photo={data.photo}
            avatarSrc={data.avatarSrc}
            uploadSrc={data.uploadSrc}
            googleSrc={data.googleSrc}
            locked={locked}
            lockedId={LOCKED_ID}
          />
          <PreferencesCard lang={lang} copy={copy.dashboard} preferences={data.preferences} locked={locked} lockedId={LOCKED_ID} />
          <Consents lang={lang} copy={copy} data={data} />
          <YourData lang={lang} copy={copy} />
        </div>
      </div>
    </div>
  )
}
