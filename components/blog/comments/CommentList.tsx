import { commentDateTime, formatCommentDate } from '@/lib/blog/format'
import type { PublicComment } from '@/lib/data/types'
import type { Locale } from '@/lib/i18n'
import styles from './Comments.module.scss'

export type CommentListLabels = { authorBadge: string; authorName: string; replyLabel: string }

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

function CommentDate({ value, lang }: { value: Date | string; lang: Locale }) {
  const date = asDate(value)
  if (Number.isNaN(date.getTime())) return null
  return (
    <time className={styles.date} dateTime={commentDateTime(date)}>
      {formatCommentDate(date, lang)}
    </time>
  )
}

export function CommentList({ comments, lang, labels }: { comments: PublicComment[]; lang: Locale; labels: CommentListLabels }) {
  return (
    <ol className={styles.list} data-cw-comment-list="">
      {comments.map((comment) => (
        <li key={comment.id} className={styles.item} data-cw-comment={comment.id}>
          <article className={styles.comment}>
            <header className={styles.meta}>
              <p className={styles.author}>{comment.userName}</p>
              <span className={styles.rule} aria-hidden="true" />
              <CommentDate value={comment.createdAt} lang={lang} />
            </header>
            <p className={styles.text}>{comment.comment}</p>
            {comment.authorReply ? (
              <div role="group" aria-label={labels.replyLabel} className={styles.reply} data-cw-author-reply="">
                <p className={styles.meta}>
                  <span className={styles.badge}>{labels.authorBadge}</span>
                  <span className={styles.author}>{labels.authorName}</span>
                  <span className={styles.rule} aria-hidden="true" />
                  <CommentDate value={comment.authorReply.createdAt} lang={lang} />
                </p>
                <p className={styles.text}>{comment.authorReply.text}</p>
              </div>
            ) : null}
          </article>
        </li>
      ))}
    </ol>
  )
}
