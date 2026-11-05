import { consentLabels } from '@/components/contact/labels'
import { getApprovedComments, submitComment } from '@/lib/actions/comments'
import type { PublicComment } from '@/lib/data/types'
import { localizedPath, t, type Dictionary, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { commentFormLabels } from '../labels'
import { reactionLabels } from '../reactions/labels'
import { Reactions } from '../reactions/Reactions'
import { CommentDialog } from './CommentDialog'
import { CommentList } from './CommentList'
import styles from './Comments.module.scss'

export const COMMENTS_SECTION_ID = 'cw-comments'

async function loadComments(postId: string): Promise<PublicComment[] | null> {
  try {
    return await getApprovedComments(postId)
  } catch {
    return null
  }
}

export async function CommentsSection({
  lang,
  postId,
  blog,
  common,
}: {
  lang: Locale
  postId: string
  blog: Dictionary
  common: Dictionary
}) {
  const [comments, site] = await Promise.all([loadComments(postId), getDictionary(lang, 'site')])
  const author = t(common, 'brand.author')

  return (
    <section id={COMMENTS_SECTION_ID} className={styles.section} aria-labelledby="cw-comments-title">
      <div className={styles.head}>
        <h2 id="cw-comments-title" className={styles.title}>
          {t(blog, 'comments.title')}
        </h2>
        <CommentDialog
          action={submitComment}
          postId={postId}
          lang={lang}
          privacyHref={localizedPath(lang, '/privacy')}
          labels={commentFormLabels(blog, common)}
          consent={consentLabels(common, t(site, 'a11y.newTab'))}
        />
      </div>
      <Reactions postId={postId} lang={lang} labels={reactionLabels(blog)} />
      {comments === null ? (
        <p className={styles.notice} data-cw-comments-state="error">
          {t(blog, 'comments.loadError')}
        </p>
      ) : comments.length === 0 ? (
        <p className={styles.notice} data-cw-comments-state="empty">
          {t(blog, 'comments.empty')}
        </p>
      ) : (
        <CommentList
          comments={comments}
          lang={lang}
          labels={{
            authorBadge: t(blog, 'comments.authorBadge'),
            authorName: author,
            replyLabel: t(blog, 'comments.replyLabel', { author }),
          }}
        />
      )}
    </section>
  )
}
