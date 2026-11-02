import Link from 'next/link'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { deleteComment, setCommentReply, setCommentStatus } from '@/lib/actions/admin'
import type { CommentRecord } from '@/lib/data/types'
import { localizedPath } from '@/lib/i18n'
import styles from './admin.module.scss'
import { ActionButton, ConfirmButton } from './ActionButton'
import { ConsentDetail } from './ConsentDetail'
import { adminErrors, confirmLabels, formatDateTime, replyLabels, resultLabels, type AdminText } from './labels'
import { ReplyEditor } from './ReplyEditor'

function CommentItem({ comment, text, known }: { comment: CommentRecord; text: AdminText; known: boolean }) {
  const { tr, lang } = text
  const results = resultLabels(text)

  return (
    <li>
      <GlassSurface as="article" variant="subtle" className={styles.item} data-cw-comment={comment.id} data-status={comment.status}>
        <header className={styles.itemHeader}>
          <h3 className={styles.itemTitle}>{comment.userName}</h3>
          <span className={styles.badge}>{tr(`admin.status.${comment.status}`)}</span>
        </header>
        <dl className={styles.details}>
          <dt>{tr('admin.field.email')}</dt>
          <dd>{comment.email}</dd>
          <dt>{tr('admin.field.post')}</dt>
          <dd>
            {known ? (
              <Link href={localizedPath(lang, `/blog/${encodeURIComponent(comment.postId)}`)} prefetch={false}>
                {comment.postId}
              </Link>
            ) : (
              comment.postId
            )}
          </dd>
          <dt>{tr('admin.field.date')}</dt>
          <dd>
            <time dateTime={comment.createdAt.toISOString()}>{formatDateTime(comment.createdAt, lang)}</time>
          </dd>
          <ConsentDetail consentAt={comment.consentAt} text={text} />
        </dl>
        <p className={styles.body}>{comment.comment}</p>
        <div className={styles.actions}>
          {comment.status !== 'approved' ? (
            <ActionButton
              action={setCommentStatus.bind(null, comment.id, 'approved')}
              label={tr('admin.action.approve')}
              results={results}
              variant="solid"
              name="approve"
            />
          ) : null}
          {comment.status !== 'rejected' ? (
            <ActionButton action={setCommentStatus.bind(null, comment.id, 'rejected')} label={tr('admin.action.reject')} results={results} name="reject" />
          ) : null}
          <ConfirmButton
            action={deleteComment.bind(null, comment.id)}
            label={tr('admin.action.delete')}
            results={results}
            confirm={confirmLabels(text, 'comment')}
            name="delete"
          />
        </div>
        {comment.status === 'approved' ? (
          <ReplyEditor
            save={setCommentReply.bind(null, comment.id)}
            current={comment.authorReply?.text ?? null}
            labels={replyLabels(text)}
            results={results}
            errors={adminErrors(text)}
          />
        ) : null}
      </GlassSurface>
    </li>
  )
}

export function CommentList({ comments, text, postIds }: { comments: CommentRecord[]; text: AdminText; postIds: string[] }) {
  if (comments.length === 0) {
    return <p className={styles.empty}>{text.tr('admin.comments.empty')}</p>
  }
  return (
    <ul className={styles.list} data-cw-comments="">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} text={text} known={postIds.includes(comment.postId)} />
      ))}
    </ul>
  )
}
